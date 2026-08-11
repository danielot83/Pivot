// =============================================================================
// Datos de ejemplo (Chicago Bulls, 3 temporadas) -- una sola fuente de
// verdad, incluida donde haga falta cargar/quitar el ejemplo (como
// modules-grid.js, org-switcher.js), para no tener el mismo roster
// copiado a mano en varios archivos.
// =============================================================================

const EXAMPLE_TEAMS = {
  bulls96: {
    season: "1995-1996", team: "Chicago Bulls",
    players: [
      { first_name: "Michael", last_name: "Jordan", jersey_number: "23", category: "SG" },
      { first_name: "Scottie", last_name: "Pippen", jersey_number: "33", category: "SF" },
      { first_name: "Dennis", last_name: "Rodman", jersey_number: "91", category: "PF" },
      { first_name: "Ron", last_name: "Harper", jersey_number: "9", category: "PG" },
      { first_name: "Luc", last_name: "Longley", jersey_number: "13", category: "C" },
      { first_name: "Toni", last_name: "Kukoc", jersey_number: "7", category: "SF" },
      { first_name: "Steve", last_name: "Kerr", jersey_number: "25", category: "PG" },
      { first_name: "Bill", last_name: "Wennington", jersey_number: "34", category: "C" },
      { first_name: "Jud", last_name: "Buechler", jersey_number: "30", category: "SF" },
      { first_name: "Randy", last_name: "Brown", jersey_number: "1", category: "PG" },
      { first_name: "Dickey", last_name: "Simpkins", jersey_number: "8", category: "PF" },
      { first_name: "Jason", last_name: "Caffey", jersey_number: "35", category: "PF" },
      { first_name: "James", last_name: "Edwards", jersey_number: "53", category: "C" },
      { first_name: "Jack", last_name: "Haley", jersey_number: "4", category: "C" },
      { first_name: "John", last_name: "Salley", jersey_number: "22", category: "PF" },
    ],
  },
  bulls95: {
    season: "1994-1995", team: "Chicago Bulls",
    players: [
      { first_name: "B.J.", last_name: "Armstrong", jersey_number: "10", category: "PG" },
      { first_name: "Steve", last_name: "Kerr", jersey_number: "25", category: "PG" },
      { first_name: "Toni", last_name: "Kukoc", jersey_number: "7", category: "SF" },
      { first_name: "Scottie", last_name: "Pippen", jersey_number: "33", category: "SF" },
      { first_name: "Will", last_name: "Perdue", jersey_number: "32", category: "C" },
      { first_name: "Ron", last_name: "Harper", jersey_number: "9", category: "SG" },
      { first_name: "Bill", last_name: "Wennington", jersey_number: "34", category: "C" },
      { first_name: "Pete", last_name: "Myers", jersey_number: "20", category: "SG" },
      { first_name: "Corie", last_name: "Blount", jersey_number: "44", category: "PF" },
      { first_name: "Dickey", last_name: "Simpkins", jersey_number: "8", category: "PF" },
      { first_name: "Jud", last_name: "Buechler", jersey_number: "30", category: "SF" },
      { first_name: "Luc", last_name: "Longley", jersey_number: "13", category: "C" },
      { first_name: "Larry", last_name: "Krystkowiak", jersey_number: "42", category: "PF" },
      { first_name: "Greg", last_name: "Foster", jersey_number: "35", category: "PF" },
      { first_name: "Michael", last_name: "Jordan", jersey_number: "45", category: "SG" },
      { first_name: "Jo Jo", last_name: "English", jersey_number: "3", category: "PG" },
    ],
  },
  bulls94: {
    season: "1993-1994", team: "Chicago Bulls",
    players: [
      { first_name: "B.J.", last_name: "Armstrong", jersey_number: "10", category: "PG" },
      { first_name: "Steve", last_name: "Kerr", jersey_number: "25", category: "PG" },
      { first_name: "Pete", last_name: "Myers", jersey_number: "20", category: "SG" },
      { first_name: "Bill", last_name: "Wennington", jersey_number: "34", category: "C" },
      { first_name: "Toni", last_name: "Kukoc", jersey_number: "7", category: "SF" },
      { first_name: "Scottie", last_name: "Pippen", jersey_number: "33", category: "SF" },
      { first_name: "Horace", last_name: "Grant", jersey_number: "54", category: "PF" },
      { first_name: "Corie", last_name: "Blount", jersey_number: "44", category: "PF" },
      { first_name: "Will", last_name: "Perdue", jersey_number: "32", category: "C" },
      { first_name: "Bill", last_name: "Cartwright", jersey_number: "24", category: "C" },
      { first_name: "Scott", last_name: "Williams", jersey_number: "42", category: "PF" },
      { first_name: "Jo Jo", last_name: "English", jersey_number: "3", category: "PG" },
      { first_name: "Stacey", last_name: "King", jersey_number: "00", category: "C" },
      { first_name: "Luc", last_name: "Longley", jersey_number: "13", category: "C" },
      { first_name: "John", last_name: "Paxson", jersey_number: "5", category: "PG" },
      { first_name: "Dave", last_name: "Johnson", jersey_number: "8", category: "SG" },
    ],
  },
};
Object.values(EXAMPLE_TEAMS).forEach((ex) => {
  ex.players = ex.players.map((p) => ({ ...p, gender: "Boy", has_license: true, active: true }));
});

const ALL_EXAMPLE_TEAMS = Object.values(EXAMPLE_TEAMS).map((ex) => ({ season: ex.season, team: ex.team }));
const EXAMPLE_TEAM_KEYS = new Set(ALL_EXAMPLE_TEAMS.map((ex) => `${ex.season}|${ex.team}`));
const isExampleTeam = (season, team) => EXAMPLE_TEAM_KEYS.has(`${season}|${team}`);

// Même forme de critères que assessment.html (juste les décomptes, pas
// besoin du texte complet ici) -- pour générer des notes d'exemple.
const CRITERIA_SHAPE = {
  technique: { dribble: 4, tir: 4, passe: 3, defense: 3 },
  intelligence: { sans_ballon: 4, avec_ballon: 3, defense: 5, divers: 3 },
  personnalite: { attitude: 3 },
  comportement: { comportement: 4 },
};
function makeExampleRatings(center, spread) {
  const ratings = {};
  for (const sect in CRITERIA_SHAPE) {
    ratings[sect] = {};
    for (const grp in CRITERIA_SHAPE[sect]) {
      const n = CRITERIA_SHAPE[sect][grp];
      ratings[sect][grp] = Array.from({ length: n }, () => {
        const v = spread ? center + Math.round((Math.random() * 2 - 1) * spread) : center;
        return Math.max(1, Math.min(5, v));
      });
    }
  }
  return ratings;
}
// centre / écart par joueur -- même logique que la démo Bulls du bureau
const ASSESSMENT_PATTERNS = { Jordan: [5, 0], Pippen: [5, 1], Rodman: [4, 1], Harper: [3, 1] };
const DEFAULT_PATTERN = [2, 1];
