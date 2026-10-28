// EN con i18n == página original (snapshot_pre_i18n), en el estado inicial de CADA página.
const { open } = require("./harness"); const path = require("path");
const pre = path.join(__dirname, "..", "snapshot_pre_i18n");
const pages = [["index", ""], ["login", ""], ["module", "?m=roster"], ["module", "?m=stats"], ["module", "?m=nope"], "assessment attendance compare dashboard exercises help library match play_design play_library roster settings stats training".split(" ").map((p) => [p, ""])].flat(1);
const list = [["index", ""], ["login", ""], ["module", "?m=roster"], ["module", "?m=stats"], ["module", "?m=nope"], ...("assessment attendance compare dashboard exercises help library match play_design play_library roster settings stats training".split(" ").map((p) => [p, ""]))];
(async () => {
  let bad = 0;
  for (const [name, query] of list) {
    const out = [];
    for (const root of [pre, undefined]) {
      const h = await open(name, "en", { ...(root ? { root } : {}), query });
      await h.page.waitForTimeout(500);
      out.push((await h.page.evaluate(() => document.body.innerText.replace(/[ \t]+/g, " ").trim())).split("\n").map((l) => l.trim()).filter((l) => l && !/^(EN|FR|ES)$/.test(l)).join("\n"));
      out.push(await h.page.evaluate(() => document.title + "\n" + [...document.querySelectorAll("[title],[placeholder],[aria-label],[alt]")].filter((e) => !e.closest("[id^=pivot-lang]") && !/^(English|Français|Español)$/.test(e.getAttribute("title") || "") && e.getAttribute("aria-label") !== "Language").map((e) => ["title", "placeholder", "aria-label", "alt"].map((a) => e.getAttribute(a) || "").join("|")).join("\n")));
      await h.close();
    }
    const same = out[0] === out[2] && out[1] === out[3];
    console.log((name + query).padEnd(22), same ? "IDENTICAL" : "DIFF");
    if (!same) { bad++; const a = (out[0] + "\n--A--\n" + out[1]).split("\n"), b = (out[2] + "\n--A--\n" + out[3]).split("\n"); a.forEach((l, i) => { if (l !== b[i]) console.log("  pre:", l.slice(0, 300), "\n  cur:", (b[i] || "").slice(0, 300)); }); }
  }
  process.exit(bad ? 1 : 0);
})();
