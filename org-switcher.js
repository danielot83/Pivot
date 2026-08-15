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
//
// Para el platform admin, además: un desplegable "Mine / All clubs" --
// en "All", el selector de club lista TODOS los clubes activos de la
// plataforma (no solo los suyos), y puede entrar a cualquiera. En
// "Mine" (por defecto), se comporta exactamente igual que para
// cualquier otra persona -- solo sus propios clubes.
// =============================================================================

const PIVOT_ACTIVE_ORG_KEY = "pivot_active_org_id";
const PIVOT_SWITCHER_SCOPE_KEY = "pivot_org_switcher_scope"; // "mine" | "all"

function pivotGetStoredOrgId() {
  try { return localStorage.getItem(PIVOT_ACTIVE_ORG_KEY); } catch (e) { return null; }
}

function pivotSetStoredOrgId(orgId) {
  try { localStorage.setItem(PIVOT_ACTIVE_ORG_KEY, orgId); } catch (e) { /* almacenamiento no disponible, no pasa nada grave */ }
}

function pivotGetSwitcherScope() {
  try { return localStorage.getItem(PIVOT_SWITCHER_SCOPE_KEY) || "mine"; } catch (e) { return "mine"; }
}

/**
 * A partir de la lista de membresías activas de la persona, decide cuál
 * club está activo ahora mismo -- la guardada la última vez si todavía
 * es válida, si no la primera de la lista -- y la guarda para la
 * próxima página. Devuelve { organization_id, organizations } (o null
 * si no hay ninguna).
 *
 * Para el platform admin en modo "All": si el club guardado no está
 * entre sus propias membresías, lo busca directamente en la tabla
 * organizations (puede entrar aunque no sea miembro) en vez de
 * descartarlo sin más.
 */
async function pivotResolveActiveOrg(memberships, options) {
  options = options || {};
  const isPlatformController = !!options.isPlatformController;
  const supabaseClient = options.supabaseClient || null;
  const stored = pivotGetStoredOrgId();

  const ownMatch = (memberships || []).find((m) => m.organization_id === stored);
  if (ownMatch) return ownMatch;

  if (isPlatformController && stored && pivotGetSwitcherScope() === "all" && supabaseClient) {
    const { data: org } = await supabaseClient.from("organizations").select("id, name").eq("id", stored).maybeSingle();
    if (org) return { organization_id: org.id, organizations: { name: org.name }, role: "admin", browsing_as_platform_admin: true };
  }

  if (!memberships || memberships.length === 0) return null;
  const chosen = memberships[0];
  pivotSetStoredOrgId(chosen.organization_id);
  return chosen;
}

/**
 * Dibuja el selector de club en el elemento dado, y (solo para el
 * platform admin) el desplegable Mine/All justo al lado. Cambiar de
 * club, o de ámbito, recarga la página.
 */
async function pivotRenderOrgSwitcher(containerId, memberships, activeOrgId, options) {
  options = options || {};
  const isPlatformController = !!options.isPlatformController;
  const supabaseClient = options.supabaseClient || null;
  const el = document.getElementById(containerId);
  if (!el) return;

  const scopeId = containerId + "-scope";
  let scopeEl = document.getElementById(scopeId);

  if (isPlatformController && supabaseClient) {
    if (!scopeEl) {
      scopeEl = document.createElement("select");
      scopeEl.id = scopeId;
      scopeEl.title = "Mine = only your own clubs. All clubs = browse any club on PlayPivot.";
      scopeEl.style.cssText = "margin-left:6px; padding:2px 6px; border:1px solid var(--line); border-radius:6px; font-size:12px; background:var(--card); color:var(--muted);";
      scopeEl.innerHTML = '<option value="mine">Mine</option><option value="all">All clubs</option>';
      el.insertAdjacentElement("afterend", scopeEl);
      scopeEl.addEventListener("change", () => {
        try { localStorage.setItem(PIVOT_SWITCHER_SCOPE_KEY, scopeEl.value); } catch (e) {}
        // al cambiar de ambito, se olvida el club activo -- si no,
        // podria quedarse atascado en un club que ya no ve en "Mine"
        try { localStorage.removeItem(PIVOT_ACTIVE_ORG_KEY); } catch (e) {}
        window.location.reload();
      });
    }
    scopeEl.value = pivotGetSwitcherScope();
    scopeEl.style.display = "inline-block";
  } else if (scopeEl) {
    scopeEl.style.display = "none";
  }

  const scope = isPlatformController ? pivotGetSwitcherScope() : "mine";

  let list = memberships || [];
  if (scope === "all" && supabaseClient) {
    const { data } = await supabaseClient.from("organizations").select("id, name").eq("is_active", true).order("name");
    list = (data || []).map((o) => ({ organization_id: o.id, organizations: { name: o.name } }));
  }

  // en "Mine" normal, el selector se sigue escondiendo si solo hay un
  // club (como siempre) -- pero en "All", o si eres platform admin, se
  // deja siempre visible, para poder entrar a cualquiera aunque solo
  // tengas uno propio
  if (scope === "mine" && !isPlatformController && list.length <= 1) { el.style.display = "none"; return; }
  el.style.display = "inline-block";
  el.innerHTML = list
    .map((m) => `<option value="${m.organization_id}" ${m.organization_id === activeOrgId ? "selected" : ""}>${(m.organizations && m.organizations.name) || "?"}</option>`)
    .join("");
  el.onchange = () => { pivotSetStoredOrgId(el.value); window.location.reload(); };
}
