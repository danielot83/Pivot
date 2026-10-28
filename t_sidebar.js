const { open } = require("./harness");
(async () => {
  for (const lang of ["en", "fr", "es"]) {
    const h = await open("attendance", lang);
    const r = await h.page.evaluate(() => ({
      lang: document.documentElement.lang,
      nav: [...document.querySelectorAll(".sidebar-link")].map((a) => a.textContent.trim()),
      logout: document.getElementById("logout-btn").title, help: document.querySelector("#help-btn").title,
      switch: [...document.querySelectorAll("#pivot-lang-switch button")].map((b) => b.textContent + (b.classList.contains("active") ? "*" : "")),
      missing: pivotI18n.missing().length,
    }));
    console.log(lang, JSON.stringify(r), h.errors);
    await h.close();
  }
})();
