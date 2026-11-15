/* PlayPivot -- "¿esta estadística se midió de verdad en este partido?"
 *
 * La base de datos guarda 0 por defecto en puntos/rebotes/asistencias/
 * faltas/tiros (no null), así que un partido donde solo se anotaron
 * puntos tiene "0 rebotes, 0 asistencias" para todos los jugadores, y eso
 * hacía que las medias y las fichas mostraran 0 como si se hubiera medido.
 *
 * Criterio (por partido y por estadística): una estadística cuenta como
 * MEDIDA en un partido si al menos UN jugador tiene un valor distinto de 0
 * en ese partido. Si todos tienen 0 (o null), nadie la anotó: se trata
 * como "no medida" (null) y no entra en medias, totales ni gráficos.
 * Un 0 de un jugador en un partido donde otros sí tienen valor SÍ es un
 * 0 real y cuenta.
 *
 * Minutos y periodos quedan fuera: ya son null cuando no se anotan.
 */
(function () {
  var MATCH_FIELDS = ["points", "rebounds", "assists", "fouls", "made_1", "made_2", "made_3"];
  function isNum(v) { return v !== null && v !== undefined && v !== "" && !isNaN(Number(v)); }
  function isCustom(f) { return String(f).indexOf("custom:") === 0; }

  // rows: filas de match_player_stats de TODOS los jugadores de esos partidos.
  // Devuelve { match_id: { points: true, "custom:steals": true, ... } }
  function measuredByMatch(rows) {
    var out = {};
    (rows || []).forEach(function (r) {
      var o = out[r.match_id] || (out[r.match_id] = {});
      MATCH_FIELDS.forEach(function (f) { if (isNum(r[f]) && Number(r[f]) !== 0) o[f] = true; });
      var cs = r.custom_stats;
      if (cs && typeof cs === "object") Object.keys(cs).forEach(function (k) { if (isNum(cs[k]) && Number(cs[k]) !== 0) o["custom:" + k] = true; });
    });
    return out;
  }

  // Valor de `field` ("points", "custom:steals", "minutes"...) para esa fila,
  // o null si no hay dato o la estadística no se midió en ese partido.
  function value(measured, row, field) {
    var v = isCustom(field) ? (row.custom_stats && typeof row.custom_stats === "object" ? row.custom_stats[String(field).slice(7)] : undefined) : row[field];
    if (!isNum(v)) return null;
    var gated = isCustom(field) || MATCH_FIELDS.indexOf(field) >= 0;
    if (gated && !(measured && measured[row.match_id] && measured[row.match_id][field])) return null;
    return Number(v);
  }

  window.PPMeasured = { MATCH_FIELDS: MATCH_FIELDS, measuredByMatch: measuredByMatch, value: value };
})();
