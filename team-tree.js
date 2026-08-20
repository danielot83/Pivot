// =============================================================================
// El árbol "Seasons & teams" -- Equipo → Categoría (si existe) → Año.
// Una sola fuente de verdad (como org-switcher.js, example-data.js),
// incluida en cada página que lo necesita, para que sea de verdad
// igual en todas.
//
// Antes era Temporada → Equipo (plano). Ahora cada equipo es su propia
// rama fija -- "DEL" sigue siendo "DEL" aunque pasen los años -- con su
// categoría (U8, U10...) debajo si la tiene, y los años como hojas
// finales. Un equipo sin categoría (como los Bulls) salta directo de
// su nombre a los años.
// =============================================================================

/**
 * Combina las filas de jugadores (season/team/team_category) con las del
 * registro de equipos (teams), sin duplicar -- así una temporada/equipo
 * recién creada (todavía sin jugadores) aparece igual en el árbol.
 * @param {Array<{season, team, team_category}>} playerRows
 * @param {Array<{season, team, team_category}>} teamRows
 */
function mergeTeamRows(playerRows, teamRows) {
  const merged = [...(playerRows || [])];
  const seen = new Set(merged.map((r) => `${r.season}|${r.team}|${r.team_category || ""}`));
  (teamRows || []).forEach((t) => {
    const key = `${t.season}|${t.team}|${t.team_category || ""}`;
    if (!seen.has(key)) { merged.push({ season: t.season, team: t.team, team_category: t.team_category }); seen.add(key); }
  });
  return merged;
}

/**
 * Dibuja el árbol dentro del contenedor dado.
 * @param {string} containerId - id del elemento donde dibujar.
 * @param {Array<{season, team, team_category}>} rows - filas planas (normalmente de players).
 * @param {string|null} activeSeason - temporada actualmente seleccionada.
 * @param {string|null} activeTeam - equipo actualmente seleccionado.
 * @param {(season: string, team: string, category: string) => void} onSelect - al hacer clic en un año.
 * @param {(season: string, team: string) => void} [onDelete] - opcional: si se da, añade un botón 🗑 por año.
 */
function renderTeamTree(containerId, rows, activeSeason, activeTeam, onSelect, onDelete) {
  const container = document.getElementById(containerId);
  if (!container) return;
  // No limpia el contenedor -- quien llama a esto es responsable de
  // limpiarlo antes (así puede añadir algo suyo, como "+ New
  // season/team", sin que esta función se lo borre después).

  const byTeam = {};
  (rows || []).forEach((r) => {
    if (!r.team) return;
    byTeam[r.team] = byTeam[r.team] || {};
    const catKey = r.team_category || "";
    byTeam[r.team][catKey] = byTeam[r.team][catKey] || new Set();
    byTeam[r.team][catKey].add(r.season);
  });

  Object.keys(byTeam).sort().forEach((team) => {
    const teamEl = document.createElement("div");
    teamEl.className = "tree-season"; // même style que l'ancien en-tête de saison -- gras, en haut de sa branche
    teamEl.textContent = team;
    container.appendChild(teamEl);

    const categories = byTeam[team];
    Object.keys(categories).sort().forEach((cat) => {
      if (cat) {
        const catEl = document.createElement("div");
        catEl.textContent = cat;
        catEl.style.cssText = "font-size:11.5px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.3px; margin:6px 0 2px 8px;";
        container.appendChild(catEl);
      }
      Array.from(categories[cat]).sort().reverse().forEach((season) => {
        const btn = document.createElement("button");
        btn.className = "tree-team" + (season === activeSeason && team === activeTeam ? " active" : "");
        if (cat) btn.style.marginLeft = "8px";
        btn.textContent = season;
        btn.addEventListener("click", () => onSelect(season, team, cat));

        if (onDelete) {
          const row = document.createElement("div");
          row.style.cssText = "display:flex; align-items:center;";
          btn.style.flex = "1";
          const delBtn = document.createElement("button");
          delBtn.textContent = "🗑";
          delBtn.title = `Remove ${team} (${season}) — deletes all its players`;
          delBtn.style.cssText = "background:none; border:none; cursor:pointer; font-size:11px; padding:4px 6px; color:var(--muted);";
          delBtn.addEventListener("click", () => onDelete(season, team));
          row.appendChild(btn);
          row.appendChild(delBtn);
          container.appendChild(row);
        } else {
          container.appendChild(btn);
        }
      });
    });
  });
}

/**
 * Misma idea que renderTeamTree, pero en una barra horizontal (pastillas
 * que se van a la siguiente línea si no entran) en vez de una columna
 * vertical -- para páginas que ya tienen su propia sidebar de
 * navegación y no necesitan una segunda columna aparte solo para esto.
 * Cada pastilla es "Equipo · Categoría · Temporada"; la seleccionada se
 * resalta. El botón de borrar es una × chiquita al final de la pastilla.
 */
function renderTeamTreeBar(containerId, rows, activeSeason, activeTeam, onSelect, onDelete) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const byTeam = {};
  (rows || []).forEach((r) => {
    if (!r.team) return;
    byTeam[r.team] = byTeam[r.team] || {};
    const catKey = r.team_category || "";
    byTeam[r.team][catKey] = byTeam[r.team][catKey] || new Set();
    byTeam[r.team][catKey].add(r.season);
  });

  Object.keys(byTeam).sort().forEach((team) => {
    const categories = byTeam[team];
    Object.keys(categories).sort().forEach((cat) => {
      Array.from(categories[cat]).sort().reverse().forEach((season) => {
        const isActive = season === activeSeason && team === activeTeam;
        const pill = document.createElement("button");
        pill.type = "button";
        pill.className = "team-pill" + (isActive ? " active" : "");
        pill.innerHTML = `<strong>${team}</strong>${cat ? ` · ${cat}` : ""} · ${season}`;
        pill.addEventListener("click", () => onSelect(season, team, cat));

        if (onDelete) {
          const delBtn = document.createElement("span");
          delBtn.textContent = "✕";
          delBtn.title = `Remove ${team} (${season}) — deletes all its players`;
          delBtn.className = "team-pill-del";
          delBtn.addEventListener("click", (e) => { e.stopPropagation(); onDelete(season, team); });
          pill.appendChild(delBtn);
        }
        container.appendChild(pill);
      });
    });
  });
}

/**
 * Vista en forma de árbol de carpetas -- Equipo → Categoría → Temporada
 * -- usando <details>/<summary> nativos del navegador (se abren/cierran
 * solos, sin JS extra, y son accesibles de por sí). El equipo va primero
 * porque es lo que se mantiene igual entre años -- la categoría y la
 * temporada son variaciones de ESE equipo, no al revés.
 */
function renderTeamTreeFolders(containerId, rows, activeSeason, activeTeam, activeCategory, onSelect, onDelete, onEditCategory, onRename) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const byTeam = {};
  (rows || []).forEach((r) => {
    if (!r.team) return;
    byTeam[r.team] = byTeam[r.team] || {};
    const catKey = r.team_category || "";
    byTeam[r.team][catKey] = byTeam[r.team][catKey] || new Set();
    byTeam[r.team][catKey].add(r.season);
  });

  // Botones que solo aparecen en la fila activa (la resaltada) -- editar
  // categoría y renombrar equipo. Antes vivían en una barra aparte
  // debajo del árbol; ahora van directo donde ya estás mirando.
  function appendActiveLeafActions(leaf, season, team, cat) {
    if (onEditCategory) {
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.title = cat ? "Edit category" : "Add category";
      editBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`;
      editBtn.className = "tree-folder-leaf-action";
      editBtn.addEventListener("click", (e) => { e.stopPropagation(); onEditCategory(season, team, cat); });
      leaf.appendChild(editBtn);
    }
    if (onRename) {
      const renameBtn = document.createElement("button");
      renameBtn.type = "button";
      renameBtn.title = "Rename team";
      renameBtn.textContent = "Rename";
      renameBtn.className = "tree-folder-leaf-action";
      renameBtn.addEventListener("click", (e) => { e.stopPropagation(); onRename(season, team); });
      leaf.appendChild(renameBtn);
    }
  }

  Object.keys(byTeam).sort().forEach((team) => {
    const cats = byTeam[team];
    const catKeys = Object.keys(cats);
    const teamIsActive = activeTeam === team;

    const teamEl = document.createElement("details");
    teamEl.className = "tree-folder tree-folder-season";
    if (teamIsActive) teamEl.open = true;
    const teamSummary = document.createElement("summary");
    teamSummary.textContent = team;
    teamEl.appendChild(teamSummary);

    if (catKeys.length === 1 && !catKeys[0]) {
      // Sin categoría -- las temporadas cuelgan directo del equipo, sin
      // una carpeta de categoría de más.
      [...cats[""]].sort().reverse().forEach((season) => {
        const seasonIsActive = teamIsActive && !activeCategory && activeSeason === season;
        const leaf = document.createElement("div");
        leaf.className = "tree-folder-leaf-row" + (seasonIsActive ? " active-row" : "");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "tree-folder-leaf" + (seasonIsActive ? " active" : "");
        btn.textContent = season;
        btn.addEventListener("click", () => onSelect(season, team, ""));
        leaf.appendChild(btn);
        if (seasonIsActive) appendActiveLeafActions(leaf, season, team, "");
        if (onDelete) leaf.appendChild(makeDeleteBtn(team, season, "", onDelete));
        teamEl.appendChild(leaf);
      });
    } else {
      catKeys.sort().forEach((cat) => {
        const catIsActive = teamIsActive && (activeCategory || "") === (cat || "");
        const catEl = document.createElement("details");
        catEl.className = "tree-folder tree-folder-team";
        if (catIsActive) catEl.open = true;
        const catSummary = document.createElement("summary");
        catSummary.textContent = cat || "No category";
        catEl.appendChild(catSummary);
        [...cats[cat]].sort().reverse().forEach((season) => {
          const seasonIsActive = catIsActive && activeSeason === season;
          const leaf = document.createElement("div");
          leaf.className = "tree-folder-leaf-row" + (seasonIsActive ? " active-row" : "");
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "tree-folder-leaf" + (seasonIsActive ? " active" : "");
          btn.textContent = season;
          btn.addEventListener("click", () => onSelect(season, team, cat));
          leaf.appendChild(btn);
          if (seasonIsActive) appendActiveLeafActions(leaf, season, team, cat);
          if (onDelete) leaf.appendChild(makeDeleteBtn(team, season, cat, onDelete));
          catEl.appendChild(leaf);
        });
        teamEl.appendChild(catEl);
      });
    }

    container.appendChild(teamEl);
  });
}

function makeDeleteBtn(team, season, category, onDelete) {
  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.innerHTML = `<svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M18 7l-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 7"/></svg>`;
  delBtn.title = category ? `Remove ${team} (${category}, ${season}) — deletes all its players` : `Remove ${team} (${season}) — deletes all its players`;
  delBtn.className = "team-pill-del";
  delBtn.addEventListener("click", (e) => { e.stopPropagation(); onDelete(season, team, category); });
  return delBtn;
}

/**
 * Genera las temporadas típicas para elegir en un desplegable, sin
 * tener que escribirlas -- la actual (según la fecha de hoy, una
 * temporada de baloncesto va de agosto a junio) más un año antes y dos
 * después.
 */
function guessSeasonOptions() {
  const today = new Date();
  const y = today.getFullYear();
  const currentStart = today.getMonth() >= 6 ? y : y - 1; // agosto (índice 6) en adelante ya es la temporada siguiente
  const seasons = [];
  for (let offset = -1; offset <= 2; offset++) {
    const start = currentStart + offset;
    seasons.push(`${start}-${start + 1}`);
  }
  return { seasons, current: `${currentStart}-${currentStart + 1}` };
}

const TEAM_CATEGORY_OPTIONS = ["", "U6", "U7", "U8", "U9", "U10", "U11", "U12", "U13", "U14", "U15", "U16", "U17", "U18", "U19", "U20", "Seniors"];

/**
 * Popup que se muestra antes de importar un Excel -- pregunta a dónde
 * "pegar" los jugadores (equipo, categoría, temporada), en vez de
 * asumir directo el equipo que ya tenías elegido en el árbol. Los
 * desplegables de equipo y categoría salen de los equipos que ya
 * existen (sacados de `rows`, los mismos datos que arma el árbol);
 * "+ New team…" abre un campo de texto para uno nuevo.
 * Devuelve {season, team, team_category} o null si cancela.
 */
function promptImportTarget(rows, defaults) {
  return new Promise((resolve) => {
    const byTeam = {};
    (rows || []).forEach((r) => {
      if (!r.team) return;
      byTeam[r.team] = byTeam[r.team] || new Set();
      byTeam[r.team].add(r.team_category || "");
    });
    const teamNames = Object.keys(byTeam).sort();
    const { seasons, current } = guessSeasonOptions();

    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed; inset:0; background:rgba(20,20,22,0.55); display:flex; align-items:center; justify-content:center; z-index:999; padding:16px;";
    overlay.innerHTML = `
      <div style="background:var(--card); border-radius:12px; max-width:380px; width:100%; padding:24px 26px;">
        <h3 style="margin:0 0 4px; font-size:17px;">Where does this go?</h3>
        <p style="margin:0 0 16px; font-size:12.5px; color:var(--muted);">Pick the team/category/season these players belong to.</p>

        <label style="display:block; font-size:12.5px; font-weight:600; color:var(--muted); margin-bottom:4px;">Team</label>
        <select id="import-team-select" style="width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:6px; margin-bottom:6px; font-size:14px;">
          ${teamNames.map((t) => `<option value="${t}" ${t === defaults.team ? "selected" : ""}>${t}</option>`).join("")}
          <option value="__new__" ${teamNames.length === 0 || teamNames.indexOf(defaults.team) === -1 ? "selected" : ""}>+ New team…</option>
        </select>
        <input id="import-team-new" type="text" placeholder="Team name (e.g. DEL)" value="${teamNames.indexOf(defaults.team) === -1 ? (defaults.team || "").replace(/"/g, "&quot;") : ""}" style="width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:6px; margin-bottom:14px; font-size:14px; box-sizing:border-box; display:${teamNames.indexOf(defaults.team) === -1 ? "block" : "none"};" />

        <label style="display:block; font-size:12.5px; font-weight:600; color:var(--muted); margin-bottom:4px;">Category</label>
        <select id="import-category-select" style="width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:6px; margin-bottom:14px; font-size:14px;"></select>

        <label style="display:block; font-size:12.5px; font-weight:600; color:var(--muted); margin-bottom:4px;">Season</label>
        <select id="import-season-select" style="width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:6px; margin-bottom:18px; font-size:14px;">
          ${seasons.map((s) => `<option value="${s}" ${s === (defaults.season || current) ? "selected" : ""}>${s}${s === current ? " (current)" : ""}</option>`).join("")}
        </select>

        <div style="display:flex; gap:8px; justify-content:flex-end;">
          <button id="import-target-cancel" style="padding:9px 16px; border-radius:6px; font-size:13.5px; font-weight:600; border:1px solid var(--line); background:none; color:var(--ink); cursor:pointer;">Cancel</button>
          <button id="import-target-confirm" style="padding:9px 16px; border-radius:6px; font-size:13.5px; font-weight:600; border:none; background:var(--accent); color:#fff; cursor:pointer;">Import here</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const teamSelect = overlay.querySelector("#import-team-select");
    const teamNewInput = overlay.querySelector("#import-team-new");
    const categorySelect = overlay.querySelector("#import-category-select");

    function refreshCategories() {
      const team = teamSelect.value === "__new__" ? null : teamSelect.value;
      const cats = team && byTeam[team] ? [...byTeam[team]] : [""];
      categorySelect.innerHTML = cats.sort().map((c) => `<option value="${c}" ${c === (defaults.team_category || "") ? "selected" : ""}>${c || "No category"}</option>`).join("")
        + (cats.every((c) => c !== "__new__") ? '<option value="__typed__">+ Type a category…</option>' : "");
    }
    refreshCategories();

    teamSelect.addEventListener("change", () => {
      teamNewInput.style.display = teamSelect.value === "__new__" ? "block" : "none";
      refreshCategories();
    });

    categorySelect.addEventListener("change", () => {
      if (categorySelect.value !== "__typed__") return;
      const typed = prompt("Category (e.g. U8) — leave blank for none:", "");
      const val = (typed || "").trim();
      const opt = document.createElement("option");
      opt.value = val; opt.textContent = val || "No category"; opt.selected = true;
      categorySelect.insertBefore(opt, categorySelect.lastElementChild);
    });

    const close = (result) => { overlay.remove(); resolve(result); };
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(null); });
    overlay.querySelector("#import-target-cancel").addEventListener("click", () => close(null));
    overlay.querySelector("#import-target-confirm").addEventListener("click", () => {
      const team = teamSelect.value === "__new__" ? teamNewInput.value.trim() : teamSelect.value;
      if (!team) { teamNewInput.focus(); return; }
      const team_category = categorySelect.value === "__typed__" ? "" : categorySelect.value;
      const season = overlay.querySelector("#import-season-select").value;
      close({ season, team, team_category });
    });
  });
}

/**
 * Flujo de "+ New season/team" -- un formulario de verdad (en una
 * ventana emergente), en vez de tres preguntas seguidas del navegador.
 * Temporada y categoría se eligen de un desplegable, no se escriben a
 * mano -- así nunca hay "U8"/"u8 "/"U-8" mezclados para el mismo grupo.
 * @returns {Promise<{season, team, team_category}|null>} null si se cancela.
 */
function promptNewTeam(supabaseClient, organizationId, suggestedName) {
  return new Promise((resolve) => {
    const { seasons, current } = guessSeasonOptions();
    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed; inset:0; background:rgba(20,20,22,0.55); display:flex; align-items:center; justify-content:center; z-index:999; padding:16px;";
    overlay.innerHTML = `
      <div style="background:var(--card); border-radius:12px; max-width:380px; width:100%; padding:24px 26px;">
        <h3 style="margin:0 0 4px; font-size:17px;">New season/team</h3>
        <p style="margin:0 0 16px; font-size:12.5px; color:var(--muted);">The team name stays the same across years — pick a new season for it later without retyping anything.</p>
        <label style="display:block; font-size:12.5px; font-weight:600; color:var(--muted); margin-bottom:4px;">Season</label>
        <select id="new-team-season-input" style="width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:6px; margin-bottom:14px; font-size:14px;">
          ${seasons.map((s) => `<option value="${s}" ${s === current ? "selected" : ""}>${s}${s === current ? " (current)" : ""}</option>`).join("")}
        </select>
        <label style="display:block; font-size:12.5px; font-weight:600; color:var(--muted); margin-bottom:4px;">Team name</label>
        <input id="new-team-name-input" type="text" value="${suggestedName ? suggestedName.replace(/"/g, "&quot;") : ""}" placeholder="e.g. DEL, Chicago Bulls" style="width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:6px; margin-bottom:14px; font-size:14px; box-sizing:border-box;" />
        <label style="display:block; font-size:12.5px; font-weight:600; color:var(--muted); margin-bottom:4px;">Category (optional)</label>
        <select id="new-team-category-input" style="width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:6px; margin-bottom:18px; font-size:14px;">
          ${TEAM_CATEGORY_OPTIONS.map((c) => `<option value="${c}">${c || "No category"}</option>`).join("")}
        </select>
        <div style="display:flex; gap:8px; justify-content:flex-end;">
          <button id="new-team-cancel-btn" style="padding:9px 16px; border-radius:6px; font-size:13.5px; font-weight:600; border:1px solid var(--line); background:none; color:var(--ink); cursor:pointer;">Cancel</button>
          <button id="new-team-create-btn" style="padding:9px 16px; border-radius:6px; font-size:13.5px; font-weight:600; border:none; background:var(--accent); color:#fff; cursor:pointer;">Create</button>
        </div>
        <p id="new-team-error" style="display:none; margin:10px 0 0; font-size:12.5px; color:#991b1b;"></p>
      </div>
    `;
    document.body.appendChild(overlay);
    const nameInput = overlay.querySelector("#new-team-name-input");
    nameInput.focus();
    nameInput.select();

    function close(result) {
      overlay.remove();
      resolve(result);
    }
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(null); });
    overlay.querySelector("#new-team-cancel-btn").addEventListener("click", () => close(null));
    overlay.querySelector("#new-team-create-btn").addEventListener("click", async () => {
      const team = nameInput.value.trim();
      const errorEl = overlay.querySelector("#new-team-error");
      if (!team) { errorEl.textContent = "Team name can't be empty."; errorEl.style.display = "block"; nameInput.focus(); return; }
      const teamCategory = overlay.querySelector("#new-team-category-input").value;
      const season = overlay.querySelector("#new-team-season-input").value;
      const row = { organization_id: organizationId, season, team, team_category: teamCategory || null };
      const btn = overlay.querySelector("#new-team-create-btn");
      btn.disabled = true; btn.textContent = "Creating…";
      const { error } = await supabaseClient.from("teams").upsert(row, { onConflict: "organization_id,season,team,team_category" });
      if (error) { errorEl.textContent = "Couldn't create that team: " + error.message; errorEl.style.display = "block"; btn.disabled = false; btn.textContent = "Create"; return; }
      close({ season: row.season, team: row.team, team_category: row.team_category || "" });
    });
  });
}
