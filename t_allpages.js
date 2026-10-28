const { open } = require("./harness");
(async () => {
  const pages = "index login module assessment attendance compare dashboard exercises help library match play_design play_library roster settings stats training".split(" ");
  for (const p of pages) for (const l of ["en", "fr", "es"]) {
    const h = await open(p, l, { keepInit: false });
    await h.page.waitForTimeout(300);
    const r = await h.page.evaluate(() => ({ lang: document.documentElement.lang, sw: document.querySelectorAll("[data-pivot-lang],.pivot-lang").length, nav: (document.querySelector(".sidebar, nav") || {}).innerText && (document.querySelector(".sidebar, nav").innerText.split("\n").slice(0, 3).join("/")) }));
    console.log(p.padEnd(13), l, JSON.stringify(r), h.errors.length ? "ERR " + h.errors.join(";") : "ok");
    await h.close();
  }
})();
