// PlayPivot — pequeñas defensas del lado del navegador (se carga en <head>, antes que nada).
// 1) Anti-clickjacking: si alguien mete la web dentro de un <iframe> en otro sitio, se oculta.
//    (La defensa completa es la cabecera HTTP frame-ancestors / X-Frame-Options del servidor;
//    esto cubre el caso de que el servidor no la envíe.)
// 2) Al cerrar sesión se borran los borradores locales (ejercicio sin guardar, contador en
//    directo) para que en un ordenador compartido la siguiente persona no los vea.
(function () {
  try {
    if (window.top !== window.self) {
      document.documentElement.style.display = "none";
      try { window.top.location = window.self.location; } catch (e) { /* sandbox: se queda oculto */ }
    }
  } catch (e) { document.documentElement.style.display = "none"; }

  function clearVolatile() {
    try {
      Object.keys(localStorage).forEach(function (k) {
        if (/^(pivot_ex_draft_|pivot-live-)/.test(k)) localStorage.removeItem(k);
      });
      sessionStorage.removeItem("pivot_ex_sections");
    } catch (e) { /* sin almacenamiento: nada que borrar */ }
  }
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest("#logout-btn, .sidebar-logout-btn");
    if (b) clearVolatile();
  }, true);
})();
