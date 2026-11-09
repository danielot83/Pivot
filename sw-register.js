// Registra el service worker (modo sin conexión) y muestra un aviso cuando no hay internet.
(function () {
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("./sw.js").catch(function () {}); });
  }
  function bar() {
    var el = document.getElementById("offline-bar");
    if (navigator.onLine) { if (el) el.remove(); return; }
    if (el || !document.body) return;
    el = document.createElement("div");
    el.id = "offline-bar";
    el.setAttribute("role", "status");
    el.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:2147483000;background:#080026;color:#fff;font:13px/1.4 system-ui,sans-serif;padding:9px 16px;text-align:center";
    el.textContent = "You're offline — this page opens, but data can't load or save until you're back online.";
    document.body.appendChild(el);
  }
  window.addEventListener("online", bar); window.addEventListener("offline", bar);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bar); else bar();
})();
