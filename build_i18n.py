#!/usr/bin/env python3
"""Construye i18n-fr.js e i18n-es.js a partir de i18n_src/*.py (cada uno define T = {"English": ("Français", "Español")})."""
import importlib.util, glob, json, os, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = os.path.join(root, "i18n_src"); out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, "Pivot-main")
fr, es, dup, bad = {}, {}, [], []
for f in sorted(glob.glob(os.path.join(src, "*.py"))):
    spec = importlib.util.spec_from_file_location(os.path.basename(f)[:-3], f); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    for k, v in m.T.items():
        key = " ".join(k.split())
        if not (isinstance(v, tuple) and len(v) == 2): bad.append((f, k)); continue
        if key in fr and (fr[key], es[key]) != v: dup.append((key, os.path.basename(f)))
        fr[key], es[key] = v
        # placeholders must match
        import re
        ph = sorted(re.findall(r"\{\w+\}", key))
        for lang, val in zip(("fr", "es"), v):
            if sorted(re.findall(r"\{\w+\}", val)) != ph: bad.append((f, key + " -> " + lang))
# formato texto: "English ||| Français ||| Español" (una por línea; \n = salto de línea; # = comentario)
import re
for f in sorted(glob.glob(os.path.join(src, "*.txt"))):
    for n, line in enumerate(open(f, encoding="utf-8"), 1):
        line = line.rstrip("\n")
        if not line.strip() or line.lstrip().startswith("#"): continue
        parts = [x.strip() for x in line.split("|||")]
        if len(parts) != 3 or not all(parts): bad.append((os.path.basename(f), n, line[:60])); continue
        key = " ".join(parts[0].split()); v = (parts[1].replace("\\n", "\n"), parts[2].replace("\\n", "\n"))
        if key in fr and (fr[key], es[key]) != v: dup.append((key, os.path.basename(f)))
        fr[key], es[key] = v
        ph = sorted(re.findall(r"\{\w+\}", key))
        for lang, val in zip(("fr", "es"), v):
            if sorted(re.findall(r"\{\w+\}", val)) != ph: bad.append((os.path.basename(f), n, key[:50] + " -> " + lang))
for lang, d in (("fr", fr), ("es", es)):
    with open(os.path.join(out, f"i18n-{lang}.js"), "w", encoding="utf-8") as fh:
        fh.write("/* Generado desde i18n_src — no editar a mano. */\nwindow.PIVOT_I18N_DICT = window.PIVOT_I18N_DICT || {};\nwindow.PIVOT_I18N_DICT[%s] = " % json.dumps(lang))
        fh.write(json.dumps(d, ensure_ascii=False, indent=0, sort_keys=True)); fh.write(";\n")
print(len(fr), "entradas;", "conflictos:", dup, "problemas:", bad)
