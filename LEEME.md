# Paquete 83 — Nuevo prompt de «Rellenar con IA» (partido)

Sube `match.html`, `i18n-fr.js` e `i18n-es.js`. **Sin SQL.** El motor de import no cambia: la IA sigue devolviendo la misma tabla de siempre.

## Qué cambia
El prompt se ha reescrito entero (≈19.000 caracteres, 15 secciones) para que dé el mismo resultado cada vez y no invente. Ahora funciona en **dos fases**:

1. **Fase 1 (en el chat con la IA):** lee la hoja por zonas, lee cada marcador acumulado DOS veces de forma independiente, escribe el «libro de canastas» (total acumulado → valor → dorsal), pasa 9 verificaciones y, si algo no queda claro, **te pregunta** (todas las preguntas en un solo mensaje) y espera.
2. **Fase 2:** solo cuando todo cuadra, o tú has respondido, da la respuesta final en el formato de siempre.

Verificaciones obligatorias: última casilla tachada = resultado final impreso; suma de parciales = final; parciales por período; suma de «Puntos totales» por equipo = resultado; `1 pt + 2×(2 pts) + 3×(3 pts) = Puntos totales` en cada fila; faltas ≤ 5; dorsales sin repetir; períodos jugados; jugadores que jugaron.

Reglas que recoge (tus errores reales): nunca dejar puntos sin asignar (PlayPivot suma «Puntos totales» tal cual); 1/2/3 pts nunca vacíos para quien anotó y coherentes con el total; nombres limpios (sin paréntesis, comillas ni «?»; las dudas van en NOTES); no adivinar a quién va una canasta dudosa (pregunta «¿#10 o #11?»); mi equipo siempre «ÉQUIPE A» aunque en la hoja sea B (se voltea todo, también el marcador «mío - rival»); fila en blanco = no jugó, un 0 explícito = jugó, faltas sin canastas = 0 puntos.

Preguntas que hace siempre ante la duda: prórroga (¿hay 5.º período?), técnicas/expulsiones, dorsal distinto al habitual, dos dorsales iguales o parecidos, nombres tachados o corregidos, canasta atribuible a dos jugadores, letra claramente peor en un lado (¿lo intento o lo marco estimado?), jugador sin marcas que quizá jugó.

Si tras preguntarte sigue habiendo duda (o dices «no lo sé»): reparte la canasta al jugador más probable, rehace su 1/2/3 pts para que cuadre y lo marca como **ESTIMADO** en la línea NOTES (con jugador, totales y alternativa). Nunca en silencio y nunca cambiando el resultado de equipo.

También: el prompt le habla a la IA en el idioma de la app (ES/FR/EN) para las preguntas; la cabecera final no cambia. La caja del prompt es más alta, y el texto de ayuda y la ventana «Qué hace esto» avisan de que la IA puede hacer preguntas antes de dar la tabla (traducido FR/ES).

## Probado
Prompt generado sin huecos en EN/FR/ES con la cabecera real de columnas; una respuesta de ejemplo en el formato nuevo (con NOTES de varias líneas, con `|` dentro) pasa por el import real y da los puntos esperados sin filas fantasma; regresión de match/plantilla/periodos, todas las páginas, comprobación estática y XSS limpios.

## No hecho / a tener en cuenta
- **No lo he probado con una IA real leyendo una hoja real** (no tengo la foto de esta hoja ni una IA externa aquí). Se ha probado que el prompt se genera bien y que la respuesta en ese formato se importa. La fiabilidad real hay que comprobarla con tu hoja: si vuelve a fallar, dime exactamente qué falló y ajusto la sección correspondiente.
- El texto que pegaste estaba cortado en el apartado 6 («Ampliar individual…»); el resto (lectura, verificaciones, preguntas, formato) lo he construido yo con tus reglas y tus errores.
- Reglas en conflicto que he decidido: tu borrador decía «nunca redistribuyas» y tus notas «reparte el 100 % de los puntos». Lo he resuelto así: primero leer, luego preguntar, y solo si no hay respuesta, estimar declarándolo. Si prefieres otra cosa, se cambia en la sección 13.
- El import NO limpia nombres raros: un rival con nombre `Bob "Bobby" R` entra tal cual. Solo lo evita el prompt. Se puede hacer que el import limpie paréntesis y comillas si quieres.
