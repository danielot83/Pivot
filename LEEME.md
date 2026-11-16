# Paquete 78 — Plan de temporada: tabla "Temáticas trabajadas en los ejercicios"

Sube estos 3 archivos (sustituyen a los que hay). **No hace falta SQL.** Necesita tener ya subido el paquete 70 o posterior (el 77 incluido).

## Qué cambia
- La tabla queda con **solo lo relativo**: cada ejercicio cuenta su tiempo completo para cada temática que trabaja y luego se normaliza a 100 %. Desaparecen las columnas "% del tiempo" y "Minutos".
- Columnas: **Temática | barra | % minutos | Sesiones** (+ avisos de objetivo).
- **Sesiones** sale como "9 de 10" (sesiones en las que aparece la temática, de las totales). Con objetivo: "9 de 10 · objetivo 8".
- **Partido** ya NO cuenta en Competición: es su propia fila. Competición solo recibe lo que se marque en los ejercicios.
- **Pausa** y **Sin definir** son filas normales con su %. Todas las filas suman 100 %.
- Orden por defecto: **% minutos de mayor a menor**. Haz clic en el título de **Temática, % minutos o Sesiones** para ordenar (otro clic invierte el orden; también con teclado).
- Los **objetivos** se miden ahora con ese % minutos (relativo) y con las sesiones trabajadas. Ej.: "Defensa 25 %" compara con el % minutos de la tabla.
- **Calculador de %**: los objetivos de Partido vuelven a sumar en el 100 % (se quitó el aviso de que no sumaban).
- PDF y Excel: columnas Temática, % minutos, Objetivo, Sesiones ("x de N"), Objetivo sesiones; filas ordenadas por % minutos.
- Textos nuevos en EN/FR/ES (i18n-fr.js, i18n-es.js).

## Ojo
- Los números cambian respecto al paquete 77 (Competición ya no incluye partidos y la pausa entra en el reparto). Los objetivos de tiempo ya creados se reevalúan con la nueva base.
- En móvil la tabla oculta la barra y los avisos para que quepa; el detalle sigue en la tarjeta de Objetivos.

## No hecho
- No se ha cambiado el bloque "Temática principal de cada sesión".
- No hay que tocar la base de datos ni el service worker.
