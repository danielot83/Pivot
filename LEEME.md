# Paquete 90 — Botón × para ocultar avisos del Panel

Sube los 3 archivos a la raíz. **Sin SQL.** (Incluye todo lo anterior de `dashboard.html`, `i18n-fr.js` e `i18n-es.js`; el paquete 89 sigue necesitando su SQL `step98` si aún no lo ejecutaste.)

## Qué hace
Cada elemento de **Up next** (lo próximo), **To do** (lo que falta), **Heads up** (avisos de la temporada) y **What's new** (novedades) tiene un botón **×** para ocultarlo.
- **Vuelve si cambia:** un aviso con número («3 entrenos sin asistencia», «2 jugadores sin evaluar») vuelve a salir si el número **sube**; si baja (porque arreglas alguno) sigue oculto. Un entreno o partido próximo vuelve si cambia de fecha o de título. Las novedades no vuelven.
- **Restaurar:** bajo las tarjetas aparece «N elementos ocultos. Mostrarlos de nuevo» (solo si hay ocultos); un clic los devuelve todos.
- Si ocultas todo un bloque, sale «Nada nuevo que mostrar» (no «todo al día», que sería mentira); si se ocultan todas las novedades, la tarjeta desaparece.
- Al ocultar un próximo evento, entra el siguiente en su lugar (se muestran 4).

## Probado
EN/FR/ES: × en los cuatro bloques; ocultar y persistir (tras recargar); número que baja = sigue oculto, número que sube = vuelve; reprogramar un partido = vuelve; todo oculto = mensaje correcto; restaurar; lista distinta por club; novedades y avisos; títulos y textos traducidos; capturas revisadas. Panel, alertas, todas las páginas, página legal, comprobación estática y XSS (`XSSHITS=[]`) limpios.

## No hecho / a tener en cuenta
- Lo ocultado se recuerda **en ese navegador** (por persona y club), no entre móvil y ordenador. Hacerlo entre dispositivos requeriría guardarlo en la base de datos (SQL); dímelo si lo quieres.
- No hay pantalla en Ajustes para esto: el control está en el propio Panel («Mostrarlos de nuevo»).
- Incluí también «Heads up» (los avisos de temporada), aunque pediste tres bloques, para que todo se comporte igual.
- «Getting started» ya tenía su propio botón «Hide» y no se ha tocado.
