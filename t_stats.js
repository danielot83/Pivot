const { open } = require("./harness");
(async () => {
  const lang = process.argv[2] || "fr";
  const h = await open("stats", lang, { query: "?i18n_debug=1" });
  const { page } = h;
  await page.evaluate(async () => {
    const base = { organization_id: "o1", season: "2026-2027", team: "Senior", team_category: null, team_gender: "Female" };
    const db = window.__DB;
    db.matches = [
      { id: "m1", date: "2026-10-03", opponent: "Rivals", location: "home", team_score: 70, opponent_score: 65, visibility: "team", ...base },
      { id: "m2", date: "2026-10-10", opponent: "Lions", location: "away", team_score: 50, opponent_score: 61, visibility: "team", ...base },
      { id: "m3", date: "2026-10-17", opponent: "Tigers", location: "home", team_score: 55, opponent_score: 55, visibility: "team", ...base },
      { id: "m4", date: "2026-10-24", opponent: "Bears", location: "home", team_score: null, opponent_score: null, visibility: "team", ...base },
    ];
    db.players = [
      { id: "p1", first_name: "Ana", last_name: "Pérez", jersey_number: "7", active: true, ...base },
      { id: "p2", first_name: "Luc", last_name: "Martin", jersey_number: "9", active: true, ...base },
    ];
    db.match_player_stats = [
      { match_id: "m1", player_id: "p1", points: 20, rebounds: 5, assists: 3, fouls: 2, minutes: 30, made_1: 4, made_2: 6, made_3: 2, periods_played: 4 },
      { match_id: "m2", player_id: "p1", points: 10, rebounds: 2, assists: 1, fouls: 3, minutes: 25, made_1: 2, made_2: 4, made_3: 0, periods_played: 3 },
      { match_id: "m1", player_id: "p2", points: 8, rebounds: 9, assists: 0, fouls: 1, minutes: 20, made_1: 0, made_2: 4, made_3: 0, periods_played: 2 },
    ];
    db.match_opponent_stats = [{ match_id: "m1", points: 65, rebounds: 30, assists: 10, fouls: 12 }, { match_id: "m2", points: 61, rebounds: 33, assists: 12, fouls: 15 }];
    db.trainings = [{ id: "t1", ...base }, { id: "t2", ...base }];
    db.events = [{ id: "e1", ...base }];
    db.attendance = [
      { id: "a1", training_id: "t1", player_id: "p1", status: "present" }, { id: "a2", training_id: "t1", player_id: "p2", status: "absent" },
      { id: "a3", training_id: "t2", player_id: "p1", status: "late" }, { id: "a4", match_id: "m1", player_id: "p1", status: "present" },
    ];
    currentOrgId = "o1"; myRole = "admin"; currentTeamCategory = ""; currentTeamGender = "Female";
    lastTreeRows = [{ season: "2026-2027", team: "Senior", team_category: null, team_gender: "Female" }];
    await selectSeasonTeam("2026-2027", "Senior");
  });
  await page.waitForTimeout(600);
  const dom = await page.evaluate(() => {
    const txt = (s) => [...document.querySelectorAll(s)].map((e) => e.textContent.replace(/\s+/g, " ").trim());
    return {
      sel: document.getElementById("selected-sub") && document.getElementById("selected-sub").textContent,
      tiles: txt(".stat-tile"),
      playerHead: txt("#player-table thead th, #players-table thead th"),
      attHead: txt("#att-table-head th"),
      attRow: txt("#att-table-body tr"),
      attHint: document.getElementById("att-hint").textContent,
      statsContent: document.getElementById("stats-content").innerText.replace(/\s+/g, " ").slice(0, 2500),
    };
  });
  console.log(JSON.stringify(dom, null, 1));
  await page.click("#help-btn"); await page.waitForTimeout(100);
  console.log("HELP:", (await page.evaluate(() => document.getElementById("help-box").textContent.replace(/\s+/g, " ").trim())).slice(0, 400));
  await page.click("#player-columns-btn"); await page.waitForTimeout(100);
  console.log("COLS:", JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("#player-columns-panel label")].map((l) => l.textContent.trim()))));
  console.log("MISSING:", JSON.stringify(await page.evaluate(() => pivotI18n.missing())));
  console.log("ERRORS:", h.errors);
  await h.close();
})();
