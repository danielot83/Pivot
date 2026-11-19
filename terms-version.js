// =============================================================================
// La versión vigente de los Términos de Uso + Política de privacidad -- una
// sola fuente de verdad, para que login.html, privacy.html y dashboard.html
// nunca se desincronicen. Cámbiala aquí cuando el documento cambie de verdad
// (no por una errata) -- eso es lo que activa que a alguien que ya había
// aceptado una versión anterior se le pida aceptar de nuevo (pantalla de
// re-aceptación en dashboard.html).
// =============================================================================
// Dani 2026-11-18: reescritura completa (Parte A Condiciones + Parte B Privacidad,
// EN/FR/ES). Antes: "2026-09-17". La versión anterior queda archivada tal cual.
const TERMS_VERSION = "2026-11-18";

// -----------------------------------------------------------------------------
// DATOS DEL OPERADOR que aparecen en el documento legal (privacy.html).
// RELLENAR antes de promocionar la app. Si se dejan vacíos, privacy.html
// muestra un texto neutro ("el equipo de PlayPivot", "mediante el enlace
// Contáctanos...") en vez de un hueco. No son secretos: se publican.
//   operatorName : quién explota PlayPivot (asociación / sociedad / persona),
//                  p. ej. "Association PlayPivot, Lausanne" -- cuando exista.
//   contact      : correo de contacto para peticiones de datos, p. ej.
//                  "privacy@playpivot.app" (hay que crearlo).
//   court        : tribunales competentes (por defecto Lausana, Suiza).
//   dbRegion     : región REAL del proyecto Supabase (Ajustes del proyecto →
//                  Infrastructure), p. ej. "Zurich, Switzerland" o "Frankfurt,
//                  Germany". Es un dato que el documento debe decir con verdad.
// -----------------------------------------------------------------------------
const PIVOT_LEGAL = {
  operatorName: "",
  contact: "",
  court: "Lausanne, Switzerland",
  dbRegion: "",
};
