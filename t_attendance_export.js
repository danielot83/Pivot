const { open } = require("./harness");
(async () => {
  for (const lang of ["en", "fr", "es"]) {
    const h = await open("attendance", lang);
    const { page } = h;
    await page.evaluate(() => {
      const db = window.__DB, base = { organization_id: "o1", season: "2026-2027", team: "Senior", team_category: null, team_gender: null };
      db.players = [{ id: "p1", first_name: "Ana", last_name: "Pérez", active: true, ...base }];
      db.matches = [{ id: "m1", date: "2026-09-12", opponent: "Rivals", ...base }];
      db.trainings = [{ id: "t1", date: "2026-09-10", title: "", ...base }];
      db.events = [{ id: "e1", date: "2026-09-15", title: "", ...base }];
      db.attendance = [{ id: "a1", player_id: "p1", match_id: "m1", status: "present" }, { id: "a3", player_id: "p1", training_id: "t1", status: "excused" }];
      currentOrgId = "o1"; filterSeason = "2026-2027"; filterTeam = "Senior"; filterTeamCategory = ""; filterTeamGender = "";
    });
    await page.evaluate(() => loadAttendanceGrid()); await page.waitForTimeout(200);
    const out = await page.evaluate(async () => {
      const texts = [];
      const Orig = window.jspdf.jsPDF;
      window.jspdf.jsPDF = function (...a) { const d = new Orig(...a); const tx = d.text.bind(d); d.text = (s, ...r) => { texts.push(String(s)); return tx(s, ...r); }; d.save = (n) => { texts.push("FILE:" + n); }; return d; };
      window.jspdf.jsPDF.prototype = Orig.prototype;
      document.getElementById("export-pdf-btn").click(); await new Promise((r) => setTimeout(r, 800));
      document.getElementById("export-excel-btn").click();
      return { pdf: texts, xlsxName: window.__xlsx, xlsx: window.__xlsxData && JSON.stringify(Object.values(window.__xlsxData)) };
    });
    console.log("=====", lang, "\nPDF:", out.pdf.join(" ¦ "), "\nXLSX file:", out.xlsxName);
    await h.close();
  }
})();
