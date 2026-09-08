// =============================================================================
// Pertenecer a más de un club a la vez -- una sola fuente de verdad,
// incluida en cada página (como modules-grid.js), para no repetir la
// misma lógica 10 veces.
//
// Antes, cada página pedía SOLO la primera membresía activa
// (".limit(1)") -- alguien en dos clubes solo veía uno, el que la
// consulta devolviera primero, sin ningún orden fijo, y sin ninguna
// forma de cambiar. Esto guarda cuál club está activo en localStorage
// (dura entre páginas, por persona, en este navegador) y dibuja un
// selector si hay más de una opción.
//
// Para el platform admin: una única opción especial "⚡ Admin (all
// clubs)" arriba del todo en el mismo desplegable -- elegirla entra a
// la vista de Admin general (estadísticas de toda la plataforma); elegir
// cualquier club entra a su vista normal, como cualquier otra persona.
// Ya no hay un desplegable Mine/All aparte -- esta única opción hace lo
// mismo de forma más clara.
// =============================================================================

const PIVOT_ACTIVE_ORG_KEY = "pivot_active_org_id";
const PIVOT_ADMIN_VIEW_VALUE = "__admin__";

function pivotGetStoredOrgId() {
  try { return localStorage.getItem(PIVOT_ACTIVE_ORG_KEY); } catch (e) { return null; }
}

function pivotSetStoredOrgId(orgId) {
  try { localStorage.setItem(PIVOT_ACTIVE_ORG_KEY, orgId); } catch (e) { /* almacenamiento no disponible, no pasa nada grave */ }
}

/**
 * A partir de la lista de membresías activas de la persona, decide qué
 * está activo ahora mismo -- lo guardado la última vez si todavía es
 * válido, si no la primera membresía de la lista -- y lo guarda para la
 * próxima página.
 *
 * Para el platform admin: si lo guardado es "__admin__" Y la página que
 * llama pasa `supportsAdminView: true`, devuelve un objeto especial
 * { is_admin_view: true } en vez de un club concreto -- hoy en día solo
 * el Dashboard pasa eso (tiene su propia vista de Admin general). El
 * resto de páginas NO lo pasan (options por defecto = false), así que
 * aquí se ignora el "__admin__" guardado y se cae directamente al
 * primer club real de la persona, como estaba pensado desde el
 * principio pero nunca se llegó a aplicar.
 *
 * BUG arreglado (2026-09-08, a raíz de que a Dani no le dejaba
 * seleccionar ejercicios en Library): antes, CUALQUIER página con el
 * selector de club (no solo el Dashboard) podía terminar con
 * organization_id="__admin__" y role=undefined en cuanto Dani, como
 * platform admin, hubiera elegido alguna vez "⚡ Admin (all clubs)" --
 * ese valor se queda guardado en el navegador y viaja a la siguiente
 * página que se visite. Con role=undefined, cualquier comprobación de
 * permisos (canDelete(), "is this exercise mine", etc.) fallaba en
 * silencio en TODA esa página, sin ningún error visible -- por eso el
 * borrado en lote (y probablemente otras cosas) no hacía nada.
 *
 * Devuelve { organization_id, organizations, role } o { is_admin_view:
 * true } (solo si supportsAdminView), o null si no hay ninguna opción
 * disponible.
 */
async function pivotResolveActiveOrg(memberships, options) {
  options = options || {};
  const isPlatformController = !!options.isPlatformController;
  const supportsAdminView = !!options.supportsAdminView;
  const stored = pivotGetStoredOrgId();

  if (isPlatformController && supportsAdminView && stored === PIVOT_ADMIN_VIEW_VALUE) {
    return { is_admin_view: true, organization_id: PIVOT_ADMIN_VIEW_VALUE };
  }

  const ownMatch = (memberships || []).find((m) => m.organization_id === stored);
  if (ownMatch) return ownMatch;

  if (!memberships || memberships.length === 0) {
    // Nada propio -- si es platform admin Y esta página sabe mostrar la
    // vista de Admin general, que caiga ahí en vez de quedarse sin
    // ningún sitio a donde ir. Si la página no la soporta, no hay nada
    // razonable a lo que caer -- se deja en manos de quien llama (cada
    // página ya sabe mostrar "no eres miembro de ningún club todavía").
    if (isPlatformController && supportsAdminView) {
      pivotSetStoredOrgId(PIVOT_ADMIN_VIEW_VALUE);
      return { is_admin_view: true, organization_id: PIVOT_ADMIN_VIEW_VALUE };
    }
    return null;
  }
  const chosen = memberships[0];
  pivotSetStoredOrgId(chosen.organization_id);
  return chosen;
}

/**
 * Dibuja el selector: los propios clubes de la persona, más "⚡ Admin
 * (all clubs)" arriba del todo si es platform admin Y esta página sabe
 * mostrar esa vista (supportsAdminView -- hoy en día solo el
 * Dashboard), más dos opciones siempre presentes al final: crear un
 * club nuevo, o pedir unirse a otro. Por eso el selector ya nunca se
 * esconde del todo -- hasta con un solo club, sirve para añadir uno
 * más.
 *
 * Antes esta opción aparecía en TODAS las páginas para un platform
 * admin, aunque solo el Dashboard supiera qué hacer si la elegías --
 * elegirla en cualquier otra página dejaba esa página (y cualquier otra
 * que visitaras después) sin club real seleccionado. Ahora solo se
 * ofrece donde tiene sentido.
 */
function pivotRenderOrgSwitcher(containerId, memberships, activeOrgId, options) {
  options = options || {};
  const isPlatformController = !!options.isPlatformController;
  const supportsAdminView = !!options.supportsAdminView;
  const el = document.getElementById(containerId);
  if (!el) return;

  const list = memberships || [];
  el.style.display = "block";
  const optionsHtml = list
    .map((m) => `<option value="${m.organization_id}" ${m.organization_id === activeOrgId ? "selected" : ""}>${(m.organizations && m.organizations.name) || "?"}</option>`)
    .join("");

  const extras = `<option value="__create__">+ Create a new club</option><option value="__join__">+ Join a club</option>`;

  if (isPlatformController && supportsAdminView) {
    const adminSelected = activeOrgId === PIVOT_ADMIN_VIEW_VALUE ? "selected" : "";
    el.innerHTML = `<option value="${PIVOT_ADMIN_VIEW_VALUE}" ${adminSelected}>⚡ Admin (all clubs)</option>` + optionsHtml + extras;
  } else {
    el.innerHTML = optionsHtml + extras;
  }

  el.onchange = () => {
    if (el.value === "__create__") {
      el.value = activeOrgId || "";
      const name = prompt("Name of your new club:");
      if (name && name.trim() && window.pivotCreateClub_) window.pivotCreateClub_(name.trim());
      return;
    }
    if (el.value === "__join__") {
      el.value = activeOrgId || "";
      const name = prompt("Name of the club you want to join:");
      if (name && name.trim() && window.pivotJoinClub_) window.pivotJoinClub_(name.trim());
      return;
    }
    pivotSetStoredOrgId(el.value);
    window.location.reload();
  };
}
