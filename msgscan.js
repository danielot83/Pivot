// Busca literales pasados a showMessage/alert/confirm/prompt/_t/setMsg... y comprueba con el traductor REAL (fr) si tienen traducción.
const fs = require("fs"), path = require("path");
const { open } = require("./harness");
const pages = process.argv.slice(2);
const FUNCS = "showMessage|alert|confirm|prompt|_t|setStatus|showToast|setMsg|flash|notify|toast|showError|showSuccess";
(async () => {
  for (const pg of pages) {
    const src = fs.readFileSync(path.join(__dirname, "..", "Pivot-main", pg + ".html"), "utf8");
    const found = new Map();
    const re = new RegExp("\\b(?:" + FUNCS + ")\\(\\s*(?:\\()?\\s*([\"'`])((?:\\\\.|(?!\\1)[\\s\\S])*?)\\1", "g");
    let m; while ((m = re.exec(src))) {
      let s = m[2].replace(/\\n/g, "\n").replace(/\\(["'`])/g, "$1");
      const isT = /_t\($/.test(src.slice(Math.max(0, m.index - 0), m.index + 3)) || m[0].startsWith("_t(");
      s = s.replace(/\$\{[^}]*\}/g, "{x}");
      if (!/[A-Za-z]{3}/.test(s)) continue;
      const line = src.slice(0, m.index).split("\n").length;
      if (!found.has(s)) found.set(s, { line, isT });
    }
    const h = await open(pg, "fr"); await h.page.waitForTimeout(250);
    const res = await h.page.evaluate((arr) => arr.map((s) => {
      const k = s.replace(/\{x\}/g, "{x}"); const ctxCut = k.indexOf("||");
      const t = pivotI18n.t(k.replace(/\{x\}/g, "{x}"));
      // sustituye {x} por una muestra para probar plantillas
      const sample = k.replace(/\{x\}/g, "Sample");
      const t2 = pivotI18n.t(sample);
      return [s, t === k || t2 === sample];
    }), [...found.keys()]);
    const miss = res.filter(([, bad]) => bad).map(([s]) => s);
    console.log(`== ${pg}: ${found.size} literales, ${miss.length} sin traducir`);
    miss.forEach((s) => console.log("   L" + found.get(s).line + (found.get(s).isT ? " [_t]" : "") + ": " + s.slice(0, 150).replace(/\n/g, "\\n")));
    await h.close();
  }
})();
