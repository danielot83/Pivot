const { open } = require("./harness");
const lang = process.argv[2] || "fr";
(async () => {
  const h = await open("exercises", lang, { query: "?i18n_debug=1" }); const { page } = h;
  await page.waitForTimeout(300);
  await page.evaluate(async () => {
    const db = window.__DB;
    db["rpc:visible_exercises"] = [
      { id: "x1", name: "3-man weave", number: 1, categories: ["Passing", "Fast break"], material: ["Balls", "Cones"], objectives: ["Passing on the move", "Finish"], description: "d", variants: "v", diagram: null, difficulty: 2, language: "en", age: ["U12", "All ages"], created_by: "u1", organization_id: "o1", visibility: "team", tags: [] },
    ];
    db.exercise_favorites = [];
    db.profiles = [{ id: "u1", full_name: "Dani O" }];
    currentOrgId = "o1"; currentUserId = "u1"; myRole = "admin";
    try { await loadExercises(); } catch (e) { console.log("loadEx", e.message); }
    newExercise();
    els.name.value = "Closeout drill"; els.difficulty.value = "3"; els.tags.value = "defense; 1v1";
    els.objectives.value = "Stay low\nContest the shot"; els.description.value = "Players run"; els.variants.value = "Add a pass";
    setCheckedValues("age", ["U14", "Seniors"]); setCheckedValues("categories", ["Defense", "Shooting"]); setCheckedValues("material", ["Balls", "Cones"]);
    els.visibility.value = els.visibility.options[0].value; els.language.value = els.language.options[0].value;
  });
  await page.waitForTimeout(200);
  const dom = await page.evaluate(() => {
    const t = (s) => [...document.querySelectorAll(s)].map((e) => e.textContent.replace(/\s+/g, " ").trim());
    return { area: document.getElementById("editor-area").innerText.replace(/\s+/g, " ").slice(0, 3000), list: document.body.innerText.replace(/\s+/g, " ").slice(0, 1200) };
  });
  console.log(JSON.stringify(dom, null, 1));
  await page.evaluate(async () => { await saveExercise(); });
  await page.waitForTimeout(300);
  console.log("MSG:", await page.evaluate(() => document.getElementById("msg").textContent));
  const w = await page.evaluate(() => JSON.stringify(window.__WRITES || []));
  console.log("WRITES:", w.slice(0, 1500));
  require("fs").writeFileSync(`/tmp/ex_writes_${lang}.json`, w);
  const out = await page.evaluate(async () => {
    const texts = []; const Orig = window.jspdf.jsPDF;
    window.jspdf.jsPDF = function (...a) { const d = new Orig(...a); const tx = d.text.bind(d); d.text = (s, ...r) => { texts.push(Array.isArray(s) ? s.join("/") : String(s)); return tx(s, ...r); }; d.save = (n) => { texts.push("FILE:" + n); }; return d; };
    window.jspdf.jsPDF.prototype = Orig.prototype;
    try { await exportExercisePdf(); } catch (e) { texts.push("EXC:" + e.message); }
    return texts;
  });
  console.log("PDF:", out.join(" ¦ ").slice(0, 1500));
  for (const fn of ["openAiGuideModal", "openPhotoGuideModal", "openStartGuideModal"]) {
    const txt = await page.evaluate((f) => { try { window[f](); } catch (e) { return "EXC " + e.message; } return [...document.querySelectorAll(".modal, [role=dialog], .modal-backdrop")].map((e) => e.innerText).join(" | ").replace(/\s+/g, " ").slice(0, 250); }, fn);
    console.log(fn, ":", txt);
  }
  console.log("MISSING:", JSON.stringify(await page.evaluate(() => pivotI18n.missing())).slice(0, 2500));
  console.log("ERRORS:", h.errors);
  await h.close();
})();
