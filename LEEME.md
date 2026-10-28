# Idiomas EN / FR / ES (primera fase: módulos piloto)

> **Antes de copiar nada: guarda tu zip actual** (como dijiste). Si algo no
> te convence, vuelves a ese estado y listo. Todo lo nuevo se puede quitar
> borrando la línea `<script src="./i18n.js?v=1">` de cada página.

## Qué verás
- Arriba a la derecha, **EN · FR · ES** (texto, sin banderas). En móvil
  aparece junto al logo. Al pulsar, la página se recarga en ese idioma y
  se recuerda en ese navegador (por defecto, el idioma del navegador).
- **Una sola base de datos.** Lo que creas (nombres de jugadores, equipos,
  ejercicios, notas…) no se traduce ni se duplica. Los valores guardados
  (estados de asistencia, categorías, géneros…) siguen en inglés en la BD;
  solo cambia cómo se ven.
- Las **fechas** salen en el idioma elegido (p. ej. "10 sept." / "10 sept").
- **PDF y Excel** salen en el idioma que tengas en pantalla (títulos,
  columnas, leyendas, "Generado…", nombre de archivo y hoja).
- **Importar Excel**: reconoce cabeceras y valores en EN/FR/ES (Nombre,
  Prénom, Dorsal, Numéro, Año de nacimiento, Poste, Cuota, Cotisation,
  Sí/Oui/Yes…). Los Excel que exportas tú se pueden reimportar.
- Páginas legales y login/landing: siguen en inglés por ahora.

## Qué está traducido
| Módulo | Estado |
|---|---|
| Menú lateral, barra superior, mensajes, selector de club/equipo | Todas las páginas |
| **Dashboard**, **Roster**, **Attendance**, **Match stats** | Completo (pantalla, mensajes, PDF/Excel, importación) |
| Training, Match day, Exercises, Library, Play design, Play library, Assessment, Compare, Settings, Help | Solo lo común (menú, botones habituales, fechas). El contenido propio aún sale en inglés: es la **siguiente fase** |

## Cómo funciona (por si lo tocas)
- El código sigue en inglés. `i18n.js` traduce al vuelo con los diccionarios
  `i18n-fr.js` / `i18n-es.js` (**generados**, no editar a mano).
- Los textos viven en `i18n_src/` (`EN ||| FR ||| ES` por línea o
  diccionarios `.py`). Para añadir o corregir: edita ahí y ejecuta
  `python3 tools/build_i18n.py` (avisa de huecos o `{placeholders}` mal).
  Si cambias diccionarios, sube el número en `i18n.js?v=1` de `i18n.js`
  (constante `VERSION`) para saltarse la caché.
- Para depurar: añade `?i18n_debug=1` a la URL y mira la consola (lista los
  textos sin traducir).
- Textos compuestos en código (PDF, mensajes, plurales) usan `_t("English {x}", {x})`.

## Terminología elegida (revísala con hablantes nativos)
Roster = Effectif / Plantilla · Attendance = Présences / Asistencia · Match
day = Jour de match / Día de partido · Play design = Création de systèmes /
Diseño de jugadas · Training builder = Préparation des séances /
Constructor de entrenamientos · Posiciones FR: Meneur, Arrière, Ailier,
Ailier fort, Pivot · Estados asistencia: FR P/A/E/R (Excusé, Retard), ES
P/A/J/T (Justificado, Tarde) · Tiros: 1PM = LF / TL, 2PM = "2 pts" / T2,
3PM = "3 pts" / T3 · MJ/PJ = partidos jugados, MT/PT = titular · Récord
V/D/N (FR), G/P/E (ES).

## Comprobado
- Chromium real con Supabase simulado: Dashboard, Roster, Attendance y Stats
  en EN, FR y ES (tablas, tarjetas, calendario, menús, ayudas, mensajes,
  PDF/Excel, importación con cabeceras FR/ES).
- **El inglés queda idéntico** a la versión anterior (comparado pantalla a
  pantalla; única diferencia: "3 matchs" → "3 matches" en un aviso de Stats).
- 14 páginas cargan sin errores en los 3 idiomas; HTML equilibrado, sin IDs
  duplicados; sintaxis JS correcta; 677 entradas en el diccionario.
- Cambio aparte: en Roster, "Licencia" y "Activo" al importar aceptan
  sí/no/oui/non/yes/no/1/0.

## Limitaciones conocidas
- Al cambiar de idioma la página se recarga (se pierde lo no guardado).
- Nombres de usuario, equipos y textos libres se muestran tal cual.
- Los módulos de la fase 2 mezclan idiomas hasta que se traduzcan.
- Importar Attendance con una sola columna de nombre completo ("Ana Pérez
  García", sin coma): ahora la primera palabra es el nombre y el resto el
  apellido, igual que ya hacía Roster (antes Attendance lo hacía al revés).
  Con coma ("Pérez García, Ana") sigue siendo apellido, nombre.

## Entregado
`i18n.js`, `i18n-fr.js`, `i18n-es.js`, `team-tree.js`, las 14 páginas con
`i18n.js` (assessment, attendance, compare, dashboard, exercises, help,
library, match, play_design, play_library, roster, settings, stats,
training), `i18n_src/` y `tools/build_i18n.py`. Copia todo a la raíz del
proyecto (menos `i18n_src/` y `tools/`, que son solo fuentes).
