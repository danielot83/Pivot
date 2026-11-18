# Paquete 85 — Prompt con «puerta de entrega» + rechazo de Excel vacío

Sube `match.html`, `i18n-fr.js` e `i18n-es.js`. **Sin SQL.** Incluye todo lo de los paquetes 83 y 84 (si ya los subiste, este los sustituye).

## Qué pasó
Con ChatGPT, el prompt dio un Excel con solo nombres y todo a cero, sin preguntas: ni leyó la hoja ni lo dijo. Y PlayPivot lo aceptó como si todos hubieran jugado con 0.

## 1) Prompt (sección nueva «DELIVERY GATE» y reglas más duras)
- **La primera respuesta de la IA es SIEMPRE su lectura (Fase 1), nunca el archivo.** Tiene que mostrar con números reales: equipos y cuál es el tuyo, resultado final y parciales, el libro de canastas de cada equipo, puntos por jugador y el resultado de las verificaciones V1–V9. Termina con «Reply OK and I will generate the final file» y espera. Si entrega directamente, el trabajo queda rechazado. (Así ves enseguida si ha leído la hoja: si no hay números, no ha leído nada.)
- **Regla de oro nueva:** un entregable con solo nombres y ceros (o en blanco) es un FALLO, nunca un resultado aceptable. El 0 solo vale para quien jugó y no anotó; nunca como relleno de «no pude leerlo». Si no puede sacar números reales, lo dice y no entrega nada.
- **Debe poder VER la hoja:** si la foto/PDF no carga o solo tiene la plantilla, para y lo avisa; prohibido rellenar una plantilla a partir de la propia plantilla.
- **Puerta de entrega G1–G8 antes de entregar:** al menos un jugador por equipo con puntos > 0; «Puntos totales» de cada equipo = resultado final; no es la plantilla con nombres; 1/2/3 pts coherentes; tu equipo en ÉQUIPE A; nombres limpios; dudas declaradas; ya hubo Fase 1 y tu OK. Si falla G1, G2 o G3 la respuesta correcta es «No he podido leer esta hoja con fiabilidad» + qué necesita (foto más nítida…).
- **Excel adjunto:** tras guardar el .xlsx debe REABRIRLO y leer las celdas del propio archivo para pasar la puerta, y el mensaje del chat debe llevar el informe V1–V9 (sin informe, el archivo no vale).

## 2) La app rechaza un Excel/respuesta sin datos reales
Si en todo el archivo (tu equipo y el rival) ninguna cifra es mayor que 0 —ni puntos, faltas, rebotes, minutos, tiros ni titular—, el import ya **no guarda nada** y avisa (ES/FR/EN): «Todas las cifras están a 0 o vacías… la IA probablemente no leyó el acta… no se ha importado nada». Con al menos un dato real, importa como siempre. Un partido real nunca queda todo en 0, pero si algún día quisieras importar así a propósito, dímelo y se ajusta.

## Probado
Prompt generado sin huecos en EN/FR/ES con las frases nuevas; Excel todo-ceros → rechazado (mensaje traducido), con un solo dato real → pasa; tu Excel real Palinzards vs Lynx sigue entrando (8+8); regresión de partido/plantilla, todas las páginas, comprobación estática y XSS.

## No hecho / a tener en cuenta
- **No he podido probar con ChatGPT real**: no es posible desde aquí. El prompt es más estricto, pero ChatGPT puede seguir saltándose pasos. Si lo hace, pega aquí lo que respondió y se refuerza el punto exacto.
- La parada obligatoria («Reply OK») añade un mensaje más por partido. Es lo que da la garantía de que ha leído; si prefieres que solo pare cuando tenga dudas, se cambia en una línea (y perderías esa garantía).
