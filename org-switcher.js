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
// selector si hay más de uno.
// =============================================================================

const PIVOT_ACTIVE_ORG_KEY = "pivot_active_org_id";

function pivotGetStoredOrgId() {
  try { return localStorage.getItem(PIVOT_ACTIVE_ORG_KEY); } catch (e) { return null; }
}

function pivotSetStoredOrgId(orgId) {
  try { localStorage.setItem(PIVOT_ACTIVE_ORG_KEY, orgId); } catch (e) { /* almacenamiento no disponible, no pasa nada grave */ }
}

/**
 * A partir de la lista de membresías activas de la persona, decide cuál
 * está activa ahora mismo -- la guardada la última vez si todavía es
 * válida, si no la primera de la lista -- y la guarda para la próxima
 * página. Devuelve la fila de membresía elegida (o null si no hay
 * ninguna).
 */
function pivotResolveActiveOrg(memberships) {
  if (!memberships || memberships.length === 0) return null;
  const stored = pivotGetStoredOrgId();
  const match = memberships.find((m) => m.organization_id === stored);
  const chosen = match || memberships[0];
  pivotSetStoredOrgId(chosen.organization_id);
  return chosen;
}

/**
 * Dibuja el selector de club en el elemento dado -- solo se muestra si
 * la persona pertenece a más de uno. Cambiar de club recarga la
 * página, ya que cada página construye todos sus datos alrededor de
 * un solo club.
 */
function pivotRenderOrgSwitcher(containerId, memberships, activeOrgId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!memberships || memberships.length <= 1) { el.style.display = "none"; return; }
  el.style.display = "inline-block";
  el.innerHTML = memberships
    .map((m) => `<option value="${m.organization_id}" ${m.organization_id === activeOrgId ? "selected" : ""}>${(m.organizations && m.organizations.name) || "?"}</option>`)
    .join("");
  el.onchange = () => { pivotSetStoredOrgId(el.value); window.location.reload(); };
}
