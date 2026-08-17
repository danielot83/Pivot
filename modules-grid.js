// =============================================================================
// Grille des modules -- une seule source de vérité pour cette liste.
// Utilisée par index.html, module.html, et le tableau de bord.
// Change une icône ou un texte ici, ça change partout où ce fichier est inclus.
// =============================================================================

const PIVOT_MODULES = [
  {
    key: "exercises",
    title: "Create exercise",
    blurb: "Draw a drill by hand on a real court diagram, or describe it to an AI and let it fill in the details for you to check.",
    icon: '<g transform="scale(0.375)"><g><g><polyline points="36.13 6.64 41.79 6.64 41.79 12.61 22.21 12.61 22.21 6.64 27.87 6.64"/><path d="M27.87,6.64c0-2.28,1.85-4.13,4.13-4.13s4.13,1.85,4.13,4.13"/></g><polyline points="41.79 8.6 55.33 8.6 55.33 61.49 8.67 61.49 8.67 8.6 22.21 8.6"/></g><circle cx="19.08" cy="22.15" r="3.13"/><circle cx="46.01" cy="46.32" r="3.13"/><circle cx="36.13" cy="31.35" r="3.13"/><g><line x1="15.13" y1="38.18" x2="20.83" y2="43.97"/><line x1="20.83" y1="38.18" x2="15.13" y2="43.97"/></g><g><line x1="43.16" y1="19.02" x2="48.86" y2="24.81"/><line x1="48.86" y1="19.02" x2="43.16" y2="24.81"/></g><g><line x1="27.87" y1="50.15" x2="33.57" y2="55.93"/><line x1="33.57" y1="50.15" x2="27.87" y2="55.93"/></g><path d="M22.85,27.43s-.14,14.97,16.41,16.53"/><line x1="36.13" y1="24.21" x2="36.13" y2="16.58"/></g>',
  },
  {
    key: "library",
    title: "Exercise library",
    blurb: "Search and filter every exercise you can use — your own, your club association's, or the whole PlayPivot community's.",
    icon: '<g transform="scale(0.375)"><circle cx="32" cy="32" r="28.47"/><path d="M53.56,13.43c-.83-.12-1.68-.22-2.53-.29-4.71-.4-9.31.04-13.64,1.19-1.84.49-3.63,1.1-5.35,1.84-2.43,1.03-4.73,2.29-6.89,3.76-9.03,6.14-15.48,15.91-17.13,27.41"/><path d="M28.72,60.28c-3.75-10.02-.22-28.04-.24-31.84-.02-2.73-.81-6.11-3.33-8.51-1.46-1.39-3.51-2.45-6.32-2.87-7.42-1.11-14.12,7.82-14.51,8.37h0s-.02.03-.02.03"/><path d="M19.45,6.45c3.12,1.58,7.83,4.54,12.59,9.71,6.95,7.51,14.03,19.71,16.44,39.05"/><path d="M33.2,3.56c-.06,3.02.62,7.34,4.19,10.76.3.29.62.56.97.84,4.87,3.87,13.96,8.1,22.01,14.61"/></g>',
  },
  {
    key: "roster",
    title: "Roster",
    blurb: "Every player, organized by season and team — contacts, license status, jersey numbers, one place per club.",
    icon: '<g transform="scale(0.375)"><g><g><polyline points="31.82 61.3 5.85 61.3 5.85 26.3 13.63 20.19 13.63 2.7 19.24 2.7 21.61 2.7"/><polyline points="31.82 61.3 58.15 61.3 58.15 26.3 50.36 20.19 50.36 2.7 44.41 2.7 42.04 2.7"/><path d="M19.24,2.7c1.3,4.82,6.44,8.43,12.59,8.43s11.29-3.61,12.59-8.43"/><path d="M21.61,2.7c2.36,2.57,6.06,4.21,10.21,4.21s7.85-1.64,10.21-4.21"/></g><g><rect x="20.21" y="28.23" width="10" height="18.75" rx="4.7" ry="4.7"/><polyline points="34.91 30.56 36.07 28.23 40.19 28.23 40.19 46.98"/><line x1="36.59" y1="46.98" x2="43.79" y2="46.98"/></g></g><polyline points="13.63 2.7 7.28 2.7 7.28 25.18"/><polyline points="50.37 2.7 56.72 2.7 56.72 25.18"/></g>',
  },
  {
    key: "training",
    title: "Training builder",
    blurb: "Plan a session straight from your exercise library, keep the timing honest, and mark who actually showed up.",
    icon: '<g transform="scale(0.375)"><circle cx="32.02" cy="36.65" r="24.65"/><g><path d="M31.98,17.39c10.64,0,19.26,8.62,19.26,19.26s-8.62,19.26-19.26,19.26-18.5-7.88-19.2-17.88"/><circle cx="31.98" cy="36.65" r="3.87"/><line x1="29.36" y1="33.81" x2="21.76" y2="25.58"/></g><rect x="26.15" y="2.58" width="11.74" height="5.74" rx="2.87" ry="2.87"/><line x1="32.02" y1="12" x2="32.02" y2="8.31"/><g><g><rect x="3.48" y="12.3" width="11.74" height="5.74" rx="2.87" ry="2.87" transform="translate(-8.12 11.64) rotate(-46.93)"/><line x1="14.13" y1="19.69" x2="11.42" y2="17.15"/></g><g><rect x="48.75" y="12.3" width="11.74" height="5.74" rx="2.87" ry="2.87" transform="translate(27.65 -34.69) rotate(46.07)"/><line x1="52.53" y1="17.14" x2="49.89" y2="19.68"/></g></g></g>',
  },
  {
    key: "match",
    title: "Match day",
    blurb: "Set your lineup, track live stats during the game, and watch a per-player season summary build itself up.",
    icon: '<g transform="scale(0.375)"><polyline points="32 13.75 23.1 6.4 16.3 8.74 1.65 19.78 11.63 31.04 16.82 28.49 16.82 57.6 32 57.6"/><polyline points="4.88 23.43 16.82 14.33 16.82 28.49"/><line x1="16.82" y1="21.12" x2="8.47" y2="27.48"/><polyline points="23.1 57.6 23.1 6.4 40.9 6.4 40.9 57.6"/><line x1="29.38" y1="57.6" x2="29.38" y2="11.59"/><polyline points="32 13.75 40.9 6.4 47.7 8.74 62.35 19.78 52.37 31.04 47.18 28.49 47.18 57.6 32 57.6"/><polyline points="59.12 23.43 47.18 14.33 47.18 28.49"/><line x1="55.53" y1="27.48" x2="47.18" y2="21.12"/><line x1="34.62" y1="57.6" x2="34.62" y2="11.59"/></g>',
  },
  {
    key: "assessment",
    title: "Player assessment",
    blurb: "Score technique, basketball IQ, personality, and attitude by criteria — sector averages and a chart update as you go.",
    icon: '<g transform="scale(0.375)"><path d="M58.02,49.76c-19.51,1.3-44.05.31-52.52-.11-1.7-.08-3.03-1.49-3.03-3.19v-1.8c0-1.52,1.07-2.83,2.56-3.13l14.23-2.89c2.83-.57,5.75-.57,8.58,0l16.04,3.25c1.48.3,2.99.44,4.49.43l9.36-.09c2.09-.02,3.8,1.67,3.8,3.77h0c0,1.99-1.54,3.63-3.52,3.76Z"/><path d="M4.03,41.9l-.14-15.4c-.01-2.09,1.16-4.01,3.06-5l14.28-7.46c1.99-1.04,4.48-.23,5.4,1.75l3.33,7.09,16.76,9.81h6.51c3.38,0,6.13,2.63,6.13,5.9v4"/><polyline points="36.36 26.62 32.14 32.91 27.12 29.53 31.14 23.56"/><polyline points="44.45 31.36 41.65 35.53 36.63 32.16 39.23 28.3"/><path d="M16.91,16.31v4.4c0,3.31-1.82,6.35-4.72,7.93l-8.24,4.44"/></g>',
  },
  {
    key: "plays",
    title: "Play design",
    blurb: "Draw your actual playbook — sets, out-of-bounds plays, defensive schemes — and choose exactly which ones your players get to see.",
    icon: '<g transform="scale(0.375)"><rect x="2.43" y="9.83" width="59.13" height="44.35"/><path d="M2.44,48.82c9.75-1.29,17.22-8.32,17.22-16.82S12.19,16.46,2.44,15.18"/><circle cx="12.01" cy="32" r="4.54"/><circle cx="32" cy="32" r="7.82"/><rect x="2.43" y="24.53" width="9.57" height="14.94"/><path d="M61.56,15.18c-9.75,1.29-17.22,8.32-17.22,16.82,0,8.5,7.46,15.54,17.22,16.82"/><rect x="51.99" y="24.53" width="9.57" height="14.94" transform="translate(113.56 64) rotate(-180)"/><line x1="32" y1="9.83" x2="32" y2="54.17"/><circle cx="51.99" cy="32" r="4.54"/></g>',
  },
  {
    key: "stats",
    title: "Statistics",
    blurb: "A live team overview pulled from Training builder, real development trends per player, and side-by-side comparisons.",
    icon: '<g transform="scale(0.375)"><line x1="48.63" y1="12.63" x2="42.66" y2="12.63"/><path d="M53.13,12.63h2.54c2.92,0,5.29,2.37,5.29,5.29v31.5c0,2.91-2.37,5.28-5.29,5.28H8.33c-2.92,0-5.29-2.37-5.29-5.28v-31.5c0-2.92,2.37-5.29,5.29-5.29h2.54"/><line x1="38.16" y1="12.63" x2="25.84" y2="12.63"/><line x1="21.34" y1="12.63" x2="15.37" y2="12.63"/><line x1="32" y1="12.63" x2="32" y2="54.69"/><line x1="3.04" y1="25.15" x2="60.96" y2="25.15"/><g><g><rect x="10.87" y="9.3" width="4.5" height="9.59" rx="1.54" ry="1.54"/><rect x="21.34" y="9.3" width="4.5" height="9.59" rx="1.54" ry="1.54"/></g><g><rect x="38.16" y="9.3" width="4.5" height="9.59" rx="1.54" ry="1.54"/><rect x="48.63" y="9.3" width="4.5" height="9.59" rx="1.54" ry="1.54"/></g></g><polyline points="7.25 43.01 7.25 46.42 15.53 46.42 15.53 32.07 7.25 32.07 7.25 38.65"/><rect x="19.61" y="32.06" width="8.28" height="14.35"/><rect x="36.11" y="32.06" width="8.28" height="14.35"/><polyline points="56.75 32.07 48.47 32.07 48.47 38.65 48.47 46.42 56.75 46.42 56.75 38.65"/><line x1="7.25" y1="38.65" x2="15.53" y2="38.65"/><line x1="36.11" y1="39.24" x2="44.39" y2="39.24"/><line x1="48.47" y1="38.65" x2="56.75" y2="38.65"/></g>',
  },
];

/**
 * Dessine la grille dans un élément donné.
 * @param {string} containerId - id de l'élément où insérer la grille
 * @param {(m: object) => string} linkFor - fonction qui donne l'URL pour un module
 *   (par défaut : module.html?m=xxx, la fiche publique -- le futur tableau de
 *   bord passera sa propre fonction pour pointer directement vers l'outil,
 *   ex. roster.html au lieu de module.html?m=roster)
 */
function renderModulesGrid(containerId, linkFor) {
  linkFor = linkFor || ((m) => `module.html?m=${m.key}`);
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = PIVOT_MODULES.map((m) => `
    <a class="module-card" href="${linkFor(m)}">
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">${m.icon}</svg>
      <h3>${m.title}${m.soon ? ' <span class="badge-soon">Coming soon</span>' : ""} <span class="chevron">→</span></h3>
      <p class="blurb">${m.blurb}</p>
    </a>
  `).join("");
}
