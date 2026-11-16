# Paquete 77 — «Partido» como temática de objetivo (3 archivos, sin carpetas)

Sube a la raíz del repositorio, reemplazando: `season.html`, `i18n-fr.js`, `i18n-es.js`. Sin SQL nuevo. Requisito: tener subido el 76 (o el 70 y posteriores).

En «Season plan»:
- Al **añadir/editar un objetivo** de «% del tiempo» o «mínimo de sesiones», en el desplegable de temática ahora aparece también **Partido** (el tiempo y las sesiones salen de los bloques de partido de los entrenos).
- Ese tiempo cuenta **para Partido y también para Competición** (los bloques de partido siguen sumando a Competición).
- En la tabla de temáticas hay una fila **«Partido (cuenta también en Competición)»**, con su objetivo y lo que falta. Esa fila NO se suma a los totales (si no, el partido contaría dos veces).
- En la **calculadora de %**, los objetivos de Partido no entran en la suma de 100 % (y avisa de ello).
- Va también en el informe PDF/Excel.
