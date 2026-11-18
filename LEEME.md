# Paquete 84 — Importar: el nombre manda sobre el dorsal + aviso verde cerrable

Sube `match.html`, `i18n-fr.js` e `i18n-es.js`. **Sin SQL.** (Incluye el prompt nuevo del paquete 83; si ya subiste el 83, este lo sustituye.)

## 1) Nombres antes que dorsales (el conflicto de tu Excel Palinzards vs Lynx)
**Causa:** el import emparejaba así: nombre exacto → **dorsal** → nombre parecido. Con tu hoja (que trae solo nombres de pila y dorsales que no coinciden con el roster) pasaba esto: «Patrick» (15 en la hoja) caía en Antoine Rossier (15 en el roster), el verdadero Antoine (27) se quedaba fuera con el aviso de jugador sin emparejar, y por eso salían «7 jugadores» en vez de 8. Pete solo entró bien de casualidad (el 21).

**Ahora:** nombre exacto → **nombre parecido** (Nico/Nicolas, Fabian/Fabien, Pete/Peter…) → dorsal solo como último recurso y solo con jugadores que sigan libres. Con tu archivo real entran los 8: Patrick→Patrick Rossier, Antoine→Antoine Rossier, Pete→Peter Mattai, Nicolas→Nico Martin, Amadou→Amadou Diop (23), Fabian→Fabien Pires (18), Natale, Daniel; y los 8 de Lynx. Ninguno por dorsal.
- El aviso «emparejados por nombre parecido» ahora solo lista los casos donde el nombre cambió (Nicolas→Nico, Pete→Peter, Fabian→Fabien), no los triviales (solo nombre de pila).
- Si alguna fila solo se emparejara por dorsal, sale un aviso aparte para revisarla («Emparejados solo por dorsal, el nombre no coincidía…»).
- Mismo orden aplicado a «Importar desde una foto».
- Los dorsales de la hoja ya no se escriben en tu roster (nunca se escribían); si quieres corregir los dorsales del roster (Amadou 00, Fabian 10…), se hace en Plantilla.

## 2) El aviso verde no se podía cerrar
Antes el aviso fijo solo se reemplazaba por otro y, si era largo, se salía de la pantalla. Ahora: botón **×** (y tecla Esc), scroll interno si es muy largo, los avisos cortos de éxito se cierran solos a los 8 s; los largos (con avisos) y los errores se quedan hasta que los cierres. Vale para todos los avisos de la pantalla de partido.

## Probado
Tu Excel real (`match_Palinzards_vs_Lynx_20261117_v2.xlsx`) contra un roster como el de tu captura: 8 propios, 8 rivales, 0 sin emparejar, 0 por dorsal, puntos y faltas en el jugador correcto; caso del dorsal ya ocupado; botón ×/Esc/auto-cierre y que un aviso muy largo cabe en pantalla (capturas); EN/FR/ES; regresión de partido/plantilla/prompt, todas las páginas, comprobación estática y XSS.

## No hecho
- No he tocado tu Excel (las notas dentro, «Pete» como nombre, etc.). Con este cambio entra tal cual.
- Los avisos de las demás pantallas (Plantilla, Ajustes…) siguen como estaban; solo he cambiado el de Día de partido, que es donde lo viste.
- Si hubiera dos jugadores con el mismo nombre de pila en el roster y la hoja solo trae el nombre de pila, no adivina: queda como «sin emparejar» y te dice entre quiénes dudó (como antes).
