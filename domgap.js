// Lista (completa) de textos del DOM en inglés SIN traducción al francés, tras cargar la página y hacer los clics indicados.
// uso: node domgap.js pagina "sel1;sel2" > out.txt
const { open } = require("./harness");
(async () => {
  const [pg, clicks] = [process.argv[2], (process.argv[3] || "").split(";").filter(Boolean)];
  const grab = async (lang) => {
    const h = await open(pg, lang, { query: process.env.Q || "" }); const p = h.page; await p.waitForTimeout(300);
    for (const c of clicks) { await p.evaluate((c) => { document.querySelectorAll(c).forEach((e) => e.click()); }, c); await p.waitForTimeout(150); }
    const out = await p.evaluate(() => {
      const res = []; const walk = (root) => { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { if (n.parentElement && (/^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentElement.tagName) || n.parentElement.closest("#pivot-lang-switch,#pivot-lang-switch-m"))) continue; const t = n.nodeValue.replace(/\s+/g, " ").trim(); if (t) res.push(["T", t]); } };
      walk(document.body);
      document.querySelectorAll("[title],[placeholder],[aria-label],[alt]").forEach((e) => ["title", "placeholder", "aria-label", "alt"].forEach((a) => { const v = e.getAttribute(a); if (v && v.trim()) res.push(["A", v.replace(/\s+/g, " ").trim()]); }));
      return res;
    });
    await h.close(); return out;
  };
  const en = await grab("en");
  const seen = new Set(); const uniq = en.filter(([k, t]) => /[A-Za-z]{2}/.test(t) && !seen.has(t) && seen.add(t)).map(([, t]) => t);
  const h = await open(pg, process.argv[4] || "fr", { query: process.env.Q || "" }); await h.page.waitForTimeout(300);
  // sin traducción = el traductor no cambia nada Y no existe una clave exacta (así una palabra igual en FR pero distinta en ES no se escapa)
  const gaps = await h.page.evaluate((arr) => arr.filter((s) => pivotI18n.t(s) === s && pivotI18n.via(s) !== "direct"), uniq);
  await h.close();
  gaps.forEach((s) => console.log(s));
  console.error(`${pg}: ${uniq.length} textos únicos, ${gaps.length} sin traducir`);
})();
