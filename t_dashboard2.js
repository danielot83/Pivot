const { open } = require("./harness");
(async () => {
  const lang = process.argv[2] || "fr";
  const h = await open("dashboard", lang, { query: "?i18n_debug=1" });
  const { page } = h;
  await page.evaluate(async () => {
    const db = window.__DB;
    db.matches = [{ id: "m1", date: "2026-10-12", opponent: "Rivals", team: "Senior", season: "2026-2027", organization_id: "o1", team_category: null, team_gender: null }];
    db.trainings = []; db.events = [];
    db.players = [{ id: "p1", team: "Senior", season: "2026-2027", organization_id: "o1", team_category: null, team_gender: null, first_name: "A", last_name: "B" }];
    currentOrgId = "o1";
    calendarViewDate = new Date(2026, 9, 1);
    await loadCalendar();
  });
  await page.waitForTimeout(300);
  console.log("CAL:", JSON.stringify(await page.evaluate(() => ({
    month: document.getElementById("cal-month-label").textContent,
    wk: [...document.querySelectorAll("#cal-grid > div:first-child > div, .cal-grid > div:first-child > div")].map((d) => d.textContent).slice(0, 7),
    legend: document.getElementById("cal-legend").textContent.replace(/\s+/g, " ").trim(),
    filter: document.getElementById("cal-team-filter").innerText.replace(/\s+/g, " ").trim(),
  }))));
  await page.evaluate(() => openCalendarAddModal("2026-10-12", "Monday, October 12"));
  await page.waitForTimeout(150);
  console.log("MODAL:", await page.evaluate(() => document.getElementById("cal-add-overlay").innerText.replace(/\s+/g, " ")));
  console.log("TIMEAGO:", await page.evaluate(() => { const d = (m) => new Date(Date.now() - m * 60000).toISOString(); const el = document.createElement("div"); document.body.appendChild(el); el.textContent = timeAgo(d(5)); const a = el.textContent; el.textContent = timeAgo(d(180)); const b = el.textContent; el.textContent = timeAgo(d(60 * 24 * 3)); const c = el.textContent; return [a, b, c]; }));
  await page.waitForTimeout(100);
  console.log("TIMEAGO (after observer):", await page.evaluate(() => [...document.body.children].slice(-1)[0].textContent));
  console.log("DATE en-US test:", await page.evaluate(() => new Date(2026, 9, 12).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })));
  console.log("MISSING:", JSON.stringify(await page.evaluate(() => pivotI18n.missing())));
  console.log("ERRORS:", h.errors);
  await h.close();
})();
