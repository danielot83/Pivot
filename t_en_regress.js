const { open } = require("./harness"); const path = require("path");
const pre = path.join(__dirname, "..", "snapshot_pre_i18n");
const seed = async (page, name) => {
  if (name !== "stats") return;
  await page.evaluate(async () => {
    const base = { organization_id: "o1", season: "2026-2027", team: "Senior", team_category: null, team_gender: "Female" }, db = window.__DB;
    db.matches = [{ id: "m1", date: "2026-10-03", opponent: "Rivals", location: "home", team_score: 70, opponent_score: 65, visibility: "team", ...base },{ id: "m2", date: "2026-10-10", opponent: "Lions", location: "away", team_score: 50, opponent_score: 61, visibility: "team", ...base },{ id: "m3", date: "2026-10-17", opponent: "Tigers", location: "home", team_score: 55, opponent_score: 55, visibility: "team", ...base },{ id: "m4", date: "2026-10-24", opponent: "Bears", location: "home", team_score: null, opponent_score: null, visibility: "team", ...base }];
    db.players = [{ id: "p1", first_name: "Ana", last_name: "Pérez", jersey_number: "7", active: true, ...base },{ id: "p2", first_name: "Luc", last_name: "Martin", jersey_number: "9", active: true, ...base }];
    db.match_player_stats = [{ match_id: "m1", player_id: "p1", points: 20, rebounds: 5, assists: 3, fouls: 2, minutes: 30, made_1: 4, made_2: 6, made_3: 2, periods_played: 4 },{ match_id: "m2", player_id: "p1", points: 10, rebounds: 2, assists: 1, fouls: 3, minutes: 25, made_1: 2, made_2: 4, made_3: 0, periods_played: 3 },{ match_id: "m1", player_id: "p2", points: 8, rebounds: 9, assists: 0, fouls: 1, minutes: 20, made_1: 0, made_2: 4, made_3: 0, periods_played: 2 }];
    db.match_opponent_stats = [{ match_id: "m1", points: 65, rebounds: 30, assists: 10, fouls: 12 }];
    db.trainings = [{ id: "t1", ...base }, { id: "t2", ...base }]; db.events = [{ id: "e1", ...base }];
    db.attendance = [{ id: "a1", training_id: "t1", player_id: "p1", status: "present" }, { id: "a2", training_id: "t1", player_id: "p2", status: "absent" }, { id: "a3", match_id: "m1", player_id: "p1", status: "late" }];
    currentOrgId = "o1"; myRole = "admin"; currentTeamCategory = ""; currentTeamGender = "Female";
    lastTreeRows = [{ season: "2026-2027", team: "Senior", team_category: null, team_gender: "Female" }];
    await selectSeasonTeam("2026-2027", "Senior");
  });
  await page.waitForTimeout(500);
};
(async () => {
  let bad = 0;
  for (const name of ["stats", "attendance", "roster", "dashboard"]) {
    const out = [];
    for (const root of [pre, undefined]) {
      const h = await open(name, "en", root ? { root } : {});
      await h.page.waitForTimeout(400); await seed(h.page, name);
      out.push((await h.page.evaluate(() => document.body.innerText.replace(/[ \t]+/g, " ").trim())).split("\n").map((l) => l.trim()).filter((l) => l && !/^(EN|FR|ES)$/.test(l)).join("\n"));
      const attrs = await h.page.evaluate(() => [...document.querySelectorAll("[title],[placeholder],[aria-label]")].filter((e) => !e.closest(".pivot-lang, [data-pivot-lang]") && !/^(English|Français|Español)$/.test(e.getAttribute("title") || "") && e.getAttribute("aria-label") !== "Language").map((e) => (e.getAttribute("title") || "") + "|" + (e.getAttribute("placeholder") || "") + "|" + (e.getAttribute("aria-label") || "")).join("\n"));
      out.push(attrs);
      await h.close();
    }
    // out: [preText, preAttrs, curText, curAttrs]
    const same = out[0] === out[2] && out[1] === out[3];
    console.log(name, same ? "IDENTICAL" : "DIFF");
    if (!same) { bad++; const a = out[0].split("\n"), b = out[2].split("\n"); a.forEach((l, i) => { if (l !== b[i]) console.log("  pre:", l.slice(100,400), "\n  cur:", (b[i]||"").slice(100,400)); }); const aa=out[1].split("\n"), bb=out[3].split("\n"); aa.forEach((l,i)=>{ if(l!==bb[i]) console.log("  attr pre:",l,"\n  attr cur:",bb[i]); }); }
  }
  process.exit(bad ? 1 : 0);
})();
