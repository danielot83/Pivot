const { open } = require("./harness");
const lang = process.argv[2] || "fr";
(async () => {
  const h = await open("library", lang, { query: "?i18n_debug=1" }); const { page } = h;
  const dialogs = [];
  page.on("dialog", async (d) => { dialogs.push(d.type() + ":" + d.message()); await d.accept(d.type() === "prompt" ? "es" : undefined); });
  await page.waitForTimeout(300);
  await page.evaluate(async () => {
    const db = window.__DB;
    const D = { court_1: [{ type: "attacker", x: 0.3, y: 0.4, label: "1" }, { type: "cone", x: 0.5, y: 0.5 }] };
    db["rpc:visible_exercises"] = [
      { id: "x1", name: "3-man weave", number: 1, categories: ["Passing", "Fast break"], material: ["Balls", "Cones"], objectives: ["Passing on the move", "Finish"], description: "d", variants: "v", diagram: D, difficulty: 2, language: "en", age: ["U12", "All ages"], created_by: "u1", organization_id: "o1", visibility: "team", tags: ["a"] },
      { id: "x2", name: "Layups", number: 2, categories: ["Shooting"], material: ["Balls"], objectives: ["Finish"], description: "", variants: "", diagram: null, difficulty: 1, language: "fr", age: ["U10"], created_by: "u2", organization_id: "o1", visibility: "private", tags: [] },
      { id: "x3", name: "Other club drill", number: 3, categories: ["Defense"], material: [], objectives: [], description: "", variants: "", diagram: null, difficulty: 3, language: "en", age: ["Seniors"], created_by: "u9", organization_id: "o2", visibility: "community", tags: [] },
    ];
    db["rpc:visible_notebooks"] = [{ id: "n1", name: "Defense", organization_id: "o1", visibility: "team" }, { id: "n2", name: "Foreign", organization_id: "o2", visibility: "community" }];
    db.notebook_exercises = [{ notebook_id: "n1", exercise_id: "x1", position: 0 }, { notebook_id: "n1", exercise_id: "x2", position: 1 }];
    db.training_exercises = [{ exercise_id: "x1" }, { exercise_id: "x1" }];
    db.exercise_favorites = [{ user_id: "u1", exercise_id: "x1" }];
    db.profiles = [{ id: "u1", full_name: "Dani O" }, { id: "u2", full_name: "Marc" }];
    currentOrgId = "o1"; currentUserId = "u1"; myRole = "admin"; myOrgIds = new Set(["o1"]);
    els.languageFilter.value = "";
    await loadExercises(); await loadNotebooks();
  });
  await page.waitForTimeout(200);
  const snap = async (label) => console.log(label, JSON.stringify(await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 1800))));
  await snap("LIST");
  await page.evaluate(() => selectExercise("x1")); await page.waitForTimeout(200);
  console.log("DETAIL", await page.evaluate(() => els.detailCard.innerText.replace(/\s+/g, " ")));
  await page.evaluate(() => selectExercise("x3")); await page.waitForTimeout(100);
  console.log("DETAIL3", await page.evaluate(() => els.detailCard.innerText.replace(/\s+/g, " ")));
  await page.evaluate(() => { document.getElementById("select-mode-btn").click(); }); await page.waitForTimeout(100);
  await page.evaluate(() => { document.querySelector(".row-select").click(); });
  await snap("BULK");
  await page.evaluate(() => document.getElementById("bulk-delete-btn").click()); await page.waitForTimeout(300);
  console.log("MSG1:", await page.evaluate(() => els.msg.textContent));
  await page.evaluate(() => document.getElementById("select-mode-btn") && 0);
  await page.evaluate(async () => { els.unusedFilter.checked = true; els.search.value = "zzz"; refresh(); });
  await page.evaluate(() => document.getElementById("random-btn").click()); await page.waitForTimeout(100);
  console.log("MSG2:", await page.evaluate(() => els.msg.textContent));
  await page.evaluate(() => document.getElementById("reset-filters-btn").click());
  await page.evaluate(() => document.getElementById("help-btn").click()); await page.waitForTimeout(100);
  console.log("HELP", await page.evaluate(() => (document.getElementById("help-box-inline") || {}).innerText.replace(/\s+/g, " ").slice(0, 400)));
  await page.evaluate(() => document.getElementById("help-btn").click());
  // acciones
  await page.evaluate(async () => { const e = allExercises.find((x) => x.id === "x1"); selectExercise("x1"); await duplicateExercise(e); });
  console.log("MSG3:", await page.evaluate(() => els.msg.textContent));
  await page.evaluate(async () => { await copyToMyLibrary(allExercises.find((x) => x.id === "x3")); });
  console.log("MSG4:", await page.evaluate(() => els.msg.textContent));
  await page.evaluate(async () => { await duplicateAsTranslation(allExercises.find((x) => x.id === "x1")); });
  console.log("MSG5:", await page.evaluate(() => els.msg.textContent));
  await page.evaluate(async () => { await toggleFavorite(allExercises.find((x) => x.id === "x2")); });
  await page.evaluate(async () => { await deleteExercise(allExercises.find((x) => x.id === "x2")); });
  // cuaderno
  await page.evaluate(() => openNotebook("n1")); await page.waitForTimeout(200);
  console.log("NB", await page.evaluate(() => document.getElementById("notebook-drawer") ? document.getElementById("notebook-drawer").innerText.replace(/\s+/g, " ").slice(0, 900) : document.body.innerText.slice(0, 100)));
  await page.evaluate(() => document.getElementById("save-notebook-btn").click()); await page.waitForTimeout(300);
  console.log("MSG6:", await page.evaluate(() => els.msg.textContent));
  await page.evaluate(() => openNotebook("n2")); await page.waitForTimeout(100);
  console.log("MSG7:", await page.evaluate(() => els.msg.textContent));
  await page.evaluate(() => newNotebook()); await page.evaluate(() => document.getElementById("save-notebook-btn").click()); await page.waitForTimeout(200);
  console.log("MSG8:", await page.evaluate(() => els.msg.textContent));
  await page.evaluate(() => newNotebook()); await page.evaluate(() => exportNotebookPdf()).catch(() => {}); await page.waitForTimeout(200);
  console.log("MSG9:", await page.evaluate(() => els.msg.textContent));
  const w = await page.evaluate(() => JSON.stringify((window.__WRITES || []).map((x) => [x[0], x[1], x[2]])));
  console.log("WRITES:", w.slice(0, 2500));
  require("fs").writeFileSync(`/tmp/lib_writes_${lang}.json`, w);
  console.log("DIALOGS:", dialogs);
  const pdf = await page.evaluate(async () => {
    const texts = []; const Orig = window.jspdf.jsPDF;
    window.jspdf.jsPDF = function (...a) { const d = new Orig(...a); const tx = d.text.bind(d); d.text = (s, ...r) => { texts.push(Array.isArray(s) ? s.join("/") : String(s)); return tx(s, ...r); }; d.save = (n) => { texts.push("FILE:" + n); }; return d; };
    window.jspdf.jsPDF.prototype = Orig.prototype;
    try { await exportExercisePdfFromData(allExercises.find((x) => x.id === "x1")); } catch (e) { texts.push("EXC:" + e.message); }
    try { currentNotebookId = "n1"; notebookContents = ["x1", "x2"]; document.getElementById("notebook-name").value = "Defense"; await exportNotebookPdf(); } catch (e) { texts.push("EXC2:" + e.message); }
    return texts;
  });
  console.log("PDF:", pdf.join(" ¦ ").slice(0, 700), "...", pdf.filter((t) => /FILE|EXC/.test(t)));
  console.log("MISSING:", JSON.stringify(await page.evaluate(() => pivotI18n.missing())).slice(0, 3000));
  console.log("ERRORS:", h.errors);
  await h.close();
})();
