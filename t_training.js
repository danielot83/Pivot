const { open } = require("./harness");
const lang = process.argv[2] || "fr";
(async () => {
  const h = await open("training", lang, { query: "?i18n_debug=1" }); const { page } = h;
  await page.waitForTimeout(300);
  await page.evaluate(async () => {
    const base = { organization_id: "o1", season: "2026-2027", team: "Senior", team_category: null, team_gender: "Female" }, db = window.__DB;
    db.players = [{ id: "p1", first_name: "Ana", last_name: "Pérez", active: true, ...base }, { id: "p2", first_name: "Luc", last_name: "Martin", active: true, ...base }];
    db["rpc:visible_exercises"] = [
      { id: "x1", name: "3-man weave", number: 1, categories: ["Passing", "Fast break"], material: ["Balls", "Cones"], objectives: ["Passing on the move", "Finish"], description: "d", variants: "v", diagram: null, difficulty: 2, language: "en", favorite: true, age: ["U12", "All ages"], created_by: "u1", organization_id: "o1", visibility: "team" },
      { id: "x2", name: "Layups", number: 2, categories: ["Shooting"], material: ["Balls"], objectives: ["Finish"], description: "", variants: "", diagram: null, difficulty: 1, language: "en", favorite: false, age: ["U10"], created_by: "u1", organization_id: "o1", visibility: "team" },
    ];
    db["rpc:visible_trainings"] = [{ id: "t1", date: "2026-10-05", title: "Week 6", visibility: "team", organization_id: "o1", season: "2026-2027", team: "Senior", number: 1, team_category: null, team_gender: "Female" }, { id: "t9", date: "2026-10-06", title: "Other club", visibility: "community", organization_id: "o2", season: "2026-2027", team: "X", number: 1 }];
    db.profiles = [{ id: "u1", full_name: "Dani O" }];
    currentOrgId = "o1"; myRole = "admin"; myOrgIds = new Set(["o1"]); currentUserId = "u1";
    currentSeason = "2026-2027"; currentTeam = "Senior"; currentTeamCategory = ""; currentTeamGender = "Female";
    lastTreeRows = [{ season: "2026-2027", team: "Senior", team_category: null, team_gender: "Female" }];
    await loadExerciseOptions();
    await loadTeamPlayers(); await loadTrainingsList(); updateSelectedSummaryCard && updateSelectedSummaryCard();
    newTraining();
    els.title.value = "Tuesday practice"; els.coach1.value = "Marc"; els.category.value = "U18"; els.players.value = "12";
    addExerciseToSession("x1"); addExerciseToSession("x2");
    sessionExercises.push({ is_pause: true, name: "Pause", duration_minutes: 5, key_points: [], session_variants: "" });
    sessionExercises.push({ is_match: true, match_format: "5v5", name: "Match 5v5", duration_minutes: 15, key_points: [], session_variants: "" });
    sessionExercises.push({ is_freetext: true, name: "Team talk", duration_minutes: 5, key_points: [], session_variants: "" });
    renderSessionTable(); updateDurationBanner(); syncSummaryChecklists();
    document.querySelector("#tr-main-objective-options input") && (document.querySelector("#tr-main-objective-options input").checked = true);
    attendance = {}; 
  });
  await page.waitForTimeout(200);
  const dom = await page.evaluate(() => {
    const t = (s) => [...document.querySelectorAll(s)].map((e) => e.textContent.replace(/\s+/g, " ").trim());
    return {
      list: t("#trainings-list tr"), listHead: t("#trainings-table thead th"),
      area: document.getElementById("training-area").innerText.replace(/\s+/g, " ").slice(0, 3500),
      banner: document.getElementById("duration-banner") && document.getElementById("duration-banner").textContent,
      addSelect: [...document.querySelectorAll("#add-exercise-select option, #ex-select option")].map((o) => o.textContent).slice(0, 4),
    };
  });
  console.log(JSON.stringify(dom, null, 1));
  await page.evaluate(async () => { await saveTraining(); });
  await page.waitForTimeout(300);
  console.log("MSG:", await page.evaluate(() => document.getElementById("msg").textContent));
  const w = await page.evaluate(() => JSON.stringify(window.__WRITES || []));
  console.log("WRITES:", w.slice(0, 1800));
  require("fs").writeFileSync(`/tmp/tr_writes_${lang}.json`, w);
  // PDF
  const out = await page.evaluate(async () => {
    const texts = []; const Orig = window.jspdf.jsPDF;
    window.jspdf.jsPDF = function (...a) { const d = new Orig(...a); const tx = d.text.bind(d); d.text = (s, ...r) => { texts.push(Array.isArray(s) ? s.join("/") : String(s)); return tx(s, ...r); }; d.save = (n) => { texts.push("FILE:" + n); }; return d; };
    window.jspdf.jsPDF.prototype = Orig.prototype;
    try { await exportToPdf(); await exportWholeBook(); } catch (e) { texts.push("EXC:" + e.message); }
    return texts;
  });
  console.log("PDF:", out.join(" ¦ ").slice(0, 2500));
  await page.click("#help-btn").catch(() => {}); await page.waitForTimeout(100);
  console.log("HELP:", (await page.evaluate(() => (document.getElementById("help-box") || {}).textContent || "")).replace(/\s+/g, " ").slice(0, 300));
  console.log("MISSING:", JSON.stringify(await page.evaluate(() => pivotI18n.missing())).slice(0, 1800));
  console.log("ERRORS:", h.errors);
  await h.close();
})();
