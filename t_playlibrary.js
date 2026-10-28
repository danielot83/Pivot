const { open } = require("./harness");
const lang = process.argv[2] || "fr";
(async () => {
  const h = await open("play_library", lang, { query: "?i18n_debug=1" }); const { page } = h;
  page.on("dialog", async (d) => { console.log("DIALOG", d.type(), d.message()); await d.accept(); });
  await page.waitForTimeout(300);
  await page.evaluate(async () => {
    const db = window.__DB;
    const D = { steps: [{ courtType: "half", note: "", points: [{ id: "a", type: "player", x: 0.4, y: 0.5, label: "1", color: "#111" }], actions: [], branches: null }] };
    db["rpc:visible_plays"] = [
      { id: "pl1", name: "Horns flare", team: "Senior", category: "Defense", visibility: "team", organization_id: "o1", created_by: "u1", language: "en", diagram: D },
      { id: "pl2", name: "Zone press", team: null, category: null, visibility: "private", organization_id: "o1", created_by: "u2", language: "fr", diagram: { steps: [] } },
      { id: "pl3", name: "Foreign", team: "U12", category: "Out of bounds", visibility: "community", organization_id: "o2", created_by: "u9", language: "es", diagram: D },
    ];
    db.profiles = [{ id: "u1", full_name: "Dani O" }, { id: "u2", full_name: "Marc" }];
    currentOrgId = "o1"; currentUserId = "u1"; myRole = "admin"; myOrgIds = new Set(["o1"]);
    await loadPlays();
  });
  await page.waitForTimeout(200);
  const body = async (l) => console.log(l, JSON.stringify(await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 1500))));
  await body("LIST");
  await page.evaluate(() => selectPlay("pl1")); console.log("D1", await page.evaluate(() => els.detailCard.innerText.replace(/\s+/g, " ")));
  await page.evaluate(() => selectPlay("pl2")); console.log("D2", await page.evaluate(() => els.detailCard.innerText.replace(/\s+/g, " ")));
  await page.evaluate(() => selectPlay("pl3")); console.log("D3", await page.evaluate(() => els.detailCard.innerText.replace(/\s+/g, " ")));
  await page.evaluate(() => { els.search.value = "zzz"; refresh(); document.getElementById("random-btn").click(); });
  console.log("MSG", await page.evaluate(() => els.msg.textContent));
  await page.evaluate(() => document.getElementById("reset-filters-btn").click());
  await page.evaluate(async () => { await deletePlay(allPlays.find((x) => x.id === "pl1")); });
  console.log("MSG", await page.evaluate(() => els.msg.textContent));
  await page.evaluate(() => { const b = document.getElementById("help-btn"); b && b.click(); });
  console.log("WRITES", await page.evaluate(() => JSON.stringify(window.__WRITES)));
  console.log("MISSING:", JSON.stringify(await page.evaluate(() => pivotI18n.missing())).slice(0, 3000));
  console.log("ERRORS:", h.errors);
  await h.close();
})();
