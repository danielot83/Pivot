// =============================================================================
// Moteur de dessin de terrain partagé -- utilisé par play_design.html ET
// exercises.html, pour être sûr que les deux utilisent exactement les
// mêmes conventions (mêmes couleurs, mêmes types de traits, mêmes fonds
// de terrain). Change quelque chose ici, ça change dans les deux à la fois.
// =============================================================================

const COURT_IDS = ["court_1", "court_2", "court_3", "court_4", "court_5"];
const COURT_LABELS = ["Step 1", "Step 2", "Step 3", "Step 4 (vertical)", "Step 5 (full court)"];
const COURT_TYPES = { court_1: "half", court_2: "half", court_3: "half", court_4: "vertical", court_5: "full" };
const CANVAS_SIZES = { half: [300, 280], vertical: [220, 380], full: [420, 240] };

const LINE_KINDS = ["arrow", "dribble", "pass", "shot", "fake_move", "fake_pass", "fake_shot"];
const DIAGRAM_COLORS = [["#141414", "Black"], ["#c9002b", "Red"], ["#1560bd", "Blue"], ["#1e7a3c", "Green"]];

// Les 17 outils exacts de court_editor.py (app de bureau), répartis sur
// trois rangées pour l'affichage.
const TOOLS_ROW1 = [["select","Move/Select"],["player","Attacker"],["defender","Defender"],["coach","Coach (C)"],["ball","Ball"],["cone","Cone"],["post","Post"],["handoff","Handoff (#)"]];
const TOOLS_ROW2 = [["arrow","Movement (no ball)"],["dribble","Movement (dribble)"],["pass","Pass (dashed)"],["screen","Screen"],["zone","Highlighted zone"]];
const TOOLS_ROW3 = [["shot","Shot/finish (double line)"],["fake_move","Fake move"],["fake_pass","Fake pass"],["fake_shot","Fake shot"]];

/** Dessine le fond de terrain (demi, vertical, ou complet horizontal) sur un canvas 2D context donné. */
/** Configure un canvas pour un rendu net sur les écrans haute résolution
    (Retina etc.) -- sans ça, le texte et les traits sortent flous parce
    que le canvas est dessiné à sa taille CSS mais affiché plus grand par
    le navigateur. Renvoie le nouveau contexte 2D à utiliser -- l'appelant
    doit continuer à utiliser cssW/cssH (pas canvas.width/height) pour
    tous les calculs de coordonnées (toPx etc.), le ratio est géré ici. */
function setupHiDPICanvas(canvas, cssW, cssH) {
  const ratio = window.devicePixelRatio || 1;
  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";
  canvas.width = Math.round(cssW * ratio);
  canvas.height = Math.round(cssH * ratio);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return ctx;
}

function drawCourtBackground(ctx, canvas, courtType, cssW, cssH) {
  const w = cssW || canvas.width, h = cssH || canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#c9c9ce"; ctx.lineWidth = 1.2;
  ctx.strokeRect(3, 3, w - 6, h - 6);

  // Dessine un demi-terrain de basket avec le panier en bas, à l'échelle
  // donnée (utilisé tel quel pour "half", et deux fois, dos à dos, pour
  // "full"). Proportions réalistes : raquette étroite, cercle de lancer
  // franc juste au-dessus, arc à 3 points en forme de D.
  function drawHalfCourt(originX, originY, courtW, courtH, basketAtBottom) {
    const cx = originX + courtW / 2;
    const keyW = courtW * 0.32, keyH = courtH * 0.38;
    const keyX = cx - keyW / 2;
    const keyY = basketAtBottom ? originY + courtH - keyH : originY;
    ctx.strokeRect(keyX, keyY, keyW, keyH);

    // petites marques le long de la raquette (blocs où se placent les
    // joueurs pour les lancers francs) -- 2 par côté
    const markLen = 4;
    [0.35, 0.62].forEach((frac) => {
      const my = keyY + keyH * frac;
      ctx.beginPath(); ctx.moveTo(keyX - markLen, my); ctx.lineTo(keyX, my); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(keyX + keyW, my); ctx.lineTo(keyX + keyW + markLen, my); ctx.stroke();
    });

    // cercle de lancer franc -- cercle complet, centré sur la ligne de
    // lancer franc (bord de la raquette côté terrain)
    const ftY = basketAtBottom ? keyY : keyY + keyH;
    const ftR = keyW * 0.375; // vrai terrain : cercle de 12 pieds de diamètre pour une raquette de 16 pieds
    ctx.beginPath(); ctx.arc(cx, ftY, ftR, 0, Math.PI * 2); ctx.stroke();

    const basketY = basketAtBottom ? originY + courtH - 7 : originY + 7;
    const backboardY = basketAtBottom ? basketY - 9 : basketY + 9;
    // planche
    ctx.beginPath(); ctx.moveTo(cx - 15, backboardY); ctx.lineTo(cx + 15, backboardY); ctx.stroke();
    // panier
    ctx.beginPath(); ctx.arc(cx, basketY, 4, 0, Math.PI * 2); ctx.stroke();

    // zone restrictive (petit demi-cercle sous le panier)
    const raR = keyW * 0.26;
    ctx.beginPath();
    if (basketAtBottom) ctx.arc(cx, basketY, raR, Math.PI, 2 * Math.PI);
    else ctx.arc(cx, basketY, raR, 0, Math.PI);
    ctx.stroke();

    // ligne à 3 points -- arc + deux segments droits jusqu'à la ligne de
    // fond, comme sur un vrai terrain (le corner 3 est plus court que le
    // sommet de l'arc). phi = angle (depuis l'axe horizontal du panier)
    // auquel l'arc atteint x = ±cornerX -- vérifié à la main point par point.
    const r3 = courtW * 0.475;
    const cornerX = courtW * 0.44;
    const cornerReach = Math.sqrt(Math.max(r3 * r3 - cornerX * cornerX, 0));
    const phi = Math.acos(cornerX / r3);
    ctx.beginPath();
    if (basketAtBottom) {
      const baseY = originY + courtH - 3;
      const straightTopY = basketY - cornerReach;
      ctx.moveTo(cx - cornerX, baseY);
      ctx.lineTo(cx - cornerX, straightTopY);
      ctx.arc(cx, basketY, r3, Math.PI + phi, 2 * Math.PI - phi);
      ctx.lineTo(cx + cornerX, baseY);
    } else {
      const baseY = originY + 3;
      const straightBottomY = basketY + cornerReach;
      ctx.moveTo(cx - cornerX, baseY);
      ctx.lineTo(cx - cornerX, straightBottomY);
      // sens anti-horaire ici : l'arc doit partir du point où la ligne
      // vient de s'arrêter (coin GAUCHE, angle π-phi) et arriver au coin
      // DROIT (angle phi) -- sinon Canvas relie les deux avec un trait
      // droit en travers de tout le terrain (c'était le bug de la diagonale).
      ctx.arc(cx, basketY, r3, Math.PI - phi, phi, true);
      ctx.lineTo(cx + cornerX, baseY);
    }
    ctx.stroke();
  }

  if (courtType === "half") {
    // demi-cercle central, coupé par le haut du terrain -- comme si on
    // regardait la moitié d'un terrain complet coupé à la ligne médiane
    ctx.beginPath(); ctx.arc(w / 2, 3, (w - 6) * 0.22, 0, Math.PI); ctx.stroke();
    drawHalfCourt(3, 3, w - 6, h - 6, true);
  } else if (courtType === "vertical") {
    ctx.beginPath(); ctx.moveTo(3, h / 2); ctx.lineTo(w - 3, h / 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(w / 2, h / 2, w * 0.22, 0, Math.PI * 2); ctx.stroke();
    drawHalfCourt(3, 3, w - 6, (h - 6) / 2, false);
    drawHalfCourt(3, h / 2, w - 6, (h - 6) / 2, true);
  } else { // "full", horizontal -- même géométrie que "vertical", tournée
    ctx.beginPath(); ctx.moveTo(w / 2, 3); ctx.lineTo(w / 2, h - 3); ctx.stroke();
    ctx.beginPath(); ctx.arc(w / 2, h / 2, h * 0.22, 0, Math.PI * 2); ctx.stroke();
    ctx.save();
    ctx.translate(w / 2, h / 2); ctx.rotate(-Math.PI / 2); ctx.translate(-h / 2, -w / 2);
    drawHalfCourt(3, 3, h - 6, (w - 6) / 2, false);
    drawHalfCourt(3, w / 2, h - 6, (w - 6) / 2, true);
    ctx.restore();
  }
}

/** Dessine un élément de type ligne (arrow/dribble/pass/shot/fake_*). `progress` (0-1) pour l'animation, 1 par défaut. */
function drawLineElement(ctx, toPx, el, progress) {
  progress = progress === undefined ? 1 : progress;
  const pts = el.points || [[el.fromX, el.fromY], [el.toX, el.toY]];
  const [fx, fy] = toPx(pts[0][0], pts[0][1]);
  const [tx0, ty0] = toPx(pts[pts.length - 1][0], pts[pts.length - 1][1]);
  const tx = fx + (tx0 - fx) * progress, ty = fy + (ty0 - fy) * progress;
  const color = el.color || "#141414";
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = el.type === "shot" ? 1.3 : 1.8;

  if (el.type === "pass" || el.type === "fake_pass") ctx.setLineDash([5, 4]);
  else ctx.setLineDash([]);

  if (el.type === "dribble") {
    ctx.beginPath();
    const segs = 8, dx = (tx - fx) / segs, dy = (ty - fy) / segs;
    const nx = -dy, ny = dx, norm = Math.hypot(nx, ny) || 1;
    ctx.moveTo(fx, fy);
    for (let i = 1; i <= segs; i++) {
      const off = (i % 2 === 0 ? 1 : -1) * 3.5;
      ctx.lineTo(fx + dx * i + (nx / norm) * off, fy + dy * i + (ny / norm) * off);
    }
    ctx.stroke();
  } else if (el.type === "shot") {
    const angle = Math.atan2(ty - fy, tx - fx), perp = angle + Math.PI / 2, off = 2.2;
    ctx.beginPath(); ctx.moveTo(fx + Math.cos(perp) * off, fy + Math.sin(perp) * off); ctx.lineTo(tx + Math.cos(perp) * off, ty + Math.sin(perp) * off); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(fx - Math.cos(perp) * off, fy - Math.sin(perp) * off); ctx.lineTo(tx - Math.cos(perp) * off, ty - Math.sin(perp) * off); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(tx, ty); ctx.stroke();
  }
  ctx.setLineDash([]);
  if (el.type && el.type.startsWith("fake_") && el.type !== "fake_pass") {
    ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(tx, ty); ctx.stroke(); ctx.setLineDash([]);
  }

  if (el.type !== "shot" && progress > 0.05) {
    const angle = Math.atan2(ty - fy, tx - fx), ah = 7;
    ctx.beginPath(); ctx.moveTo(tx, ty);
    ctx.lineTo(tx - ah * Math.cos(angle - 0.4), ty - ah * Math.sin(angle - 0.4));
    ctx.lineTo(tx - ah * Math.cos(angle + 0.4), ty - ah * Math.sin(angle + 0.4));
    ctx.closePath(); ctx.fill();
  }
}

/** Dessine une pantalla (écran) : trait + barre en T à la fin. */
function drawScreenElement(ctx, toPx, el) {
  const pts = el.points || [[el.fromX, el.fromY], [el.toX, el.toY]];
  const color = el.color || "#141414";
  const [fx, fy] = toPx(pts[0][0], pts[0][1]);
  const [tx, ty] = toPx(pts[pts.length - 1][0], pts[pts.length - 1][1]);
  ctx.strokeStyle = color; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(tx, ty); ctx.stroke();
  const angle = Math.atan2(ty - fy, tx - fx), perp = angle + Math.PI / 2, cap = 7;
  ctx.beginPath();
  ctx.moveTo(tx + Math.cos(perp) * cap, ty + Math.sin(perp) * cap);
  ctx.lineTo(tx - Math.cos(perp) * cap, ty - Math.sin(perp) * cap);
  ctx.stroke();
}

/** Dessine une zone surlignée (rectangle semi-transparent). */
function drawZoneElement(ctx, toPx, canvas, el) {
  const [x, y] = toPx(el.x, el.y);
  const [x2, y2] = toPx(el.x + el.w, el.y + el.h);
  const w = x2 - x, h = y2 - y;
  ctx.fillStyle = (el.color || "#c9002b") + "33";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = el.color || "#c9002b"; ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
}

/** Dessine un élément "point" (player/defender/coach/cone/ball/post/handoff),
    avec une étiquette optionnelle (numéro ou initiales) pour player/defender. */
function drawPointElement(ctx, toPx, el) {
  const [px, py] = toPx(el.x, el.y);
  const color = el.color || "#141414";
  ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  const label = el.label !== undefined && el.label !== null ? String(el.label) : (el.num !== undefined ? String(el.num) : "");
  if (el.type === "player") {
    ctx.beginPath(); ctx.arc(px, py, 12, 0, Math.PI * 2); ctx.fill();
    if (label) { ctx.fillStyle = "#fff"; ctx.font = "bold 11px Inter, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(label.slice(0, 2), px, py + 0.5); }
  } else if (el.type === "defender") {
    ctx.beginPath(); ctx.arc(px, py, 12, 0, Math.PI * 2); ctx.stroke();
    if (label) { ctx.fillStyle = color; ctx.font = "bold 11px Inter, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(label.slice(0, 2), px, py + 0.5); }
  } else if (el.type === "coach") {
    ctx.font = "bold 14px Inter, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("C", px, py);
  } else if (el.type === "cone") {
    ctx.beginPath(); ctx.moveTo(px, py - 8); ctx.lineTo(px + 7, py + 7); ctx.lineTo(px - 7, py + 7); ctx.closePath(); ctx.fill();
  } else if (el.type === "ball") {
    ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.stroke();
  } else if (el.type === "post") {
    ctx.fillRect(px - 6, py - 6, 12, 12);
  } else if (el.type === "handoff") {
    ctx.font = "bold 13px Inter, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("#", px, py);
  }
}

const POINT_KINDS = ["player", "defender", "coach", "cone", "ball", "post", "handoff"];

/** Dessine n'importe quel élément selon son type -- point, ligne, écran, ou zone. */
function drawDiagramElement(ctx, toPx, canvas, el, progress) {
  if (el.type === "zone") drawZoneElement(ctx, toPx, canvas, el);
  else if (el.type === "screen") drawScreenElement(ctx, toPx, el);
  else if (LINE_KINDS.includes(el.type)) drawLineElement(ctx, toPx, el, progress);
  else if (POINT_KINDS.includes(el.type)) drawPointElement(ctx, toPx, el);
}

/** Construit la barre d'outils des 17 outils dans les trois lignes fournies. */
function buildSharedToolbar(rowIds, onSelect) {
  const rows = [TOOLS_ROW1, TOOLS_ROW2, TOOLS_ROW3];
  rowIds.forEach((rowId, i) => {
    const row = document.getElementById(rowId);
    row.innerHTML = "";
    rows[i].forEach(([key, label]) => {
      const btn = document.createElement("button");
      btn.className = "tool-btn" + (key === "select" || key === "move" ? " active" : "");
      btn.textContent = label;
      btn.dataset.tool = key;
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tool-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        onSelect(key);
      });
      row.appendChild(btn);
    });
  });
}
