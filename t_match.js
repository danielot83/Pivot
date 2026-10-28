const { open } = require("./harness");
const lang = process.argv[2] || "fr";
(async () => {
  const h = await open("match", lang, { query: "?i18n_debug=1" }); const { page } = h;
  await page.waitForTimeout(300);
  await page.evaluate(async () => {
    const base = { organization_id: "o1", season: "2026-2027", team: "Senior", team_category: null, team_gender: "Female" }, db = window.__DB;
    db.players = [{ id: "p1", first_name: "Ana", last_name: "Pérez", jersey_number: "7", active: true, ...base }, { id: "p2", first_name: "Luc", last_name: "Martin", jersey_number: "9", active: true, ...base }];
    db["rpc:visible_matches"] = [
      { id: "m1", date: "2026-10-03", opponent: "Rivals", location: "Hall A", comments: "Final", team_score: 70, opponent_score: 65, visibility: "team", organization_id: "o1", season: "2026-2027", team: "Senior", team_category: null, team_gender: "Female" },
      { id: "m2", date: "2026-10-10", opponent: "Lions", location: "", comments: "", team_score: 50, opponent_score: 61, visibility: "team", organization_id: "o1", season: "2026-2027", team: "Senior", team_category: null, team_gender: "Female" },
      { id: "m3", date: "2026-10-17", opponent: "Tigers", location: "", comments: "", team_score: 55, opponent_score: 55, visibility: "team", organization_id: "o1", season: "2026-2027", team: "Senior", team_category: null, team_gender: "Female" },
      { id: "m4", date: "2026-10-24", opponent: "", location: "", comments: "", team_score: null, opponent_score: null, visibility: "team", organization_id: "o1", season: "2026-2027", team: "Senior", team_category: null, team_gender: "Female" },
    ];
    currentOrgId = "o1"; myRole = "admin"; myOrgIds = new Set(["o1"]); currentUserId = "u1";
    currentSeason = "2026-2027"; currentTeam = "Senior"; currentTeamCategory = ""; currentTeamGender = "Female";
    await loadTeamPlayers(); await loadMatchesList(); renderTableHeads && renderTableHeads();
    newMatch();
    els.matchOpponent.value = "Rivals"; els.matchLocation.value = "Hall B"; els.matchHomeAway.value = "away"; els.matchTeamScore.value = "70"; els.matchOpponentScore.value = "65"; els.matchReferee.value = "Ref X"; els.matchComments.value = "Semifinal";
    statsByPlayer.p1.called_up = true; statsByPlayer.p1.started = true; statsByPlayer.p1.points = 20; statsByPlayer.p1.rebounds = 5; statsByPlayer.p1.minutes = 30;
    opponentStats.push({ player_name: "Bob", jersey_number: "4", started: false, minutes: null, points: 12, rebounds: 3, assists: 1, fouls: 2, periods_played: null, made_1: 0, made_2: 6, made_3: 0, custom_stats: {} });
    renderCallupTable(); renderOpponentStats(); renderCallupTotalRow();
  });
  await page.waitForTimeout(200);
  const dom = await page.evaluate(() => {
    const t = (s) => [...document.querySelectorAll(s)].map((e) => e.textContent.replace(/\s+/g, " ").trim());
    return { list: t("#matches-list tr, #matches-body tr"), area: document.getElementById("match-area").innerText.replace(/\s+/g, " ").slice(0, 3800) };
  });
  console.log(JSON.stringify(dom, null, 1));
  await page.evaluate(async () => { await saveMatch(); });
  await page.waitForTimeout(300);
  console.log("MSG:", await page.evaluate(() => els.msg.textContent));
  const w = await page.evaluate(() => JSON.stringify(window.__WRITES || []));
  console.log("WRITES:", w.slice(0, 1500));
  require("fs").writeFileSync(`/tmp/m_writes_${lang}.json`, w);
  const out = await page.evaluate(async () => {
    const texts = []; const Orig = window.jspdf.jsPDF;
    window.jspdf.jsPDF = function (...a) { const d = new Orig(...a); const tx = d.text.bind(d); d.text = (s, ...r) => { texts.push(Array.isArray(s) ? s.join("/") : String(s)); return tx(s, ...r); }; d.save = (n) => { texts.push("FILE:" + n); }; return d; };
    window.jspdf.jsPDF.prototype = Orig.prototype;
    try { await exportToPdf(); await exportBlankPdf(); } catch (e) { texts.push("EXC:" + e.message); }
    return texts;
  });
  console.log("PDF:", out.join(" ¦ ").slice(0, 2600));
  await page.click("#help-btn"); await page.waitForTimeout(100);
  console.log("HELP:", (await page.evaluate(() => document.getElementById("help-box").textContent.replace(/\s+/g, " "))).slice(0, 260));
  console.log("MISSING:", JSON.stringify(await page.evaluate(() => pivotI18n.missing())).slice(0, 2200));
  console.log("ERRORS:", h.errors);
  await h.close();
})();
