# Paquete 80 — Plan de temporada: objetivos mensuales

Sube `season.html`, `i18n-fr.js` e `i18n-es.js` (sustituyen a los actuales). Necesita el paquete 79 ya subido.

## SQL: SÍ (uno, pequeño)
Ejecuta **`step96_season_objectives_monthly.sql`** en el SQL Editor de Supabase (una columna `month`, un índice y una restricción; seguro de repetir, no toca datos). Si no lo ejecutas, la página funciona igual y el selector de mes sirve para ver cifras, pero avisa de que no se pueden guardar objetivos mensuales.

## Qué hace
- Encima de las cifras hay un selector: **Toda la temporada · sep · oct … jun**. Al elegir un mes, **todas las tarjetas** (resumen, objetivos, tema principal, temáticas, qué mirar, informe PDF/Excel) muestran solo ese mes.
- Un objetivo de temporada se **hereda en todos los meses** (etiqueta gris "Temporada").
- **Fijar para este mes**: crea un valor propio para ese mes (misma clase y temática) que sustituye al de temporada solo ese mes. Ej.: Tiro 20 % en la temporada, 10 % en octubre, 15 % en noviembre. **Usar el de la temporada** lo borra.
- **Añadir objetivo para este mes**: objetivo que solo existe ese mes.
- Se evalúa con las cifras de ese mes; el calculador de % suma los objetivos de tiempo del mes.
- Permisos: igual que antes. Los mensuales los gestiona el administrador del equipo (también la plataforma). Los globales siguen fijándose solo a nivel de temporada.

## Ojo
- Los objetivos libres (se marcan a mano) de temporada no se heredan en los meses.
- Al cambiar de equipo o de temporada el selector vuelve a "Toda la temporada".
- El informe de un mes lleva el mes en el título y en el nombre del archivo.

## No hecho
- Vista de matriz objetivo × mes ni reparto automático por meses.
- Objetivos globales mensuales fijados por la plataforma.
- Las otras ideas de Samuel (feedback con preguntas, cuaderno, modo debutante): están como diseño en el documento del proyecto "playpivot-plan-feedback-samuel-2026-11-17", pendiente de que lo revises con él.
