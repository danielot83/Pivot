# Paquete 86 — Prompt de partido «por partes» y válido para cualquier hoja

Sube `match.html`, `i18n-fr.js` e `i18n-es.js`. **Sin SQL.** Incluye todo lo de los paquetes 83–85.

## Qué cambia en el prompt
**Flexible con el formato, rígido con el contenido.** El prompt ya no habla de «tus hojas»: está escrito para cualquier hoja de partido (FIBA, federación, minibasket, torneo, hecha por un club; con o sin cuadrícula de marcador acumulado; con puntos por jugador; con o sin faltas/períodos/minutos…). Todo lo que explica son *ejemplos*, no suposiciones: si la hoja hace algo distinto, la IA describe lo que ve y te pregunta antes de apoyarse en ello. Y no puede inventar ni un dato.

**Trabaja por etapas; en cada una te enseña lo que ha encontrado, marca cada punto como CLARO o DUDA, te pregunta y ESPERA tu respuesta:**
1. **La hoja y el partido:** tipo de hoja y cómo anota canastas/faltas/participación (tú lo confirmas), equipos y cuál es el tuyo, fecha, lugar, árbitros, períodos, prórroga, resultado final y parciales.
2. **Los jugadores:** «he encontrado estos jugadores con estos números, ¿es correcto?» (tachados, dorsales repetidos o parecidos, dorsal distinto al del roster, entrenador en la lista, titulares).
3. **Los puntos:** canasta a canasta por equipo y período (total acumulado → valor → jugador), con cada duda señalada por sus números («casillas 26 y 28: +2, el dorsal podría ser el 10 o el 11, ¿cuál?») y cada período contra el parcial impreso.
4. **Faltas y participación:** solo lo que la hoja anota; lo que no anota lo dice y te pide confirmar que no falta nada.
5. **Verificación completa:** las 9 comprobaciones con números reales, puntos por jugador, dudas resueltas y estimaciones que queden. Termina con «Reply OK and I will generate the final file».
6. **Entrega final**, solo tras tu OK y pasando la puerta de entrega (que ya existía: nada de archivos con solo nombres y ceros).

Reglas: su primera respuesta SIEMPRE es la etapa 1 (nunca el archivo); no avanza sin tu respuesta; si corriges algo de una etapa anterior, lo actualiza y vuelve a pasar las comprobaciones afectadas; si le dices «OK a todo» o «continúa», puede juntar etapas **sin dudas**, pero nunca una etapa con duda, ni la 5, ni la puerta de entrega. Las preguntas te las hace en el idioma de la app.

También he actualizado el texto de ayuda y la ventana «Qué hace esto» (ES/FR/EN) para explicar que la IA va paso a paso.

## Probado
El prompt se genera sin huecos en EN/FR/ES con las 6 etapas y todas las frases clave; sin restos del esquema anterior; el Excel real Palinzards vs Lynx sigue importando (8+8); rechazo de Excel todo-ceros; regresión de partido/plantilla, todas las páginas, comprobación estática y XSS.

## No hecho / a tener en cuenta
- **No probado con ChatGPT/Claude reales sobre una hoja real** (no puedo desde aquí). La estructura está pensada para que no pueda saltarse pasos, pero habrá que ver cómo se comporta cada IA; si se salta una etapa, dime cuál y se refuerza.
- Son más mensajes por partido (hasta 6). Con «OK a todo» se acorta cuando no hay dudas.
- La parte de «las hojas de Dani» (LRBC, marque courante) ya no se menciona como caso especial: queda como un ejemplo más. Si una liga concreta necesitara una regla propia, se añade como ejemplo.
