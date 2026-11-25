# Paquete 91 — Prompt de partido: las preguntas sobre jugadores vienen con opciones

Sube los 3 archivos a la raíz. **Sin SQL.** Incluye todo lo de los paquetes 83–90 en estos archivos.

## Qué cambia
Cuando la IA dude de **qué jugador** (quién metió una canasta, de quién es una falta, qué dorsal lleva alguien, a qué jugador corresponde un nombre), ya no hace una pregunta abierta. Te da **los jugadores de ese equipo como opciones con letra**:
- Primero los candidatos entre los que duda, marcados «most likely»; después **todos los demás jugadores del equipo** (los que ya validaste en la etapa 2), y al final «alguien que no está en la lista (dime quién)» y «no lo sé: el acta no lo dice».
- Contestas con **una sola letra**. Si hay varias dudas en el mismo mensaje, cada una trae sus opciones y puedes responder **todas en una línea** (por ejemplo «Q1 A, Q2 C, Q3 B»).
- Lo mismo con los dorsales (te ofrece los jugadores que aún no tienen número y los números leídos en el acta) y con los nombres (los de tu plantilla de PlayPivot si adjuntaste la plantilla Excel; si no, los leídos en la etapa 2).
- Las preguntas que no son de jugadores (prórroga, técnicas, letra ilegible…) también salen como opciones («1 sí / 2 no / 3 no estoy seguro»). Solo te pide texto nuevo si ninguna opción sirve.
- Una vez que confirmas la lista de jugadores (etapa 2), es la lista de opciones de todas las preguntas siguientes.
- El texto de ayuda de «Rellenar con IA» (tarjeta y guía), en EN/FR/ES, lo explica.

## Corregido de paso
Las «reglas de oro» del prompt salían con el 7 antes que el 6 (un arreglo anterior se había perdido). Ahora van en orden 1–7, y un test lo comprueba.

## Probado
Prompt generado sin huecos en EN/FR/ES con la sección nueva y sus frases clave; regresión de partido e importación, todas las páginas, comprobación estática y XSS (`XSSHITS=[]`) limpios.

## No hecho / a tener en cuenta
- **No probado con una IA real**: es una instrucción; que la IA la cumpla depende del chat (si alguna vez pregunta en abierto, dime en qué etapa y lo aprieto).
- La lista de jugadores sale de lo que la IA leyó del acta (y de tu plantilla si la adjuntas). PlayPivot no le envía tu plantilla por sí mismo.
- Con equipos grandes la lista de opciones es larga; por eso los candidatos probables van arriba.
