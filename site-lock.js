// =============================================================================
// Candado sencillo para toda la web -- oculta el contenido hasta que se
// escriba la contraseña correcta. NO es seguridad de verdad (es
// JavaScript del navegador, cualquiera con conocimientos técnicos
// podría saltárselo mirando el código) -- solo sirve para mantener
// fuera a visitantes normales mientras se sigue puliendo la app. La
// seguridad real de los datos sigue viviendo en Supabase (RLS), esto
// no la sustituye ni la afecta.
//
// Cambia PIVOT_LOCK_PASSWORD aquí para cambiar la contraseña.
// =============================================================================

const PIVOT_LOCK_PASSWORD = "playpivot2026";
const PIVOT_LOCK_STORAGE_KEY = "pivot_site_unlocked";

(function () {
  // ya desbloqueado antes en este navegador -- no hacer nada más
  try {
    if (localStorage.getItem(PIVOT_LOCK_STORAGE_KEY) === "yes") return;
  } catch (e) { /* localStorage no disponible -- seguimos igualmente al candado */ }

  // ocultar la página al instante, antes de que se pinte nada -- este
  // script tiene que cargarse pronto en el <head>, sin defer/async
  const hideStyle = document.createElement("style");
  hideStyle.id = "pivot-lock-hide-style";
  hideStyle.textContent = "html { visibility: hidden !important; }";
  document.documentElement.appendChild(hideStyle);

  function showLockScreen() {
    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed; inset:0; background:#fafafa; display:flex; align-items:center; justify-content:center; z-index:99999; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;";
    overlay.innerHTML = `
      <div style="background:#fff; border:1px solid #e5e5e5; border-radius:12px; padding:32px 30px; max-width:320px; width:100%; text-align:center;">
        <img src="./playpivot-logo.png" alt="PlayPivot" style="height:26px; width:auto; margin-bottom:4px;" />
        <p style="font-size:13px; color:#6b6b70; margin:0 0 18px;">Still being polished — enter the password to continue.</p>
        <input id="pivot-lock-input" type="password" placeholder="Password" style="width:100%; padding:9px 12px; border:1px solid #e5e5e5; border-radius:6px; font-size:14px; box-sizing:border-box; margin-bottom:10px;" />
        <button id="pivot-lock-btn" style="width:100%; padding:9px; border:none; border-radius:6px; background:#ec6718; color:#fff; font-weight:600; font-size:13.5px; cursor:pointer;">Enter</button>
        <p id="pivot-lock-error" style="display:none; color:#991b1b; font-size:12.5px; margin:10px 0 0;">Wrong password, try again.</p>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.style.setProperty("visibility", "visible", "important"); // gana al "hidden !important" del <html>, solo para este overlay

    const input = overlay.querySelector("#pivot-lock-input");
    const errorEl = overlay.querySelector("#pivot-lock-error");
    input.focus();

    function tryUnlock() {
      if (input.value === PIVOT_LOCK_PASSWORD) {
        try { localStorage.setItem(PIVOT_LOCK_STORAGE_KEY, "yes"); } catch (e) {}
        document.getElementById("pivot-lock-hide-style").remove();
        overlay.remove();
      } else {
        errorEl.style.display = "block";
        input.value = "";
        input.focus();
      }
    }
    overlay.querySelector("#pivot-lock-btn").addEventListener("click", tryUnlock);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") tryUnlock(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showLockScreen);
  } else {
    showLockScreen();
  }
})();
