// Menús desplegables sencillos (2026-11-07): <div class="menu-wrap"><button data-menu-toggle>…</button><div class="menu-panel">…</div></div>
// Se abre/cierra con el botón, se cierra al elegir algo, al tocar fuera o con Esc.
(function () {
  function closeAll(except) {
    document.querySelectorAll(".menu-wrap.open").forEach(function (w) { if (w !== except) w.classList.remove("open"); });
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-menu-toggle]") : null;
    if (t) {
      var w = t.closest(".menu-wrap");
      var willOpen = !w.classList.contains("open");
      closeAll(w);
      w.classList.toggle("open", willOpen);
      t.setAttribute("aria-expanded", willOpen ? "true" : "false");
      return;
    }
    var inPanel = e.target.closest ? e.target.closest(".menu-panel") : null;
    if (inPanel) {
      // elegir un botón cierra el menú; los campos (select, enlaces de ayuda) lo dejan abierto
      var b = e.target.closest("button, a.menu-item");
      if (b) setTimeout(function () { closeAll(null); }, 0);
      return;
    }
    closeAll(null);
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeAll(null); });
})();
