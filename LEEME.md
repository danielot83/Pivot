# Entrega 56 — Stats al día + aviso de jugadores no importados

Sube: `match.html`, `stats.html`, `i18n-fr.js`, `i18n-es.js`. (Sin SQL nuevo; si aún no corriste `step93` de la entrega 55, córrelo antes.)

- **Stats** (stats.html): nueva columna/tarjeta **"Periodos como cambio"** (Sub), junto a "Periodos jugados". Un jugador que solo tiene periodos como cambio también cuenta como que jugó.
- **Import** (match.html): los jugadores de tu equipo que están en el archivo/texto pero NO en tu plantilla antes se descartaban sin avisar (y luego faltaban en Stats). Ahora el mensaje de import los lista: "ATENCIÓN: N jugador(es) ... NO se importaron: nombres".
