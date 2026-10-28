// Compara lo que se ESCRIBE a la BD en EN / FR / ES con las mismas acciones.
const { open } = require("./harness");
const clean = (w) => JSON.stringify(w, (k, v) => (k === "updated_at" || k === "created_at" ? "<ts>" : v));
async function run(pageName, lang, fn) {
  const h = await open(pageName, lang); const p = h.page;
  await p.waitForTimeout(300);
  await fn(p);
  await p.waitForTimeout(300);
  const w = await p.evaluate(() => window.__WRITES || []);
  await h.close();
  return { w, errors: h.errors };
}
const rosterScenario = async (page) => {
  await page.evaluate(async () => {
    const db = window.__DB, base = { organization_id: "o1", season: "2026-2027", team: "Senior", team_category: null, team_gender: "Female", guest: false };
    db.players = [{ id: "p1", first_name: "Ana", last_name: "Pérez", jersey_number: "7", category: "PG (Base)", gender: "Girl", birth_year: 2005, has_license: true, active: true, dues_paid: false, visibility: "team", ...base }];
    currentOrgId = "o1"; currentSeason = "2026-2027"; currentTeam = "Senior"; currentTeamCategory = ""; currentTeamGender = "Female"; myRole = "admin";
    visibleColumns = COLUMN_DEFS.map((c) => c.key); renderTableHead(); await loadPlayers();
    openAdd();
    document.getElementById("f-first_name").value = "Luc"; document.getElementById("f-last_name").value = "Martin";
    document.getElementById("f-jersey_number").value = "9"; document.getElementById("f-birth_year").value = "2006";
    document.getElementById("f-category").value = "C (Pívot)"; document.getElementById("f-gender").value = "Boy"; document.getElementById("f-license_number").value = "L-1";
    await savePlayer();
  });
  await page.waitForTimeout(200);
  // edición en línea: posición (select) y checkbox
  await page.evaluate(() => {
    const row = [...document.querySelectorAll("#players-body tr")][0];
    const idx = COLUMN_DEFS.findIndex((c) => c.key === "category") + (visibleColumns.indexOf("category") - COLUMN_DEFS.findIndex((c) => c.key === "category"));
    const tds = [...row.children]; const pos = tds.find((td) => /PG|Meneur|Base/.test(td.textContent)); if (pos) pos.click();
  });
  await page.waitForTimeout(100);
  await page.evaluate(() => { const s = document.querySelector("#players-body select"); if (s) { s.value = "SF (Alero)"; s.dispatchEvent(new Event("change", { bubbles: true })); s.blur(); } });
  await page.waitForTimeout(200);
  // importación con cabeceras en cada idioma -> payload final
  await page.evaluate(() => {
    const hdr = { en: ["Jersey", "First name", "Last name", "Birth year", "Position", "Gender", "License #", "Active"], fr: ["Numéro", "Prénom", "Nom", "Année de naissance", "Poste", "Genre", "N° licence", "Actif"], es: ["Dorsal", "Nombre", "Apellidos", "Año de nacimiento", "Posición", "Género", "N.º licencia", "Activo"] };
    const rows = { en: ["5", "Eva", "Ruiz", "2004", "PG (Base)", "Girl", "X1", "yes"], fr: ["5", "Eva", "Ruiz", "2004", "PG (Base)", "Fille", "X1", "oui"], es: ["5", "Eva", "Ruiz", "2004", "PG (Base)", "Chica", "X1", "sí"] };
    window.__imp = {};
    for (const k of ["en", "fr", "es"]) { const m = buildFieldMap(hdr[k]); const o = {}; hdr[k].forEach((h, i) => { if (m[h]) o[m[h]] = rows[k][i]; }); window.__imp[k] = { keys: Object.keys(o).sort().join(","), gender: parseGender(o.gender), active: parseYesNo(o.active, false) }; }
  });
  console.log("  import map:", JSON.stringify(await page.evaluate(() => window.__imp)));
};
const attendanceScenario = async (page) => {
  await page.evaluate(async () => {
    const db = window.__DB, base = { organization_id: "o1", season: "2026-2027", team: "Senior", team_category: null, team_gender: null };
    db.players = [{ id: "p1", first_name: "Ana", last_name: "Pérez", active: true, ...base }, { id: "p2", first_name: "Luc", last_name: "Martin", active: true, ...base }];
    db.matches = [{ id: "m1", date: "2026-09-12", opponent: "Rivals", ...base }];
    db.trainings = [{ id: "t1", date: "2026-09-10", title: "", ...base }];
    db.events = [];
    db.attendance = [{ id: "a1", player_id: "p1", match_id: "m1", status: "present" }];
    currentOrgId = "o1"; currentUserId = "u1"; filterSeason = "2026-2027"; filterTeam = "Senior"; filterTeamCategory = ""; filterTeamGender = "";
    await loadAttendanceGrid();
  });
  await page.waitForTimeout(300);
  for (let i = 0; i < 3; i++) { // 3 clics en la misma celda (m1, p1) y 2 en otra
    await page.evaluate(() => { const b = document.querySelector('button[data-player="p1"][data-status], .att-cell'); (document.querySelectorAll("tbody .att-cell, tbody button[data-status]")[0] || b).click(); });
    await page.waitForTimeout(200);
  }
  for (let i = 0; i < 2; i++) { await page.evaluate(() => { const bs = document.querySelectorAll("tbody .att-cell, tbody button[data-status]"); (bs[3] || bs[bs.length - 1]).click(); }); await page.waitForTimeout(200); }
};
(async () => {
  let bad = 0;
  for (const [name, sc] of [["roster", rosterScenario], ["attendance", attendanceScenario]]) {
    const res = {}; for (const l of ["en", "fr", "es"]) res[l] = await run(name, l, sc);
    const en = clean(res.en.w);
    const same = clean(res.fr.w) === en && clean(res.es.w) === en;
    console.log(name, "writes:", res.en.w.length, same ? "IDENTICAL en/fr/es" : "DIFFERENT", "errors:", JSON.stringify([res.en.errors, res.fr.errors, res.es.errors]));
    if (!same) { bad++; for (const l of ["en", "fr", "es"]) console.log(" ", l, clean(res[l].w).slice(0, 900)); }
    if (res.en.w.length === 0) { bad++; console.log("  !! sin escrituras: el escenario no ejercitó nada"); }
    else console.log("  ejemplo:", en.slice(0, 500));
  }
  process.exit(bad ? 1 : 0);
})();
