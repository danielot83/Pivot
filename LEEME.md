# PlayPivot — entrega 67 (paquete único, sustituye a la 62–66)

Un solo zip con TODO lo de la revisión global: puedes subirlo entero encima de lo que tienes. **No hay SQL que ejecutar.**
Los textos están en inglés / francés / español (selector EN/FR/ES). PDF y Excel siguen el idioma de la pantalla.

## Qué hay nuevo respecto a la entrega 65
- **Estadísticas**: ahora con pestañas *Resumen / Jugadores / Rivales* (recuerda la última que miraste).
- **Panel**: tarjeta «Primeros pasos» (5 pasos, se puede ocultar) y «Novedades» desplegable.
- **Plantilla**: botón **👤 Perfil** en cada jugador (datos, asistencia %, estadísticas de partidos, última evaluación).
- **Plantilla / Asistencia / Día de partido**: los botones de importar/exportar agrupados en menús «⇅ Import / Export ▾» (en Día de partido: «⬇ Export ▾» y «⬆ Import ▾»).
- **Día de partido**: **▦ Periods grid** (cuadrícula X / punto por periodo) y **⏱ Live counter** completo: +1 / +2 / +3 / rebote / asistencia / falta con «Deshacer», **periodo actual (◀ ▶)**, **reloj** con inicio/pausa y duración del periodo configurable, jugadores **en pista (⇄)** con aviso si hay más de 5, y **minutos calculados solos** mientras corre el reloj (se suman a la columna Minutes al pulsar Listo). Guarda un borrador en el navegador: si cierras sin querer, al reabrir te ofrece recuperarlo. Las estadísticas definitivas se guardan con «Save match details» como siempre.
- **Entrenamientos**: **⧉ Duplicate session** (copia sin guardar con la fecha de hoy) y **🏟 Court mode** (pantalla completa con cronómetro, puntos clave, variantes y diagrama).
- **Creador de ejercicios**: **borrador automático** — si cierras sin guardar, te ofrece Restaurar / Descartar. Y las secciones «Exercise data» y «Court diagram» ahora se pliegan, con botones **↓ Go to court diagram / ↑ Back to exercise data** para saltar de una a otra.
- **Evaluación de jugadores**: **gráfico de araña** (última evaluación frente a la anterior, con diferencias por sector).
- **Biblioteca**: chips rápidos (Favoritos / Creados por mí / Todo el club / Otros clubes / Sin usar), orden **A–Z / Más usados / Más nuevos**, y el resto de filtros recogidos en «More filters».
- **Diseño de jugadas**: «Play details» pasa debajo de la pista (la pista queda mucho más arriba), la vista salta a las herramientas al abrir/crear una jugada, y botones de 44 px en pantallas táctiles.
- **Modo sin conexión** (`sw.js` + `sw-register.js`): la app abre sin internet con las páginas ya visitadas; aviso «You're offline». Red primero, así siempre ves la versión nueva si hay conexión.

## Qué incluye (todo lo de la 62–65 ya está dentro)
Panel «Lo próximo», Pasar lista, miniaturas de la biblioteca, pestañas de Ajustes, menú lateral agrupado, arreglos móviles, `manifest.json`, `hero-court.jpg`.

## Lo que NO se hizo (a propósito)
- **Sin conexión** solo abre las pantallas; los datos (Supabase) **no se guardan ni se leen** sin internet. No hay cola de cambios pendientes: guardar datos con la red caída podría duplicar o pisar cambios de otra persona, y eso exige decidir reglas de conflicto contigo antes. Por ahora la barra «You're offline» avisa de que no se guarda.
- El contador en directo no registra tiros fallados ni el marcador del rival (solo tu equipo).

## Nota
La primera vez que abras la app tras subirla, el navegador instala el modo sin conexión (hace falta HTTPS; en tu dominio ya lo es). Si algo se ve «antiguo», recarga con Ctrl/Cmd+Shift+R una vez.
