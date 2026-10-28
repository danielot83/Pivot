// Textos EN del DOM que, en FR, se traducen vía plantilla "{x}" (posibles aciertos falsos). uso: node tplhits.js pagina "sel1;sel2"
const { open } = require("./harness");
(async () => {
  const [pg, clicks] = [process.argv[2], (process.argv[3] || "").split(";").filter(Boolean)];
  const grab = async (lang) => {
    const h = await open(pg, lang); const p = h.page; await p.waitForTimeout(300);
    for (const c of clicks) { await p.evaluate((c) => { document.querySelectorAll(c).forEach((e) => e.click()); }, c); await p.waitForTimeout(150); }
    const out = await p.evaluate(() => {
      const out = new Set(); const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) { if (n.parentElement && /^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentElement.tagName)) continue; const t = n.nodeValue.replace(/\s+/g, " ").trim(); if (t && /[A-Za-z]{2}/.test(t)) out.add(t); }
      document.querySelectorAll("[title],[placeholder]").forEach((e) => ["title", "placeholder"].forEach((a) => { const v = e.getAttribute(a); if (v) out.add(v.trim()); }));
      return [...out];
    });
    await h.close(); return out;
  };
  const en = await grab("en");
  const h = await open(pg, "fr"); await h.page.waitForTimeout(300);
  const res = await h.page.evaluate((arr) => arr.map((t) => [t, pivotI18n.via(t), pivotI18n.t(t)]).filter(([, v]) => v.startsWith("tpl:")), en);
  res.forEach(([t, v, o]) => console.log(v.slice(4).slice(0, 40).padEnd(40), "<=", t.slice(0, 80), " => ", o.slice(0, 80)));
  await h.close();
})();
