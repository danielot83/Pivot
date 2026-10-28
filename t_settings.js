// uso: node t_settings.js lang  -> imprime textos + escrituras (normalizadas) para comparar entre idiomas
const { open } = require("./harness");
(async () => {
  const lang = process.argv[2] || "fr";
  const h = await open("settings", lang, { query: "?i18n_debug=1" });
  const { page } = h;
  page.on("dialog", (d) => { (global.__dlg = global.__dlg || []).push(d.message()); d.accept(); });
  await page.evaluate(async () => {
    const db = window.__DB;
    db.profiles = [{ id: "u1", full_name: "Dani", email: "d@x.ch", is_platform_controller: true, is_association_validator: true }, { id: "u2", full_name: "Luc Martin", email: "l@x.ch", is_association_validator: true }];
    db.memberships = [
      { id: "m1", user_id: "u1", organization_id: "o1", role: "admin", status: "active", team_season: null, team_name: null, organizations: { name: "Club Test", is_active: true }, profiles: { full_name: "Dani" } },
      { id: "m2", user_id: "u2", organization_id: "o1", role: "coach", status: "active", team_season: "2026-2027", team_name: "Senior", team_category: "U18", team_gender: "Female", profiles: { full_name: "Luc Martin" } },
      { id: "m3", user_id: "u3", organization_id: "o1", role: "coach", status: "blocked", team_season: null, team_name: null, profiles: { full_name: "Ana Pérez" } },
    ];
    db.players = [{ id: "p1", season: "2026-2027", team: "Senior", team_category: "U18", team_gender: "Female", organization_id: "o1", first_name: "A", last_name: "B" }];
    db.teams = [{ season: "2026-2027", team: "Senior", team_category: "U18", team_gender: "Female", organization_id: "o1" }, { season: "2026-2027", team: "Junior", team_category: "", team_gender: "Mixed", organization_id: "o1" }];
    db.exercises = [{ id: "e1", visibility: "team", organization_id: "o1" }, { id: "e2", visibility: "private", organization_id: "o1" }];
    db.plays = []; db.matches = [{ id: "mm", visibility: "community", organization_id: "o1" }]; db.trainings = []; db.player_assessments = [];
    db.organizations = [{ id: "o1", export_language: "fr", pdf_sections: {} }];
    db.club_association_members = [{ status: "pending", organization_id: "o1", club_associations: { id: "a1", name: "Liga Cantonal", status: "pending" } }, { status: "approved", organization_id: "o1", club_associations: { id: "a2", name: "Ligue Vaud", status: "approved" } }];
    db["rpc:get_platform_admin_contact"] = [{ id: "u9" }];
    window.__uiOpts = {};
    try { await init(); } catch (e) { window.__initErr = String(e); }
  });
  await page.waitForTimeout(500);
  const grab = () => page.evaluate(() => ({
    msg: document.getElementById("msg").textContent,
    members: document.getElementById("members-list").innerText.replace(/\s+/g, " ").trim(),
    scopeNotice: document.getElementById("members-scope-notice").textContent,
    roleOpts: [...document.querySelectorAll("#members-list select")].map((s) => [...s.options].map((o) => o.textContent + "=" + o.value).join("|")),
    scopeTitle: document.querySelector("#members-list select:nth-of-type(2)")?.title,
    btns: [...document.querySelectorAll("#members-list button")].map((b) => b.textContent),
    sharing: [...document.querySelectorAll(".sharing-status")].map((s) => s.textContent),
    assoc: document.getElementById("associations-list").innerText.replace(/\s+/g, " "),
    validators: document.getElementById("validators-list").innerText.replace(/\s+/g, " "),
    del: document.getElementById("delete-account-memberships").innerText.replace(/\s+/g, " "),
  }));
  console.log("INIT:", JSON.stringify(await page.evaluate(() => window.__initErr)));
  console.log("STATE1:", JSON.stringify(await grab(), null, 1));
  // organigrama
  await page.evaluate(() => { document.getElementById("org-chart-details").open = true; });
  await page.waitForTimeout(300);
  console.log("ORGCHART:", JSON.stringify(await page.evaluate(() => document.getElementById("org-chart-list").innerText.replace(/\s+/g, " "))));
  // acciones
  await page.evaluate(async () => {
    window.__WRITES = [];
    await setTeamScope("m3", "2026-2027", "Senior", "U18", "Female"); window.__m1 = document.getElementById("msg").textContent;
    await setTeamScope("m3", null, null, null, null); window.__m2 = document.getElementById("msg").textContent;
    await changeStatus("m3", "active", null); window.__m3 = document.getElementById("msg").textContent;
    await changeRole("m3", "admin", null); window.__m4 = document.getElementById("msg").textContent;
    document.querySelector('.sharing-bulk-card[data-table="exercises"] .bulk-visibility-select').value = "community";
    document.querySelector('.sharing-bulk-card[data-table="exercises"] .apply-bulk-btn').click();
    await new Promise((r) => setTimeout(r, 100)); window.__m5 = document.getElementById("msg").textContent;
    document.querySelector('.sharing-bulk-card[data-table="player_assessments"] .bulk-visibility-select').value = "private";
    document.querySelector('.sharing-bulk-card[data-table="player_assessments"] .apply-bulk-btn').click();
    await new Promise((r) => setTimeout(r, 100)); window.__m6 = document.getElementById("msg").textContent;
    document.getElementById("assoc-name-input").value = "Liga Nueva";
    document.getElementById("assoc-message-input").value = "Hola";
    document.getElementById("request-association-btn").click();
    await new Promise((r) => setTimeout(r, 150)); window.__m7 = document.getElementById("msg").textContent;
    document.getElementById("assoc-name-input").value = ""; document.getElementById("request-association-btn").click();
    await new Promise((r) => setTimeout(r, 50)); window.__m8 = document.getElementById("msg").textContent;
    document.getElementById("export-language-select").value = "es"; document.getElementById("export-language-select").dispatchEvent(new Event("change"));
    await new Promise((r) => setTimeout(r, 100)); window.__m9 = document.getElementById("msg").textContent;
    document.getElementById("pdf-section-age").checked = false; document.getElementById("pdf-section-age").dispatchEvent(new Event("change"));
    await new Promise((r) => setTimeout(r, 100)); window.__m10 = document.getElementById("msg").textContent;
    document.getElementById("validator-email-input").value = "nadie@x.ch"; document.getElementById("add-validator-btn").click();
    await new Promise((r) => setTimeout(r, 100)); window.__m11 = document.getElementById("msg").textContent;
    document.getElementById("request-login-deletion-btn").click();
    await new Promise((r) => setTimeout(r, 200)); window.__m12 = document.getElementById("msg").textContent;
    await removeMember("m3", document.createElement("div")); 
  });
  await page.waitForTimeout(300);
  console.log("MSGS:", JSON.stringify(await page.evaluate(() => [1,2,3,4,5,6,7,8,9,10,11,12].map((i) => window["__m" + i]))));
  console.log("DIALOGS:", JSON.stringify(global.__dlg));
  console.log("WRITES:", JSON.stringify((await page.evaluate(() => window.__WRITES)).map((w) => JSON.stringify(w).replace(/new\d+[^"]*/g, "NEW").replace(/"updated_at":"[^"]*"/g, ""))));
  // ayuda
  await page.evaluate(() => document.getElementById("help-btn").click());
  await page.waitForTimeout(200);
  console.log("HELP:", await page.evaluate(() => document.getElementById("help-box").innerText.replace(/\s+/g, " ").slice(0, 900)));
  // delete-account buttons clicks (sole admin -> delete club; other -> leave)
  try { await page.evaluate(async () => { document.querySelector("#delete-account-memberships button[data-id]").click(); await new Promise((r) => setTimeout(r, 100)); }); } catch (e) {}
  await page.waitForTimeout(300);
  console.log("DIALOGS2:", JSON.stringify(global.__dlg.slice(-3)));
  console.log("MISSING:", JSON.stringify(await page.evaluate(() => (window.pivotI18n ? pivotI18n.missing() : "n/a"))));
  console.log("ERRORS:", h.errors);
  await h.close();
})();
