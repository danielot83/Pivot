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
function drawCourtBackground(ctx, canvas, courtType) {
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#c9c9ce"; ctx.lineWidth = 1.2;
  ctx.strokeRect(3, 3, w - 6, h - 6);

  if (courtType === "half") {
    const keyW = w * 0.34, keyH = h * 0.34;
    const keyX = (w - keyW) / 2, keyY = h - keyH;
    ctx.strokeRect(keyX, keyY, keyW, keyH);
    ctx.beginPath(); ctx.arc(w / 2, keyY, keyW / 2, Math.PI, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(w / 2, h - 5, 6, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(w / 2, h + h * 0.12, h * 0.6, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  } else if (courtType === "vertical") {
    ctx.beginPath(); ctx.moveTo(3, h / 2); ctx.lineTo(w - 3, h / 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(w / 2, h / 2, w * 0.16, 0, Math.PI * 2); ctx.stroke();
    [0, 1].forEach((half) => {
      const keyW = w * 0.5, keyH = h * 0.16;
      const keyX = (w - keyW) / 2, keyY = half === 0 ? 3 : h - keyH - 3;
      ctx.strokeRect(keyX, keyY, keyW, keyH);
      ctx.beginPath(); ctx.arc(w / 2, half === 0 ? 9 : h - 9, 5, 0, Math.PI * 2); ctx.stroke();
    });
  } else { // "full", horizontal
    ctx.beginPath(); ctx.moveTo(w / 2, 3); ctx.lineTo(w / 2, h - 3); ctx.stroke();
    ctx.beginPath(); ctx.arc(w / 2, h / 2, h * 0.16, 0, Math.PI * 2); ctx.stroke();
    [0, 1].forEach((half) => {
      const keyH = h * 0.5, keyW = w * 0.16;
      const keyY = (h - keyH) / 2, keyX = half === 0 ? 3 : w - keyW - 3;
      ctx.strokeRect(keyX, keyY, keyW, keyH);
      ctx.beginPath(); ctx.arc(half === 0 ? 9 : w - 9, h / 2, 5, 0, Math.PI * 2); ctx.stroke();
    });
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
  const w = el.w * canvas.width, h = el.h * canvas.height;
  ctx.fillStyle = (el.color || "#c9002b") + "33";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = el.color || "#c9002b"; ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
}

/** Dessine n'importe quel élément selon son type -- point, ligne, écran, ou zone. */
function drawDiagramElement(ctx, toPx, canvas, el, progress) {
  if (el.type === "zone") drawZoneElement(ctx, toPx, canvas, el);
  else if (el.type === "screen") drawScreenElement(ctx, toPx, el);
  else if (LINE_KINDS.includes(el.type)) drawLineElement(ctx, toPx, el, progress);
  // les éléments "point" (player/defender/coach/cone/ball/post/handoff)
  // restent dessinés par chaque page, car leur style diffère un peu selon
  // le contexte (numérotés pour play_design, libres pour exercises).
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
