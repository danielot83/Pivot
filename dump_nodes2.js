// node dump_nodes2.js pagina "clic1;clic2" "selector contenedor" -> textos completos tras hacer clic (en inglés)
const { open } = require("./harness");
(async () => {
  const [page, clicks, sel] = [process.argv[2], (process.argv[3] || "").split(";").filter(Boolean), process.argv[4] || "body"];
  const h = await open(page, "en"); const p = h.page; await p.waitForTimeout(300);
  for (const c of clicks) { await p.evaluate((c) => { const e = document.querySelector(c); if (e) e.click(); }, c); await p.waitForTimeout(150); }
  const out = await p.evaluate((sel) => { const res = []; document.querySelectorAll(sel).forEach((root) => { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const t = n.nodeValue.replace(/\s+/g, " ").trim(); if (t && /[A-Za-z]/.test(t)) res.push(t); } }); return res; }, sel);
  out.forEach((t) => console.log(t)); await h.close();
})();
