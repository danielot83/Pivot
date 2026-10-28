const { open } = require("./harness");
(async () => {
  const h = await open("stats", "en"); const p = h.page; await p.waitForTimeout(300);
  await p.evaluate(() => { const o = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === "pivot_lang") window.name = "set:" + v; return o.call(this, k, v); }; });
  await Promise.all([p.waitForNavigation(), p.click("#pivot-lang-switch button:has-text('FR')")]);
  await p.waitForTimeout(300);
  console.log("window.name after click+reload:", await p.evaluate(() => window.name));
  await h.close();
})();
