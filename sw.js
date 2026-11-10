/* PlayPivot service worker — "abrir sin conexión".
   Estrategia: red primero (así siempre ves la versión nueva si hay internet) y,
   si falla la red, la última copia guardada. Solo se guardan ficheros de la propia
   app y las librerías de cdn.jsdelivr.net. Los datos (Supabase) NUNCA se guardan:
   sin conexión la app abre, pero no carga ni guarda datos hasta volver la red. */
const CACHE = "playpivot-shell-v2"; // v2: añade security-guard.js y filtra qué se guarda
const CORE = ["./dashboard.html", "./roster.html", "./attendance.html", "./training.html", "./match.html",
  "./stats.html", "./exercises.html", "./library.html", "./play_design.html", "./play_library.html", "./assessment.html",
  "./settings.html", "./compare.html", "./help.html", "./team-bar.css", "./pivot-mobile.css", "./i18n.js", "./i18n-fr.js",
  "./i18n-es.js", "./menu-dropdown.js", "./modules-grid.js", "./org-switcher.js", "./sidebar-widgets.js", "./team-tree.js",
  "./court-diagram.js", "./exercise-categories.js", "./terms-version.js", "./security-guard.js", "./manifest.json", "./favicon-192.png",
  "./favicon-32.png", "./playpivot-logo.png", "./playpivot-logo-negativo.png"];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.allSettled(CORE.map((u) => c.add(new Request(u, { cache: "reload" }))));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE && k.startsWith("playpivot-shell-")).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const ours = url.origin === self.location.origin;
  if (!ours && url.hostname !== "cdn.jsdelivr.net") return; // Supabase y demás: directo a la red
  // Solo ficheros estáticos de la app; nunca el rastreo de Matomo (cada visita tiene URL distinta y
  // llenaría la caché) ni nada que no sea html/js/css/imagen/json.
  if (ours && (url.pathname.indexOf("/analytics/") !== -1 || !/\.(?:html|js|css|png|jpe?g|webp|svg|ico|json|woff2?)$/i.test(url.pathname) && url.pathname !== "/" && !url.pathname.endsWith("/"))) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      const res = await fetch(req);
      if (res && res.ok && (res.type === "basic" || res.type === "cors")) c.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await c.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === "navigate") {
        return new Response("<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><title>PlayPivot</title><body style='font-family:system-ui;padding:40px;text-align:center'><h2>You're offline</h2><p>This page was not saved on this device yet. Open it once with internet and it will be available offline next time.</p><p><a href='./dashboard.html'>Dashboard</a></p>", { headers: { "Content-Type": "text/html; charset=utf-8" } });
      }
      return Response.error();
    }
  })());
});
