const { open } = require("./harness");
const lang = process.argv[2] || "fr";
(async () => {
  const h = await open("assessment", lang, { query: "?i18n_debug=1", realXlsx: true }); const { page } = h;
  const dialogs = [];
  page.on("dialog", async (d) => { dialogs.push(d.type() + ":" + d.message()); await d.accept(); });
  await page.waitForTimeout(300);
  await page.evaluate(async () => {
    const db = window.__DB;
    const base = { organization_id: "o1", season: "2026-2027", team: "Senior", team_category: null, team_gender: "Female" };
    db.players = [{ id: "p1", first_name: "Ana", last_name: "Pérez", active: true, ...base }, { id: "p2", first_name: "Luc", last_name: "Martin", active: false, ...base }];
    db.teams = [{ ...base }];
    const r = emptyRatings(); r.technique.dribble[0] = 4; r.technique.dribble[1] = 3; r.intelligence.sans_ballon[2] = 5; r.personnalite.attitude[0] = 2;
    db.player_assessments = [{ id: "a1", player_id: "p1", organization_id: "o1", date: "2026-09-20", location: "Hall A", ratings: r, visibility: "team", language: "en", positive_points: "Fast", negative_points: "Left hand", to_improve: "Defense", height_player: "170", height_father: "180", height_mother: "165" }];
    db.player_tracking_entries = [
      { id: "t1", player_id: "p1", criterion: "Sprint 20m", unit: "sec", date: "2026-09-01", result: 4.2, evaluation: "ok" },
      { id: "t2", player_id: "p1", criterion: "Sprint 20m", unit: "sec", date: "2026-10-01", result: 4.0, evaluation: "" },
    ];
    buildForm(); buildChart();
    currentOrgId = "o1"; myRole = "admin"; currentSeason = "2026-2027"; currentTeam = "Senior"; currentTeamCategory = ""; currentTeamGender = "Female";
    try { await loadTree(); } catch (e) { console.log("tree", e.message); }
    await loadPlayersIntoSelect();
    els.playerSelect.value = "p1"; await loadHistory(); await loadTracking();
  });
  await page.waitForTimeout(250);
  const body = async (l, sel) => console.log(l, JSON.stringify(await page.evaluate((s) => (s ? document.querySelector(s) : document.body).innerText.replace(/\s+/g, " ").slice(0, 2600), sel)));
  await body("LIST");
  await page.evaluate(async () => { await openExisting("a1"); });
  await body("FORM", "#form-area");
  await page.evaluate(() => { els.advancedToggle.checked = true; applyAdvancedVisibility(); });
  console.log("AVG", await page.evaluate(() => document.getElementById("avg-technique").textContent));
  await page.evaluate(async () => { await saveAssessment(); });
  await page.waitForTimeout(200);
  console.log("MSG-save", await page.evaluate(() => els.msg.textContent));
  await page.evaluate(() => { els.playerSelect.value = ""; openNew(); });
  console.log("MSG-nopl", await page.evaluate(() => els.msg.textContent));
  await page.evaluate(() => { els.playerSelect.value = "p1"; openNew(); document.getElementById("ai-response-input").value = "technique.dribble.0: 4\ntechnique.dribble.1: 5"; document.getElementById("fill-from-ai-btn").click(); });
  console.log("MSG-ai", await page.evaluate(() => els.msg.textContent));
  await page.evaluate(() => { document.getElementById("ai-response-input").value = "nothing"; document.getElementById("fill-from-ai-btn").click(); });
  console.log("MSG-ai2", await page.evaluate(() => els.msg.textContent));
  await page.evaluate(() => { document.getElementById("ai-response-input").value = ""; document.getElementById("fill-from-ai-btn").click(); });
  console.log("MSG-ai3", await page.evaluate(() => els.msg.textContent));
  await page.evaluate(() => { document.getElementById("copy-ai-prompt-btn").click(); });
  await page.waitForTimeout(200);
  console.log("MSG-copy", await page.evaluate(() => els.msg.textContent));
  // tracking
  await page.evaluate(() => { document.getElementById("add-tracking-btn").click(); });
  await body("TRACKFORM", "#tracking-form");
  await page.evaluate(async () => { document.getElementById("save-tracking-btn").click(); });
  console.log("MSG-t1", await page.evaluate(() => els.msg.textContent));
  await page.evaluate(async () => { document.getElementById("tracking-criterion").value = "Sprint 20m"; document.getElementById("save-tracking-btn").click(); });
  console.log("MSG-t2", await page.evaluate(() => els.msg.textContent));
  await page.evaluate(async () => { document.getElementById("tracking-result").value = "abc"; document.getElementById("save-tracking-btn").click(); });
  await page.evaluate(async () => { document.getElementById("tracking-result").value = "3.9"; document.getElementById("save-tracking-btn").click(); });
  await page.waitForTimeout(200);
  console.log("MSG-t3", await page.evaluate(() => els.msg.textContent));
  await page.evaluate(async () => { await deleteTrackingEntry("t1"); });
  await body("TRACK", "#tracking-card");
  await page.evaluate(() => document.getElementById("help-btn").click());
  await page.evaluate(async () => { els.playerSelect.value = "p1"; await exportHistoryToExcel(); });
  console.log("XLSX", await page.evaluate(() => { const w = window.__xlsxData; return JSON.stringify({ name: window.__xlsx, sheets: w && w.SheetNames, rows: w && XLSX.utils.sheet_to_json(w.Sheets[w.SheetNames[0]]) }); }));
  const pdf = await page.evaluate(async () => {
    const texts = []; const Orig = window.jspdf.jsPDF;
    window.jspdf.jsPDF = function (...a) { const d = new Orig(...a); const tx = d.text.bind(d); d.text = (s, ...r) => { texts.push(Array.isArray(s) ? s.join("/") : String(s)); return tx(s, ...r); }; d.save = (n) => { texts.push("FILE:" + n); }; return d; };
    window.jspdf.jsPDF.prototype = Orig.prototype;
    try { await openExisting("a1"); els.advancedToggle.checked = true; await generatePdf(); } catch (e) { texts.push("EXC:" + e.message); }
    return texts;
  });
  console.log("PDF:", pdf.join(" ¦ ").slice(0, 1800));
  await page.evaluate(async () => { await deleteTeamSeason("2026-2027", "Senior", ""); });
  const w = await page.evaluate(() => JSON.stringify((window.__WRITES || []).map((x) => [x[0], x[1], x[2]])));
  console.log("WRITES:", w.slice(0, 2500));
  require("fs").writeFileSync(`/tmp/as_writes_${lang}.json`, w);
  console.log("DIALOGS:", dialogs);
  console.log("MISSING:", JSON.stringify(await page.evaluate(() => pivotI18n.missing())).slice(0, 4000));
  console.log("ERRORS:", h.errors);
  await h.close();
})();
