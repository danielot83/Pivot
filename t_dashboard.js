const { open } = require("./harness");
(async () => {
  const lang = process.argv[2] || "fr";
  const h = await open("dashboard", lang, { query: "?i18n_debug=1" });
  const { page } = h;
  await page.evaluate(() => { try { renderModulesGrid("modules-grid", linkForModule); } catch (e) { window.__e1 = String(e); } });
  const txt = await page.evaluate(() => ({
    greet: document.body.innerText.slice(0, 0),
    modules: [...document.querySelectorAll("#modules-grid .module-card h3")].map((h) => h.textContent.trim()),
    stats: [...document.querySelectorAll(".stat-card .label, .stats-grid .label")].map((x) => x.textContent.trim()),
    h2: [...document.querySelectorAll("h1, h2")].map((x) => x.textContent.trim()),
    onboard: document.querySelector(".onboard-card").innerText.replace(/\s+/g, " ").slice(0, 400),
  }));
  console.log(JSON.stringify(txt, null, 1));
  // calendario
  const cal = await page.evaluate(() => { try { calendarViewDate = new Date(2026, 9, 1); renderCalendarMonth && 0; } catch (e) {} return Object.keys(window).filter((k) => /alendar/.test(k)).slice(0, 15); });
  console.log("CAL FNS:", cal);
  console.log("MISSING:", JSON.stringify(await page.evaluate(() => pivotI18n.missing())));
  console.log("ERRORS:", h.errors, await page.evaluate(() => window.__e1));
  await h.close();
})();
