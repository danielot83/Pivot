const { open } = require("./harness");
(async () => {
  const [page_, lang, w, out] = process.argv.slice(2);
  const h = await open(page_, lang, { viewport: { width: +w, height: 800 } });
  await h.page.waitForTimeout(300);
  await h.page.screenshot({ path: out });
  console.log(h.errors);
  await h.close();
})();
