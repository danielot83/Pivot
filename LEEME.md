# Entrega 58 — Stats: PJ cuenta también la asistencia "Presente" a partidos

Sube: `stats.html`, `i18n-fr.js`, `i18n-es.js` (junto con las de la entrega 57 si aún no las subiste: `match.html`). Sin SQL.

- **PJ** = partidos con estadísticas guardadas **o** marcado Presente/Tarde en la asistencia de ese partido. Así un jugador que jugó partidos que solo tienen asistencia (sin stats individuales) ya aparece con sus partidos.
- Las **medias** de puntos/rebotes/etc. solo se dividen entre los partidos que tienen estadísticas (no se diluyen con los que no tienen). Si un jugador no tiene ninguna stat guardada, sale "—".
- Si Max (u otro) sale Ausente en los partidos del 01 nov, es porque el import anterior no lo encontró en la plantilla y marcó Ausente a quien no encontró. Con la entrega 57 (`match.html`), vuelve a importar esos partidos y quedará Presente.
