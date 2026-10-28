// Plantilla Excel de Match day: generar en cada idioma, rellenar, reimportar -> mismo resultado.
const { open } = require("./harness");
(async () => {
  const outs = {};
  for (const lang of ["en", "fr", "es"]) {
    const h = await open("match", lang, { realXlsx: true }); const p = h.page; await p.waitForTimeout(300);
    const r = await p.evaluate(() => {
      teamPlayers = [{ id: "p1", first_name: "Ana", last_name: "Pérez", jersey_number: "7" }, { id: "p2", first_name: "Luc", last_name: "Martin", jersey_number: "9" }];
      currentTeam = "Senior"; currentTeamCategory = ""; currentTeamGender = "Female"; matchFields = [{ key: "steals", label: "Steals" }];
      let aoa = null; const o = XLSX.utils.aoa_to_sheet; XLSX.utils.aoa_to_sheet = (a) => { aoa = a; return o(a); };
      buildMatchExcelTemplate();
      const hdrRow = aoa.findIndex((r) => r.length > 5);
      const header = aoa[hdrRow];
      // rellena: Ana juega (min 20, 1pt=2, 2pts=3, 3pts=1, titular), Luc en blanco; rival con 1 jugador
      const colOf = (re) => header.findIndex((h) => re.test(String(h)));
      const filled = aoa.map((r) => r.slice());
      const ana = filled.findIndex((r) => /Ana/.test(String(r[1]))); const lucRowIdx = ana + 1;
      const set = (row, re, v) => { const c = colOf(re); if (c >= 0) filled[row][c] = v; return c >= 0; };
      const hit = {};
      hit.min = set(ana, /^min/i, 20); hit.p1 = set(ana, /^1 pt/i, 2); hit.p2 = set(ana, /^2 pts/i, 3); hit.p3 = set(ana, /^3 pts/i, 1);
      hit.starter = set(ana, /starter|titulaire|titular/i, "Y");
      hit.reb = set(ana, /^reb/i, 5); hit.ast = set(ana, /^ast/i, 4);
      hit.fouls = set(ana, /fouls|fautes|faltas/i, 2);
      // rival: segunda tabla
      const oppHdr = aoa.map((r, i) => (r.length > 5 ? i : -1)).filter((i) => i >= 0)[1];
      filled[oppHdr + 1][1] = "Rival One"; filled[oppHdr + 1][0] = "4"; set(oppHdr + 1, /^2 pts/i, 5);
      // info general
      filled.forEach((r, i) => { if (i < hdrRow) { if (/^(date|fecha)$/i.test(String(r[0]))) r[1] = "30.09.2026"; if (/lieu|lugar|location/i.test(String(r[0]))) r[1] = "Hall A"; if (/arbitre|árbitro|referee/i.test(String(r[0]))) r[1] = "Ref X"; if (/équipe b|equipo b|team b/i.test(String(r[0]))) r[1] = "Rival"; if (/score final|resultado final|final score/i.test(String(r[0]))) r[1] = "70 - 60"; } });
      let parsed, err = null;
      try { parsed = parseSheetRowsIntoMatchImport(filled); } catch (e) { err = e.message; }
      return { header: header.map(String), top: aoa.slice(0, 9).map((r) => r.join("|")), hit, err, parsed: parsed ? JSON.stringify(parsed) : null, file: window.__xlsx };
    });
    outs[lang] = r; await h.close();
    console.log(lang, "header:", r.header.join(" , ")); console.log("  top:", r.top.join(" / ")); console.log("  hit:", JSON.stringify(r.hit), "err:", r.err);
  }
  const norm = (o) => o.parsed;
  console.log("parsed identical en/fr/es:", norm(outs.en) === norm(outs.fr) && norm(outs.fr) === norm(outs.es), "\n EN parsed:", (outs.en.parsed || "").slice(0, 700));
  if (norm(outs.en) !== norm(outs.fr)) console.log(" FR parsed:", (outs.fr.parsed||"").slice(0,700));
  if (norm(outs.en) !== norm(outs.es)) console.log(" ES parsed:", (outs.es.parsed||"").slice(0,700));
})();
