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
  container.innerHTML = "";

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
