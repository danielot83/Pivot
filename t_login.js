const { open } = require("./harness");
(async () => {
  const lang = process.argv[2] || "fr";
  const h = await open("login", lang, { query: "?i18n_debug=1" });
  const { page } = h;
  await page.waitForTimeout(400);
  const snap = () => page.evaluate(() => document.querySelector("main").innerText.replace(/\s+/g, " "));
  console.log("LOGIN:", await snap());
  await page.evaluate(() => { window.__DB.organizations = [{ id: "o1", name: "Club Test", is_active: true }, { id: "o2", name: "Roster", is_active: true }]; window.__DB.teams = [{ organization_id: "o1", season: "2026-2027", team: "Senior", team_category: "U18", team_gender: "Female" }]; setMode("signup"); });
  await page.waitForTimeout(400);
  console.log("SIGNUP:", await snap());
  await page.evaluate(() => { document.querySelector('input[value="join"]').click(); document.querySelector('input[value="join"]').dispatchEvent(new Event("change", { bubbles: true })); });
  await page.waitForTimeout(300);
  console.log("OPTS:", JSON.stringify(await page.evaluate(() => ({
    org: [...els.joinOrg.options].map((o) => o.textContent + "=" + o.value),
    team: [...els.joinTeam.options].map((o) => o.textContent + "=" + o.value),
    cat: [...els.joinTeamNewCategory.options].slice(0, 3).map((o) => o.textContent + "=" + o.value),
    gen: [...els.joinTeamNewGender.options].map((o) => o.textContent + "=" + o.value),
    season: [...els.joinTeamNewSeason.options].map((o) => o.textContent + "=" + o.value),
  }))));
  const msgs = await page.evaluate(async () => {
    const out = [];
    showMessage("Email and password are required.", "error"); out.push(els.msg.textContent);
    els.email.value = "a@b.ch"; els.password.value = "x"; els.submitBtn.click(); await new Promise((r) => setTimeout(r, 100)); out.push(els.msg.textContent);
    document.getElementById("terms_accept_check").checked = true; document.querySelector('input[value="create"]').click(); els.clubName.value = ""; els.submitBtn.click(); await new Promise((r) => setTimeout(r, 100)); out.push(els.msg.textContent);
    showMessage("Invalid login credentials", "error"); out.push(els.msg.textContent);
    return out;
  });
  console.log("MSGS:", JSON.stringify(msgs));
  console.log("MISSING:", JSON.stringify(await page.evaluate(() => (window.pivotI18n ? pivotI18n.missing() : "n/a"))));
  console.log("ERRORS:", h.errors);
  await h.close();
})();
