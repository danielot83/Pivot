const { open } = require("./harness");
(async () => {
  const lang = process.argv[2] || "fr";
  const h = await open("dashboard", lang, {});
  const { page } = h;
  await page.evaluate(async () => {
    window.__DB.memberships = [
      { user_id: "u1", organization_id: "o1", role: "admin", status: "active", team_season: null, team_name: null, profiles: { full_name: "Dani" } },
      { user_id: "u2", organization_id: "o1", role: "coach", status: "active", team_season: "2026-2027", team_name: "Senior", team_category: "U18", team_gender: "Female", profiles: { full_name: "Roster" } },
      { user_id: "u2", organization_id: "o1", role: "coach", status: "active", team_season: "2026-2027", team_name: "Junior", team_category: "", team_gender: "Mixed", profiles: { full_name: "Roster" } },
    ];
    currentOrgId = "o1";
    await loadDashOrgChart();
  });
  await page.waitForTimeout(300);
  console.log(JSON.stringify(await page.evaluate(() => document.getElementById("dash-org-chart-list").innerText.replace(/\s+/g, " "))));
  await h.close();
})();
