# Paquete 81 — Plan de temporada: matriz "Plan por meses"

Sube `season.html`, `i18n-fr.js` e `i18n-es.js` (sustituyen a los actuales). Necesita el paquete 80 subido y su SQL `step96` ejecutado. **Este paquete no trae SQL nuevo.**

## Qué hay de nuevo
Tarjeta nueva **Plan por meses** (debajo de Objetivos): una fila por objetivo de temporada y una columna por mes (sep–jun).
- Cifras **grises** = heredadas de la temporada. Cifras en **negrita** = fijadas para ese mes.
- Debajo de cada cifra, en pequeño y con color (verde / ámbar / rojo, mismo criterio que Objetivos), **lo conseguido ese mes** (solo en meses con datos).
- **Clic en una casilla** para fijar su valor: Enter o ✓ guarda, Esc o ✕ cancela, ↺ vuelve al valor de la temporada. Si ya había uno propio lo actualiza; si no, crea uno que sustituye al de temporada solo ese mes.
- Última fila: **suma de los objetivos de tiempo de cada mes** (verde si da 100 %).
- Los objetivos que solo existen en algún mes salen como fila con la etiqueta "Solo meses".
- Quien no puede editar (entrenador sin permiso, o sin el SQL step96) la ve en solo lectura.
- El informe PDF de un mes lleva el mes en el título y en el nombre del archivo (ya estaba en el 80; ahora con prueba específica).

## Comprobado
- Pruebas automáticas en EN/FR/ES (matriz, meses, herencia, permisos, informe de un mes), prueba de XSS y revisión de todas las páginas.
- El SQL `step96` se ejecutó contra un PostgreSQL 16 real: se puede repetir sin problema; rechaza meses mal formados, meses en objetivos globales y duplicados (mismo equipo, mes, clase y temática).

## No hecho
- Reparto automático por meses (rampa de un valor a otro o por fases).
- La matriz no entra todavía en el PDF/Excel del informe.
- Objetivos globales mensuales fijados por la plataforma.
- No he tocado feedback, cuaderno ni modo debutante: siguen como diseño en el documento del proyecto.
