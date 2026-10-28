const { open } = require("./harness");
const lang = process.argv[2] || "fr";
(async () => {
  const h = await open("play_design", lang, { query: "?i18n_debug=1" }); const { page } = h;
  const dialogs = [];
  page.on("dialog", async (d) => { dialogs.push(d.type() + ":" + d.message()); await d.accept(d.type() === "prompt" ? "7" : undefined); });
  await page.waitForTimeout(300);
  await page.evaluate(async () => {
    const db = window.__DB;
    const base = { organization_id: "o1", season: "2026-2027", team: "Senior", team_category: null, team_gender: "Female" };
    db.players = [{ id: "p1", first_name: "Ana", last_name: "P", active: true, ...base }];
    db.teams = [{ ...base }];
    db.plays = [
      { id: "pl1", name: "Horns flare", season: "2026-2027", team: "Senior", category: "Half-court offense", visibility: "team", organization_id: "o1", created_by: "u1", language: "en", diagram: { steps: [{ courtType: "full", note: "", points: [], actions: [], branches: null }, { courtType: "half", note: "1 passes", points: [{ id: "a", type: "player", x: 0.4, y: 0.5, label: "1", color: "#111" }], actions: [], branches: [{ id: "b1", name: "Variante A", color: "#e11", steps: [{ courtType: "half", note: "", points: [], actions: [], branches: null }] }] }] } },
      { id: "pl2", name: "Zone press", season: "2026-2027", team: "Senior", category: null, visibility: "private", organization_id: "o1", created_by: "u2", language: "en", diagram: { steps: [] } },
      { id: "pl3", name: "Foreign play", season: "2026-2027", team: "Senior", category: "Defense", visibility: "community", organization_id: "o2", created_by: "u9", language: "en", diagram: { steps: [] } },
    ];
    db.profiles = [{ id: "u1", full_name: "Dani O" }, { id: "u2", full_name: "Marc" }];
    currentOrgId = "o1"; currentUserId = "u1"; myRole = "admin"; myOrgIds = new Set(["o1"]);
    currentSeason = "2026-2027"; currentTeam = "Senior"; currentTeamCategory = ""; currentTeamGender = "Female";
    try { await loadTree(); } catch (e) { console.log("loadTree", e.message); }
    await loadTeamPlayersCount(); await loadPlaysList(); updateSelectedSummaryCard();
  });
  await page.waitForTimeout(250);
  const snap = async (label, sel) => console.log(label, JSON.stringify(await page.evaluate((s) => (s ? document.querySelector(s) : document.body).innerText.replace(/\s+/g, " ").slice(0, 2200), sel)));
  await snap("LIST");
  await page.evaluate(async () => { await openPlay("pl1"); });
  await page.waitForTimeout(150);
  await snap("OPEN", null);
  await page.evaluate(() => { currentStepIndex = 1; buildStepTabs(); });
  console.log("HINT:", await page.evaluate(() => els.stepHint.textContent));
  console.log("BRANCH:", await page.evaluate(() => (document.getElementById("branch-crumbs").innerText + " | " + (document.getElementById("branch-hint") || { innerText: "" }).innerText).replace(/\s+/g, " ")));
  await page.evaluate(() => { document.querySelector(".branch-tab, #branch-row .branch-tab, [class*=branch]") && 0; });
  await page.evaluate(() => addBranchOption(1)); await page.waitForTimeout(100);
  console.log("HINT2:", await page.evaluate(() => els.stepHint.textContent + " || " + (document.getElementById("branch-hint") || {}).textContent + " || " + document.getElementById("branch-crumbs").innerText.replace(/\s+/g, " ")));
  console.log("GIFBTN:", await page.evaluate(() => document.getElementById("download-gif-btn").textContent + " / " + document.getElementById("download-gif-combined-btn").textContent));
  await page.evaluate(() => { activeTool = "player"; });
  await page.evaluate(() => { branchPath = []; currentStepIndex = 1; buildStepTabs(); deleteBranch(1, document.querySelector(".del-branch").dataset.id); });
  await page.evaluate(() => { branchPath = []; currentStepIndex = 0; buildStepTabs(); selectedElement = null; deleteSelectedElement(); });
  console.log("MSG-del:", await page.evaluate(() => els.msg.textContent));
  console.log("GIFMSG:", await page.evaluate(() => [gifRecordingMessage(1, 3), gifRecordingMessage(2, 5, _t("option {i} of {n}: {label}", { i: 1, n: 2, label: "V" }))].join(" | ")));
  await page.evaluate(async () => { els.playName.value = "My play"; els.playCategory.value = "Out of bounds"; await savePlay(); });
  await page.waitForTimeout(200);
  console.log("MSG-save:", await page.evaluate(() => els.msg.textContent));
  await page.evaluate(async () => { await startFromPlay("pl1"); });
  console.log("MSG-start:", await page.evaluate(() => els.msg.textContent + " | name=" + els.playName.value));
  await page.evaluate(async () => { await openPlay("pl3"); });
  console.log("MSG-foreign:", await page.evaluate(() => els.msg.textContent));
  await page.evaluate(() => newPlay());
  console.log("MSG-new:", await page.evaluate(() => els.msg.textContent));
  await page.evaluate(async () => { els.playName.value = ""; await savePlay(); });
  console.log("MSG-noname:", await page.evaluate(() => els.msg.textContent));
  await page.evaluate(async () => { await deletePlay("pl2"); });
  await page.evaluate(async () => { await deleteTeamSeason("2026-2027", "Senior", ""); });
  await page.evaluate(() => document.getElementById("help-btn").click());
  await snap("HELP", "#help-box");
  await page.evaluate(() => { try { openEditTeamDialog(); } catch (e) {} });
  await page.waitForTimeout(100);
  await snap("EDITTEAM", "body");
  await page.evaluate(() => document.querySelectorAll("[style*=fixed]").forEach((e) => e.remove()));
  await page.evaluate(async () => { await openPlay("pl1"); });
  const pdf = await page.evaluate(async () => {
    const texts = []; const Orig = window.jspdf.jsPDF;
    window.jspdf.jsPDF = function (...a) { const d = new Orig(...a); const tx = d.text.bind(d); d.text = (s, ...r) => { texts.push(Array.isArray(s) ? s.join("/") : String(s)); return tx(s, ...r); }; d.save = (n) => { texts.push("FILE:" + n); }; return d; };
    window.jspdf.jsPDF.prototype = Orig.prototype;
    try { await exportToPdf(); } catch (e) { texts.push("EXC:" + e.message); }
    return texts;
  });
  console.log("PDF:", pdf.join(" ¦ ").slice(0, 900));
  const w = await page.evaluate(() => JSON.stringify((window.__WRITES || []).map((x) => [x[0], x[1], x[2]])));
  console.log("WRITES:", w.slice(0, 1800));
  require("fs").writeFileSync(`/tmp/pd_writes_${lang}.json`, w);
  console.log("DIALOGS:", dialogs);
  console.log("MISSING:", JSON.stringify(await page.evaluate(() => pivotI18n.missing())).slice(0, 3500));
  console.log("ERRORS:", h.errors);
  await h.close();
})();
