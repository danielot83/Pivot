# uso: python3 tools/gen_from_gap.py nombre  -> lee i18n_src/_dumps/<nombre>_gap.txt + i18n_src/_gen/<nombre>.py (ROWS) y escribe i18n_src/<nombre>_gap.txt
import os, sys, importlib.util
base = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "i18n_src")
name = sys.argv[1]
en = [l for l in open(os.path.join(base, "_dumps", name + "_gap.txt"), encoding="utf8").read().split("\n") if l.strip()]
spec = importlib.util.spec_from_file_location("g", os.path.join(base, "_gen", name + ".py")); g = importlib.util.module_from_spec(spec); spec.loader.exec_module(g)
rows = g.ROWS
if len(rows) != len(en):
    print("LONGITUD DISTINTA: gap", len(en), "filas", len(rows))
    for i in range(min(len(en), len(rows))):
        if not en[i].startswith(rows[i][0]):
            print("primer desajuste en", i + 1, repr(en[i][:60]), "vs", repr(rows[i][0])); break
    sys.exit(1)
out = ["# Generado por tools/gen_from_gap.py -- no editar a mano"]
for i, (hint, fr, es) in enumerate(rows):
    if not en[i].startswith(hint):
        print("DESAJUSTE en línea", i + 1, repr(en[i][:70]), "vs hint", repr(hint)); sys.exit(1)
    if fr is None or es is None: continue
    out.append(" ||| ".join([en[i], fr, es]))
open(os.path.join(base, name + "_gap.txt"), "w", encoding="utf8").write("\n".join(out) + "\n")
print("ok", len(out) - 1, "entradas de", len(en))
