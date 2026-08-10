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
    icon: '<path d="M12 5v14M5 12h14"/>',
  },
  {
    key: "library",
    title: "Exercise library",
    blurb: "Search and filter every exercise you can use — your own, your club association's, or the whole Pivot community's.",
    icon: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z"/><path d="M8 7h8M8 10.5h5"/>',
  },
  {
    key: "roster",
    title: "Roster",
    blurb: "Every player, organized by season and team — contacts, license status, jersey numbers, one place per club.",
    icon: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c0-3 2.5-5.3 5.5-5.3s5.5 2.3 5.5 5.3"/><circle cx="18" cy="8.5" r="2.4"/><path d="M15.8 14.3c2.6.2 4.7 2.3 4.7 5"/>',
  },
  {
    key: "training",
    title: "Training builder",
    blurb: "Plan a session straight from your exercise library, keep the timing honest, and mark who actually showed up.",
    icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 4v3M16 4v3"/>',
  },
  {
    key: "match",
    title: "Match day",
    blurb: "Set your lineup, track live stats during the game, and watch a per-player season summary build itself up.",
    icon: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18M3 12h18"/>',
  },
  {
    key: "assessment",
    title: "Player assessment",
    blurb: "Score technique, basketball IQ, personality, and attitude by criteria — sector averages and a chart update as you go.",
    icon: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  },
  {
    key: "plays",
    title: "Play design",
    blurb: "Draw your actual playbook — sets, out-of-bounds plays, defensive schemes — and choose exactly which ones your players get to see.",
    icon: '<circle cx="5" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M5 8v4c0 2 1.5 3 3.5 3H15" stroke-dasharray="3 2.5"/><path d="M15 15l3 0 0 3" />',
  },
  {
    key: "stats",
    title: "Statistics",
    blurb: "A live team overview pulled from Training builder, real development trends per player, and side-by-side comparisons.",
    icon: '<path d="M8 3v18M16 3v18"/><path d="M4 8h4M4 14h4M16 8h4M16 14h4"/>',
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
