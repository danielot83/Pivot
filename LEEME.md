# Entrega 57 — Emparejar jugadores por nombre parecido + Stats muestra qué partidos tienen datos

Sube: `match.html`, `stats.html`, `i18n-fr.js`, `i18n-es.js`. Sin SQL nuevo.

- **Import (match.html):** si un jugador del archivo no coincide exacto con tu plantilla, ahora se compara palabra por palabra (sin tildes, con 1 letra de diferencia, o nombre corto como Max/Maximilien, Nico/Nicolas). Solo se empareja si hay UN único candidato. Si dudas entre dos (dos Lucas) NO adivina: lo avisa con los nombres entre los que dudó. Los emparejados "por parecido" salen en el mensaje para que los revises.
- **Stats (stats.html):** el desplegable de partidos dice cuántos tienen stats de jugadores, y marca "sin stats de jugadores" los que no tienen. Así se ve si un jugador falta porque ese partido no tiene sus stats guardadas.
