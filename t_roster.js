const { open } = require("./harness");
(async () => {
  const lang = process.argv[2] || "fr";
  const h = await open("roster", lang, { query: "?i18n_debug=1" });
  const { page } = h;
  await page.evaluate(() => {
    const db = window.__DB, base = { organization_id: "o1", season: "2026-2027", team: "Senior", team_category: null, team_gender: "Female", guest: false };
    db.players = [
      { id: "p1", first_name: "Ana", last_name: "Pérez", jersey_number: "7", category: "PG (Base)", gender: "Girl", birth_year: 2005, has_license: true, active: true, dues_paid: false, visibility: "team", ...base },
      { id: "p2", first_name: "Luc", last_name: "Martin", jersey_number: "9", category: "C (Pívot)", gender: "Boy", has_license: false, active: true, dues_paid: true, visibility: "private", ...base },
    ];
    currentOrgId = "o1"; currentSeason = "2026-2027"; currentTeam = "Senior"; currentTeamCategory = ""; currentTeamGender = "Female"; myRole = "admin";
    document.getElementById("roster-table") && (document.getElementById("roster-table").style.display = "table");
    visibleColumns = COLUMN_DEFS.map((c) => c.key);
    renderColumnsMenu(); renderTableHead(); updateSelectedSummaryCard();
    renderTeamGenderCategoryDropdown("team-gender-category-select", [{ season: "2026-2027", team: "Senior", team_category: "U18", team_gender: "Female" }], { team: "Senior", team_category: "U18", team_gender: "Female" }, () => {});
    renderSeasonPicker("season-picker", ["2026-2027", "2025-2026"], "2026-2027", () => {}, () => {});
  });
  await page.evaluate(() => loadPlayers()); await page.waitForTimeout(300);
  const dom = await page.evaluate(() => ({
    head: [...document.querySelectorAll("#table-head th")].map((t) => t.textContent.trim()),
    rows: [...document.querySelectorAll("#players-body tr")].map((tr) => [...tr.children].map((c) => c.textContent.trim()).join(" | ")),
    chips: [...document.querySelectorAll(".tsc-chip")].map((c) => c.textContent.replace(/\s+/g, " ").trim()),
    sub: document.getElementById("tsc-selected-sub").textContent,
    cols: [...document.querySelectorAll("#columns-panel label")].map((l) => l.textContent.trim()),
    dropdown: document.getElementById("team-gender-category-select").textContent.replace(/\s+/g, " ").trim(),
    seasons: document.getElementById("season-picker").textContent.replace(/\s+/g, " ").trim(),
  }));
  console.log(JSON.stringify(dom, null, 1));
  await page.evaluate(() => openAdd());
  console.log("PANEL:", (await page.evaluate(() => document.getElementById("panel").innerText.replace(/\s+/g, " "))));
  // edit a position cell -> select options
  const opts = await page.evaluate(() => { const td = [...document.querySelectorAll("#players-body tr")][0].children[4]; td.click(); return null; });
  await page.waitForTimeout(100);
  const opts2 = await page.evaluate(() => [...document.querySelectorAll("#players-body option")].map((o) => o.textContent));
  console.log("SELECT OPTIONS:", JSON.stringify(opts2));
  // messages
  await page.evaluate(() => { showMessage("Jersey number must be a whole number.", "error"); });
  await page.waitForTimeout(50);
  console.log("MSG:", await page.evaluate(() => document.getElementById("msg").textContent));
  await page.evaluate(() => { showMessage(jerseyNumberError("7", "px"), "error"); }); await page.waitForTimeout(50);
  console.log("MSG2:", await page.evaluate(() => document.getElementById("msg").textContent));
  // help
  await page.click("#help-btn"); await page.waitForTimeout(100);
  console.log("HELP:", (await page.evaluate(() => document.getElementById("help-box").textContent.replace(/\s+/g, " ").trim())).slice(0, 300));
  // exports
  const out = await page.evaluate(async () => {
    const texts = []; const Orig = window.jspdf.jsPDF;
    window.jspdf.jsPDF = function (...a) { const d = new Orig(...a); const tx = d.text.bind(d); d.text = (s, ...r) => { texts.push(String(s)); return tx(s, ...r); }; d.save = (n) => { texts.push("FILE:" + n); }; return d; };
    window.jspdf.jsPDF.prototype = Orig.prototype;
    window.__aoa = null; const oa = XLSX.utils.aoa_to_sheet; XLSX.utils.aoa_to_sheet = (a) => { window.__aoa = a; return oa(a); }; await exportToPdf(); await exportToExcel();
    return { pdf: texts.join(" ¦ "), xlsxName: window.__xlsx, wb: JSON.stringify(window.__aoa) };
  });
  console.log("PDF:", out.pdf); console.log("XLSX:", out.xlsxName, out.wb.slice(0, 600));
  const sheet = await page.evaluate(() => { let aoa; const o = XLSX.utils.aoa_to_sheet; return null; });
  // import header recognition
  const imp = await page.evaluate(() => {
    const sets = {
      fr: ["Numéro", "Prénom", "Nom", "Année de naissance", "Poste", "Genre", "N° licence", "Prêt", "Actif", "Cotisation", "Qui les voit"],
      es: ["Dorsal", "Nombre", "Apellidos", "Año de nacimiento", "Posición", "Género", "N.º licencia", "Listo", "Activo", "Cuota"],
      en: COLUMN_DEFS.map((c) => c.label),
    };
    const r = {}; for (const k in sets) { const m = buildFieldMap(sets[k]); r[k] = sets[k].filter((h) => !m[h]); }
    return { unrecognized: r, g: [parseGender("Femenino"), parseGender("chico"), parseGender("Fille")], yn: [parseYesNo("Oui", false), parseYesNo("Sí", false), parseYesNo("No", true), parseYesNo("Yes", false)] };
  });
  console.log("IMPORT:", JSON.stringify(imp));
  const missing = await page.evaluate(() => pivotI18n.missing());
  console.log("MISSING:", JSON.stringify(missing));
  console.log("ERRORS:", h.errors);
  await h.close();
})();
