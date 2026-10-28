const { open } = require("./harness");
(async () => {
  const lang = process.argv[2] || "fr";
  const h = await open("attendance", lang, { query: "?i18n_debug=1" });
  const { page } = h;
  await page.evaluate(() => {
    const db = window.__DB, base = { organization_id: "o1", season: "2026-2027", team: "Senior", team_category: null, team_gender: null };
    db.players = [{ id: "p1", first_name: "Ana", last_name: "Pérez", active: true, ...base }, { id: "p2", first_name: "Luc", last_name: "Martin", active: true, ...base }];
    db.matches = [{ id: "m1", date: "2026-09-12", opponent: "Rivals", ...base }, { id: "m2", date: "2026-09-19", opponent: "", ...base }];
    db.trainings = [{ id: "t1", date: "2026-09-10", title: "", ...base }, { id: "t2", date: "2026-09-11", title: "Week 3", ...base }];
    db.events = [{ id: "e1", date: "2026-09-15", title: "", ...base }];
    db.attendance = [{ id: "a1", player_id: "p1", match_id: "m1", status: "present" }, { id: "a2", player_id: "p2", match_id: "m1", status: "late" }, { id: "a3", player_id: "p1", training_id: "t1", status: "excused" }, { id: "a4", player_id: "p2", training_id: "t1", status: "absent" }];
    currentOrgId = "o1"; filterSeason = "2026-2027"; filterTeam = "Senior"; filterTeamCategory = ""; filterTeamGender = "";
    els.orgName = els.orgName || { textContent: "Club Test" };
  });
  await page.evaluate(() => loadAttendanceGrid());
  await page.waitForTimeout(300);
  const dom = await page.evaluate(() => ({
    heads: [...document.querySelectorAll("thead .att-date-head")].map((t) => t.textContent.replace(/\s+/g, " ").trim() + " | " + t.title),
    cells: [...document.querySelectorAll("tbody tr")].map((tr) => [...tr.children].map((c) => c.textContent.trim()).join(" ")),
    seg: [...document.querySelectorAll("#att-seg button")].map((b) => b.textContent.trim()),
    legend: document.querySelector(".att-legend").textContent.replace(/\s+/g, " ").trim(),
  }));
  console.log(JSON.stringify(dom, null, 1));
  // help box
  await page.click("#help-btn"); await page.waitForTimeout(100);
  console.log("HELP:", (await page.evaluate(() => document.getElementById("help-box").textContent.replace(/\s+/g, " ").trim())).slice(0, 700));
  // add event dialog
  await page.click("#add-event-btn"); await page.waitForTimeout(100);
  console.log("DIALOG:", (await page.evaluate(() => [...document.querySelectorAll("body > div")].pop().innerText.replace(/\s+/g, " "))).slice(0, 400));
  // click status cell and type buttons
  const missing = await page.evaluate(() => pivotI18n.missing());
  console.log("MISSING:", JSON.stringify(missing));
  console.log("ERRORS:", h.errors);
  await h.close();
})();
