// uso: node dump_nodes.js pagina "selector1,selector2" -> imprime cada nodo de texto (completo) de esos contenedores en inglés
const { open } = require("./harness");
(async () => {
  const [page, sels] = [process.argv[2], process.argv[3] || "body"];
  const h = await open(page, "en"); await h.page.waitForTimeout(300);
  const out = await h.page.evaluate((sels) => {
    const res = [];
    document.querySelectorAll(sels).forEach((root) => {
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let n; while ((n = w.nextNode())) { const t = n.nodeValue.replace(/\s+/g, " ").trim(); if (t && /[A-Za-z]/.test(t)) res.push(t); }
    });
    return res;
  }, sels);
  out.forEach((t) => console.log(t));
  await h.close();
})();
