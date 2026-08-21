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

// Definida acá adentro (no solo en cada página) porque algunas de las
// funciones de este archivo la necesitan, y no todas las páginas que
// incluyen team-tree.js tienen su propia escapeHtml -- roster.html, por
// ejemplo, nunca la definió (renderiza nombres con textContent, no
// innerHTML). Si la página SÍ tiene la suya, esta queda pisada sin
// problema, es la misma función.
if (typeof escapeHtml === "undefined") {
  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
}

/**
 * Combina las filas de jugadores (season/team/team_category) con las del
 * registro de equipos (teams), sin duplicar -- así una temporada/equipo
 * recién creada (todavía sin jugadores) aparece igual en el árbol.
 * @param {Array<{season, team, team_category}>} playerRows
 * @param {Array<{season, team, team_category}>} teamRows
 */
function mergeTeamRows(playerRows, teamRows) {
  const merged = [...(playerRows || [])];
  const seen = new Set(merged.map((r) => `${r.season}|${r.team}|${r.team_category || ""}|${r.team_gender || ""}`));
  (teamRows || []).forEach((t) => {
    const key = `${t.season}|${t.team}|${t.team_category || ""}|${t.team_gender || ""}`;
    if (!seen.has(key)) { merged.push({ season: t.season, team: t.team, team_category: t.team_category, team_gender: t.team_gender }); seen.add(key); }
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
const TEAM_GENDER_OPTIONS = ["Male", "Female", "Mixed"];

/**
 * El selector nuevo (idea del hermano de Daniel): en vez del árbol
 * desplegable, un solo campo que muestra el equipo elegido ("DEL —
 * U12 — Boys") y al tocarlo abre un popover que se va abriendo un
 * nivel por vez -- Equipo, después Categoría (de ESE equipo), después
 * Género (de ESA categoría) -- con una miga de pan arriba para volver
 * atrás. No incluye la temporada -- eso es un control aparte (ver
 * renderSeasonPicker), porque un mismo equipo/categoría/género puede
 * tener varias temporadas cargadas.
 *
 * `rows` = filas ya mezcladas de jugadores+equipos (season/team/
 * team_category/team_gender). `current` = { team, team_category,
 * team_gender } o null. `onChange(team, category, gender)` se llama
 * cuando se termina de elegir el tercer nivel.
 */
function renderTeamGenderCategoryDropdown(containerId, rows, current, onChange) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Equipo -> Categoría -> Set(Género)
  const byTeam = {};
  (rows || []).forEach((r) => {
    if (!r.team) return;
    byTeam[r.team] = byTeam[r.team] || {};
    const catKey = r.team_category || "";
    byTeam[r.team][catKey] = byTeam[r.team][catKey] || new Set();
    byTeam[r.team][catKey].add(r.team_gender || "");
  });

  const teamName = current && current.team ? current.team : null;
  const subLabel = current && current.team ? [current.team_category, current.team_gender].filter(Boolean).join(" ") : "No team selected yet";

  container.innerHTML = `
    <button type="button" id="${containerId}-trigger" style="width:100%; display:flex; align-items:center; gap:12px; padding:10px 14px; border:1px solid var(--line); border-radius:10px; background:var(--card); cursor:pointer; text-align:left;">
      <span style="flex:1; min-width:0;">
        <span style="display:block; font-size:14.5px; font-weight:700; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${teamName ? escapeHtml(teamName) : "Choose a team…"}</span>
        <span style="display:block; font-size:12.5px; color:var(--muted);">${escapeHtml(subLabel)}</span>
      </span>
      <span style="color:var(--muted); font-size:14px; flex-shrink:0;">▾</span>
    </button>
    <div id="${containerId}-popover" style="display:none; position:relative;">
      <div style="position:absolute; top:6px; left:0; right:0; background:var(--card); border:1px solid var(--line); border-radius:10px; box-shadow:0 8px 24px rgba(0,0,0,.12); z-index:40; max-height:280px; overflow-y:auto;">
        <div id="${containerId}-crumb" style="padding:8px 14px; font-size:12.5px; color:var(--muted); border-bottom:1px solid var(--line); display:none;"></div>
        <div id="${containerId}-list"></div>
      </div>
    </div>`;

  const trigger = document.getElementById(`${containerId}-trigger`);
  const popover = document.getElementById(`${containerId}-popover`);
  const crumbEl = document.getElementById(`${containerId}-crumb`);
  const listEl = document.getElementById(`${containerId}-list`);

  let step = "team"; // "team" -> "category" -> "gender"
  let pickedTeam = null, pickedCategory = null;

  function renderStep() {
    if (step === "team") {
      crumbEl.style.display = "none";
      listEl.innerHTML = Object.keys(byTeam).sort().map((t) => `<button type="button" class="cascade-option" data-team="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join("")
        || `<p class="hint" style="padding:12px 14px; margin:0;">No teams yet.</p>`;
      listEl.querySelectorAll("[data-team]").forEach((btn) => {
        btn.addEventListener("click", () => { pickedTeam = btn.dataset.team; step = "category"; renderStep(); });
      });
    } else if (step === "category") {
      crumbEl.style.display = "block";
      crumbEl.innerHTML = `<button type="button" class="cascade-back">← ${escapeHtml(pickedTeam)}</button>`;
      crumbEl.querySelector(".cascade-back").addEventListener("click", () => { step = "team"; renderStep(); });
      const cats = Object.keys(byTeam[pickedTeam] || {});
      listEl.innerHTML = cats.sort().map((c) => `<button type="button" class="cascade-option" data-cat="${escapeHtml(c)}">${escapeHtml(c || "No category")}</button>`).join("");
      listEl.querySelectorAll("[data-cat]").forEach((btn) => {
        btn.addEventListener("click", () => { pickedCategory = btn.dataset.cat; step = "gender"; renderStep(); });
      });
    } else {
      crumbEl.style.display = "block";
      crumbEl.innerHTML = `<button type="button" class="cascade-back">← ${escapeHtml(pickedTeam)} / ${escapeHtml(pickedCategory || "No category")}</button>`;
      crumbEl.querySelector(".cascade-back").addEventListener("click", () => { step = "category"; renderStep(); });
      const genders = [...(byTeam[pickedTeam][pickedCategory] || new Set())];
      listEl.innerHTML = genders.sort().map((g) => `<button type="button" class="cascade-option" data-gender="${escapeHtml(g)}">${escapeHtml(g || "Not set")}</button>`).join("");
      listEl.querySelectorAll("[data-gender]").forEach((btn) => {
        btn.addEventListener("click", () => {
          popover.style.display = "none";
          const team = pickedTeam, category = pickedCategory, gender = btn.dataset.gender;
          step = "team"; pickedTeam = null; pickedCategory = null;
          onChange(team, category, gender);
        });
      });
    }
  }

  trigger.addEventListener("click", () => {
    const opening = popover.style.display === "none";
    popover.style.display = opening ? "block" : "none";
    if (opening) { step = "team"; pickedTeam = null; pickedCategory = null; renderStep(); }
  });
  document.addEventListener("click", (e) => {
    if (!e.composedPath().includes(container)) popover.style.display = "none";
  });
}

/**
 * Fila de temporadas -- pastillas, no es parte del menú en cascada de
 * arriba porque un mismo equipo/categoría/género puede tener varias
 * temporadas cargadas al mismo tiempo (la actual y las anteriores).
 * `seasons` = lista de temporadas que existen de verdad para el
 * equipo/categoría/género elegido. `onNewSeason` es opcional -- si no
 * se pasa, no se muestra la tarjeta de "+ Nueva temporada".
 */
function renderSeasonPicker(containerId, seasons, currentSeason, onSelect, onNewSeason) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const { current } = guessSeasonOptions();
  container.innerHTML = "";
  container.style.cssText = "display:flex; gap:8px; flex-wrap:wrap;";
  seasons.forEach((s) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "season-pill" + (s === currentSeason ? " active" : "");
    card.innerHTML = `<strong>${escapeHtml(s)}</strong><span>${s === current ? "Current" : "Past"}</span>`;
    card.addEventListener("click", () => onSelect(s));
    container.appendChild(card);
  });
  if (onNewSeason) {
    const addCard = document.createElement("button");
    addCard.type = "button";
    addCard.className = "season-pill season-pill-new";
    addCard.textContent = "+ New season";
    addCard.addEventListener("click", onNewSeason);
    container.appendChild(addCard);
  }
}


/**
 * Popup que se muestra antes de importar un Excel -- pregunta a dónde
 * "pegar" los jugadores (equipo, categoría, temporada), en vez de
 * asumir directo el equipo que ya tenías elegido en el árbol. Los
 * desplegables de equipo y categoría salen de los equipos que ya
 * existen (sacados de `rows`, los mismos datos que arma el árbol);
 * "+ New team…" abre un campo de texto para uno nuevo.
 * Devuelve {season, team, team_category} o null si cancela.
 */
function promptImportTarget(rows, defaults, itemCount) {
  return new Promise((resolve) => {
    const byTeam = {};
    (rows || []).forEach((r) => {
      if (!r.team) return;
      byTeam[r.team] = byTeam[r.team] || {};
      const catKey = r.team_category || "";
      byTeam[r.team][catKey] = byTeam[r.team][catKey] || new Set();
      byTeam[r.team][catKey].add(r.team_gender || "");
    });
    const teamNames = Object.keys(byTeam).sort();
    const { seasons, current } = guessSeasonOptions();

    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed; inset:0; background:rgba(20,20,22,0.55); display:flex; align-items:center; justify-content:center; z-index:999; padding:16px;";
    overlay.innerHTML = `
      <div style="background:var(--card); border-radius:12px; max-width:380px; width:100%; padding:24px 26px;">
        <h3 style="margin:0 0 4px; font-size:17px;">Where does this go?</h3>
        ${typeof itemCount === "number" ? `<p style="margin:0 0 12px; font-size:14px; font-weight:600; color:var(--accent-deep);">${itemCount} player${itemCount === 1 ? "" : "s"} found in that file.</p>` : ""}
        <p style="margin:0 0 16px; font-size:12.5px; color:var(--muted);">Pick the team/category/season these players belong to.</p>

        <label style="display:block; font-size:12.5px; font-weight:600; color:var(--muted); margin-bottom:4px;">Team</label>
        <select id="import-team-select" style="width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:6px; margin-bottom:6px; font-size:14px;">
          ${teamNames.map((t) => `<option value="${t}" ${t === defaults.team ? "selected" : ""}>${t}</option>`).join("")}
          <option value="__new__" ${teamNames.length === 0 || teamNames.indexOf(defaults.team) === -1 ? "selected" : ""}>+ New team…</option>
        </select>
        <input id="import-team-new" type="text" placeholder="Team name (e.g. DEL)" value="${teamNames.indexOf(defaults.team) === -1 ? (defaults.team || "").replace(/"/g, "&quot;") : ""}" style="width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:6px; margin-bottom:14px; font-size:14px; box-sizing:border-box; display:${teamNames.indexOf(defaults.team) === -1 ? "block" : "none"};" />

        <label style="display:block; font-size:12.5px; font-weight:600; color:var(--muted); margin-bottom:4px;">Category</label>
        <select id="import-category-select" style="width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:6px; margin-bottom:14px; font-size:14px;"></select>

        <label style="display:block; font-size:12.5px; font-weight:600; color:var(--muted); margin-bottom:4px;">Gender</label>
        <select id="import-gender-select" style="width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:6px; margin-bottom:14px; font-size:14px;">
          ${TEAM_GENDER_OPTIONS.map((g) => `<option value="${g}" ${g === defaults.team_gender ? "selected" : ""}>${g}</option>`).join("")}
        </select>

        <label style="display:block; font-size:12.5px; font-weight:600; color:var(--muted); margin-bottom:4px;">Season</label>
        <select id="import-season-select" style="width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:6px; margin-bottom:18px; font-size:14px;">
          ${seasons.map((s) => `<option value="${s}" ${s === (defaults.season || current) ? "selected" : ""}>${s}${s === current ? " (current)" : ""}</option>`).join("")}
        </select>

        <div style="display:flex; gap:8px; justify-content:flex-end;">
          <button id="import-target-cancel" style="padding:9px 16px; border-radius:6px; font-size:13.5px; font-weight:600; border:1px solid var(--line); background:none; color:var(--ink); cursor:pointer;">Cancel</button>
          <button id="import-target-confirm" style="padding:9px 16px; border-radius:6px; font-size:13.5px; font-weight:600; border:none; background:var(--accent); color:#fff; cursor:pointer;">${typeof itemCount === "number" ? `Import ${itemCount} player${itemCount === 1 ? "" : "s"}` : "Import here"}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const teamSelect = overlay.querySelector("#import-team-select");
    const teamNewInput = overlay.querySelector("#import-team-new");
    const categorySelect = overlay.querySelector("#import-category-select");
    const genderSelect = overlay.querySelector("#import-gender-select");

    function refreshCategories() {
      const team = teamSelect.value === "__new__" ? null : teamSelect.value;
      const cats = team && byTeam[team] ? Object.keys(byTeam[team]) : [""];
      categorySelect.innerHTML = cats.sort().map((c) => `<option value="${c}" ${c === (defaults.team_category || "") ? "selected" : ""}>${c || "No category"}</option>`).join("")
        + '<option value="__typed__">+ Type a category…</option>';
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
      const team_gender = genderSelect.value;
      const season = overlay.querySelector("#import-season-select").value;
      close({ season, team, team_category, team_gender });
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
      <div style="background:var(--card); border-radius:12px; max-width:640px; width:100%; padding:24px 26px;">
        <h3 style="margin:0 0 4px; font-size:17px;">New season/team</h3>
        <p style="margin:0 0 18px; font-size:12.5px; color:var(--muted);">The team name stays the same across years — pick a new season for it later without retyping anything.</p>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:28px; align-items:start;">
          <div>
            <label style="display:block; font-size:12.5px; font-weight:600; color:var(--muted); margin-bottom:4px;">Season *</label>
            <select id="new-team-season-input" style="width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:6px; margin-bottom:14px; font-size:14px;">
              ${seasons.map((s) => `<option value="${s}" ${s === current ? "selected" : ""}>${s}${s === current ? " (current)" : ""}</option>`).join("")}
            </select>
            <label style="display:block; font-size:12.5px; font-weight:600; color:var(--muted); margin-bottom:4px;">Team name *</label>
            <input id="new-team-name-input" type="text" value="${suggestedName ? suggestedName.replace(/"/g, "&quot;") : ""}" placeholder="e.g. DEL, Chicago Bulls" style="width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:6px; margin-bottom:14px; font-size:14px; box-sizing:border-box;" />
            <label style="display:block; font-size:12.5px; font-weight:600; color:var(--muted); margin-bottom:4px;">Category *</label>
            <select id="new-team-category-input" style="width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:6px; margin-bottom:14px; font-size:14px; color:#8a8a90;">
              <option value="__unselected__" disabled selected>Select category…</option>
              ${TEAM_CATEGORY_OPTIONS.map((c) => `<option value="${c}" style="color:var(--ink);">${c || "No category"}</option>`).join("")}
            </select>
            <label style="display:block; font-size:12.5px; font-weight:600; color:var(--muted); margin-bottom:4px;">Gender *</label>
            <select id="new-team-gender-input" style="width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:6px; margin-bottom:0; font-size:14px; color:#8a8a90;">
              <option value="__unselected__" disabled selected>Select gender…</option>
              ${TEAM_GENDER_OPTIONS.map((g) => `<option value="${g}" style="color:var(--ink);">${g}</option>`).join("")}
            </select>
          </div>
          <div>
            <label style="display:block; font-size:12.5px; font-weight:600; color:var(--muted); margin-bottom:4px;">Team logo (optional)</label>
            <div id="new-team-logo-preview" style="width:100%; aspect-ratio:1; max-width:180px; border:1px dashed var(--line); border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:10px; overflow:hidden; background:var(--paper);">
              <svg viewBox="0 0 24 24" width="56" height="56" stroke="var(--muted)" fill="none" stroke-width="1.3"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6c2 2 3 4 3 6.4s-1 4.4-3 6.4M18.4 5.6c-2 2-3 4-3 6.4s1 4.4 3 6.4"/></svg>
            </div>
            <input id="new-team-logo-input" type="file" accept="image/png,image/jpeg,image/webp" style="width:100%; font-size:13px; margin-bottom:10px;" />
            <p style="margin:0 0 6px; font-size:11.5px; color:var(--muted);">Handy if this club has more than one team — helps tell them apart at a glance. No logo? We'll show a plain ball icon until you add one (or the club's own logo, if it has one).</p>
            <p style="margin:0; font-size:11.5px; color:var(--muted);">Any PNG, JPG or WebP works — we'll crop it to a square and try to remove a plain background automatically. For best results, use a square-ish image with a plain, solid-colored background (a busy photo background won't get removed cleanly). If you'd rather remove the background yourself first, <a href="https://www.remove.bg" target="_blank" rel="noopener" style="color:var(--accent-deep);">remove.bg</a> is a quick free option.</p>
          </div>
        </div>
        <p id="new-team-error" style="display:none; margin:16px 0 0; font-size:12.5px; color:#991b1b;"></p>
        <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:18px;">
          <button id="new-team-cancel-btn" style="padding:9px 16px; border-radius:6px; font-size:13.5px; font-weight:600; border:1px solid var(--line); background:none; color:var(--ink); cursor:pointer;">Cancel</button>
          <button id="new-team-create-btn" style="padding:9px 16px; border-radius:6px; font-size:13.5px; font-weight:600; border:none; background:var(--accent); color:#fff; cursor:pointer;">Create</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const nameInput = overlay.querySelector("#new-team-name-input");
    nameInput.focus();
    nameInput.select();

    // Los <select> arrancan grises (placeholder) -- en cuanto se elige
    // algo de verdad, pasan a texto normal para que quede claro que ya
    // se seleccionó.
    ["#new-team-category-input", "#new-team-gender-input"].forEach((sel) => {
      overlay.querySelector(sel).addEventListener("change", (e) => { e.target.style.color = "var(--ink)"; });
    });

    const logoInput = overlay.querySelector("#new-team-logo-input");
    const logoPreview = overlay.querySelector("#new-team-logo-preview");
    logoInput.addEventListener("change", () => {
      const file = logoInput.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      logoPreview.innerHTML = `<img src="${url}" style="width:100%; height:100%; object-fit:contain;" />`;
    });

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
      const teamCategoryRaw = overlay.querySelector("#new-team-category-input").value;
      const teamGenderRaw = overlay.querySelector("#new-team-gender-input").value;
      if (teamCategoryRaw === "__unselected__") { errorEl.textContent = "Please select a category."; errorEl.style.display = "block"; return; }
      if (teamGenderRaw === "__unselected__") { errorEl.textContent = "Please select a gender."; errorEl.style.display = "block"; return; }
      const teamCategory = teamCategoryRaw;
      const teamGender = teamGenderRaw;
      const season = overlay.querySelector("#new-team-season-input").value;
      const logoFile = overlay.querySelector("#new-team-logo-input").files[0];
      const row = { organization_id: organizationId, season, team, team_category: teamCategory || null, team_gender: teamGender };
      const btn = overlay.querySelector("#new-team-create-btn");
      btn.disabled = true; btn.textContent = "Creating…";

      const { error } = await supabaseClient.from("teams").upsert(row, { onConflict: "organization_id,season,team,team_category,team_gender" });
      if (error) { errorEl.textContent = "Couldn't create that team: " + error.message; errorEl.style.display = "block"; btn.disabled = false; btn.textContent = "Create"; return; }
      if (logoFile) {
        try {
          if (logoFile.size > 8 * 1024 * 1024) throw new Error("That image is over 8 MB — pick a smaller one.");
          const blob = await fileToSquareLogoBlob(logoFile, 400);
          await supabaseClient.storage.from("logos").upload(`${organizationId}/teams/${encodeURIComponent(team)}.png`, blob, { upsert: true, contentType: "image/webp" });
        } catch (e) { /* si el logo falla, el equipo ya se creó igual -- no es motivo para trabar todo */ }
      }
      close({ season: row.season, team: row.team, team_category: row.team_category || "", team_gender: row.team_gender });
    });
  });
}

/**
 * Sea cual sea la imagen que suba alguien (una foto de varios MB del
 * celular, un rectángulo raro, cualquier formato), esto siempre la deja
 * igual: recortada al cuadrado centrado, nunca más grande de 300×300
 * por lado, y en WebP -- bastante más liviano que PNG para este tipo de
 * imagen, y a diferencia de JPG sigue soportando fondo transparente si
 * la imagen original lo tenía. Se sube igual con la extensión ".png" en
 * el nombre del archivo (para no tener que cambiar todas las URLs que
 * ya usan esa ruta en el resto de la app), pero el navegador la
 * interpreta bien porque el tipo real (WebP) va en la cabecera
 * Content-Type, no en el nombre del archivo.
 */
function fileToSquareLogoBlob(file, maxSize) {
  maxSize = maxSize || 400;
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const outSize = Math.min(maxSize, side);
        const canvas = document.createElement("canvas");
        canvas.width = outSize; canvas.height = outSize;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, sx, sy, side, side, 0, 0, outSize, outSize);
        removeUniformBackground(ctx, outSize, outSize);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't process that image."))), "image/webp", 0.85);
      };
      img.onerror = () => reject(new Error("That doesn't look like a valid image."));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.readAsDataURL(file);
  });
}

/**
 * Heurística simple para volver transparente un fondo liso -- mira el
 * color de la esquina superior izquierda como referencia, y "derrama"
 * la transparencia desde TODO el borde de la imagen hacia adentro,
 * pixel conectado por pixel conectado, mientras el color siga siendo
 * parecido. Al arrancar desde el borde (no comparar la imagen entera
 * contra ese color), un elemento interno del logo con un color
 * parecido al fondo (una letra blanca, por ejemplo) no se ve afectado,
 * porque no está conectado con el borde real.
 *
 * Funciona bien cuando el fondo es realmente liso (blanco, o un color
 * sólido) -- que es el caso más común para un escudo/logo. Con una
 * foto de fondo complicado (una pared, el pasto...) no hace milagros,
 * simplemente no encuentra mucho que quitar y no cambia casi nada.
 */
function removeUniformBackground(ctx, w, h, tolerance) {
  tolerance = tolerance == null ? 28 : tolerance;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const bg = [data[0], data[1], data[2]];

  function closeToBg(i) {
    const dr = data[i] - bg[0], dg = data[i + 1] - bg[1], db = data[i + 2] - bg[2];
    return Math.sqrt(dr * dr + dg * dg + db * db) <= tolerance;
  }

  const visited = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) { stack.push(x, 0); stack.push(x, h - 1); }
  for (let y = 0; y < h; y++) { stack.push(0, y); stack.push(w - 1, y); }

  while (stack.length) {
    const y = stack.pop(); const x = stack.pop();
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const vi = y * w + x;
    if (visited[vi]) continue;
    visited[vi] = 1;
    const i = vi * 4;
    if (!closeToBg(i)) continue;
    data[i + 3] = 0;
    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }

  ctx.putImageData(imgData, 0, 0);
}
