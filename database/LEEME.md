# Entrega 53 — nuevo slogan de la landing

Solo cambian `i18n-fr.js` e `i18n-es.js` (súbelos a GitHub; `i18n_src/` y `tools/` no).

- ES: «Entrena mejor. Dirige con ventaja.»  · FR: «Préparez mieux. Coachez mieux.»
- Cambia igual en el titular de la landing, en el título de la pestaña y en la frase de la pantalla de login.
- El resto de la entrega 52 (landing reescrita, selector en móvil) sigue igual.

---
# (Entrega 52, para referencia)
`i18n_src/` y `tools/`, que NO se suben a GitHub). Va encima de la entrega 51.

## Qué hice
- **Reescritura, no traducción literal**, de toda la landing: titulares, párrafos,
  los 4 pasos, las 3 tarjetas (Club / Equipo / Asociación), el pie y las 8
  tarjetas de módulos. Ejemplos: «Entrena con cabeza. Dirige mejor.»,
  «Una sola app para todo lo que ocurre entre pitido y pitido.»,
  «Entraînez malin. Coachez mieux.», «Une seule appli pour tout ce qui se joue
  entre deux coups de sifflet.»
- **Saltos de línea cuidados** (lo de «temporada» que señalaste): ahora el titular
  queda «Todo lo que necesita una temporada, / en una sola herramienta.»
  · las palabras cortas (una, de, en, à, le…) se pegan a la siguiente y nunca
  quedan colgando al final de una línea;
  · en francés: espacio de no separación antes de « : ; ? ! » y dentro de «…»;
  · sin palabra suelta en la última línea de titulares y tarjetas;
  · los titulares se equilibran (`text-wrap: balance`) y los párrafos usan
  `text-wrap: pretty`, solo en FR/ES (el inglés queda igual).
- **Arreglo móvil:** el selector EN·FR·ES tapaba el botón «Log in» del
  encabezado en pantallas estrechas; ahora va abajo a la derecha en móvil.
- «What it is / What's inside» → FR «En bref / Au programme», ES «Qué es PlayPivot /
  Qué hay dentro»; eslogan de login («Train smarter. Coach better.») cambia igual.

## Qué cambia fuera de la landing (mismo texto compartido)
- Las descripciones de las 8 tarjetas de módulos también salen en el panel
  (Dashboard) y en las páginas de módulo, con la nueva redacción.
- El eslogan de la pantalla de login.
Los nombres de módulos y todo el resto de la app NO se tocaron.

## Cómo lo comprobé
Capturas en Chromium a 1280, 820 y 390 px en FR y ES (sin desbordes
horizontales, 0 textos sin traducir); inglés idéntico al original; etiquetas y
sintaxis OK; dashboard/login/páginas sin errores.

## Para repetir/ajustar
Todo el texto está en `tools/landing_copy.py` (tabla EN → FR/ES). Edítalo y
corre `python3 tools/landing_copy.py .` y luego `python3 tools/build_i18n.py <carpeta>`.
