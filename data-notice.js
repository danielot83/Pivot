// =============================================================================
// Aviso de datos de menores (Dani 2026-11-20).
// La primera vez que una persona va a GUARDAR jugadores reales (añadir uno,
// importar Excel, copiar de otra temporada, invitado en Partido) sale una
// ventana: tu club debe tener derecho a guardar esos datos (consentimiento de
// los padres donde la ley lo exija), PlayPivot no lo comprueba ni responde de
// ello, y no se escriben datos sensibles. Hay que marcar la casilla para seguir.
//
// Dónde queda constancia: en la base de datos (data_notice_acks, step98), con la
// hora del SERVIDOR, vía la función record_data_notice(). Si todavía no se ha
// ejecutado step98 (o falla la red), el aviso sale igual y se recuerda solo en
// ese navegador: nunca bloquea el trabajo por un fallo técnico (fallo abierto).
//
// Uso:  if (!(await pivotEnsureDataNotice(supabaseClient))) return;
// Súbele PIVOT_DATA_NOTICE_VERSION si el texto del aviso cambia de verdad:
// así se vuelve a pedir a todo el mundo.
// =============================================================================
const PIVOT_DATA_NOTICE_VERSION = "2026-11-20";
let _pivotNoticePending = null;

function pivotEnsureDataNotice(client) {
  if (_pivotNoticePending) return _pivotNoticePending;
  _pivotNoticePending = (async () => {
    const T = (typeof _t === "function") ? _t : (s) => s;
    let uid = null;
    try { const { data } = await client.auth.getSession(); uid = data && data.session && data.session.user && data.session.user.id; } catch (e) {}
    const key = "pivot_data_notice_" + (uid || "anon") + "_" + PIVOT_DATA_NOTICE_VERSION;
    try { if (localStorage.getItem(key)) return true; } catch (e) {}
    if (uid) {
      try {
        const { data, error } = await client.from("data_notice_acks").select("id").eq("user_id", uid).eq("notice_version", PIVOT_DATA_NOTICE_VERSION).limit(1);
        if (!error && data && data.length) { try { localStorage.setItem(key, "1"); } catch (e) {} return true; }
      } catch (e) {}
    }
    return await new Promise((resolve) => {
      const ov = document.createElement("div");
      ov.id = "data-notice";
      ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-labelledby", "data-notice-title");
      ov.style.cssText = "position:fixed;inset:0;z-index:100000;background:rgba(8,0,38,.72);display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto;";
      const box = document.createElement("div");
      box.style.cssText = "background:var(--card,#fff);color:var(--ink,#1a1a1a);max-width:540px;width:100%;border-radius:12px;padding:24px 26px;box-shadow:0 12px 40px rgba(0,0,0,.35);max-height:92vh;overflow:auto;font-family:inherit;";
      const h = document.createElement("h2"); h.id = "data-notice-title"; h.style.cssText = "margin:0 0 8px;font-size:19px;"; h.textContent = T("Before you save people's data");
      const intro = document.createElement("p"); intro.style.cssText = "font-size:14.5px;margin:0 0 8px;"; intro.textContent = T("You are about to save data about real people — probably minors.");
      const ul = document.createElement("ul"); ul.style.cssText = "font-size:14px;margin:0 0 12px;padding-left:20px;";
      ["Your club must have the right to hold this data. Depending on the law where you are, that can mean asking the parents or guardians for consent before you enter a minor.",
       "PlayPivot does not check this and is not responsible for it. Your club is.",
       "Only enter what you need. Do not write health or injury details, phone numbers, addresses, photos or ID numbers anywhere, including comments."
      ].forEach((t) => { const li = document.createElement("li"); li.style.marginBottom = "6px"; li.textContent = T(t); ul.appendChild(li); });
      const link = document.createElement("a"); link.href = "./privacy.html#club"; link.target = "_blank"; link.rel = "noopener noreferrer";
      link.style.cssText = "color:var(--accent-deep,#b85012);font-size:14px;font-weight:600;"; link.textContent = T("Read the details");
      const lp = document.createElement("p"); lp.style.margin = "0 0 14px"; lp.appendChild(link);
      const lab = document.createElement("label"); lab.style.cssText = "display:flex;gap:10px;align-items:flex-start;font-size:14px;margin:0 0 6px;cursor:pointer;";
      const cb = document.createElement("input"); cb.type = "checkbox"; cb.id = "data-notice-check"; cb.style.cssText = "margin-top:3px;flex:none;width:auto;";
      const lt = document.createElement("span"); lt.textContent = T("I understand, and I confirm my club is entitled to hold this data.");
      lab.appendChild(cb); lab.appendChild(lt);
      const err = document.createElement("div"); err.id = "data-notice-err"; err.setAttribute("role", "alert"); err.style.cssText = "color:#b42318;font-size:13px;min-height:18px;margin:0 0 8px;";
      const row = document.createElement("div"); row.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;align-items:center;";
      const ok = document.createElement("button"); ok.type = "button"; ok.id = "data-notice-ok"; ok.className = "btn btn-primary"; ok.textContent = T("Continue");
      const no = document.createElement("button"); no.type = "button"; no.id = "data-notice-cancel"; no.className = "btn btn-secondary"; no.textContent = T("Cancel");
      row.appendChild(ok); row.appendChild(no);
      [h, intro, ul, lp, lab, err, row].forEach((n) => box.appendChild(n));
      ov.appendChild(box); document.body.appendChild(ov);
      const done = (v) => { ov.remove(); document.removeEventListener("keydown", onKey, true); resolve(v); };
      const onKey = (e) => { if (e.key === "Escape") { e.preventDefault(); done(false); } };
      document.addEventListener("keydown", onKey, true);
      no.addEventListener("click", () => done(false));
      ok.addEventListener("click", async () => {
        err.textContent = "";
        if (!cb.checked) { err.textContent = T("Tick the box to continue."); return; }
        ok.disabled = true;
        try { await client.rpc("record_data_notice", { p_version: PIVOT_DATA_NOTICE_VERSION }); } catch (e) { /* fallo abierto: no bloquear por un fallo técnico */ }
        try { localStorage.setItem(key, "1"); } catch (e) {}
        done(true);
      });
      cb.focus();
    });
  })().finally(() => { _pivotNoticePending = null; });
  return _pivotNoticePending;
}
