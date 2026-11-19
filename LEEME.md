# Paquete 87 — Prompt de partido: doble lectura independiente

Sube solo `match.html`. **Sin SQL.** Incluye todo lo de los paquetes 83–86. (No cambia ningún texto de pantalla, así que no hay archivos de idioma.)

## Qué se ha añadido al prompt (sección nueva «8B. DOUBLE INDEPENDENT READING»)
Todo lo que la IA extrae de la hoja (nombres, dorsales, resultados, cada canasta —valor y anotador—, faltas) se lee **dos veces, de forma independiente**:
1. **Lectura 1:** lectura normal.
2. **Lectura 2:** como si la primera no existiera, sin copiarla y **por un camino distinto** para no repetir el mismo fallo (hacia atrás desde el resultado final en vez de desde la casilla 1; por cuartos en vez de casilla a casilla; por jugador en vez de por canasta; el roster de abajo arriba; las faltas por período).
3. **Comparación** punto por punto: igual = **VALIDADO**; distinto = no validado.
4. **Tercera lectura** solo de lo que difiere, muy ampliada. Si coincide con una de las dos → «2 de 3, confírmalo» (te enseña las dos opciones). Si las tres difieren, o choca con las comprobaciones de totales → **SIN RESOLVER**.
5. **Sin resolver:** te da la lista exacta (equipo, período, casillas o línea, dorsal, lecturas candidatas y qué total depende de ello) **para que lo resuelvas tú a mano con el papel**. No rellena nada con su mejor suposición salvo que tú le digas que estime.
6. Que dos lecturas coincidan **no basta**: solo está plenamente validado si además pasan las comprobaciones de totales (resultado final, parciales, suma de puntos).
7. Debe ser honesta: si no puede hacer una segunda lectura realmente separada, lo dice y marca el dato como «lectura única».
8. Lo presenta como tabla corta (dato | lectura 1 | lectura 2 | lectura 3 | estado), con solo las diferencias en detalle y el resto contado («43 de 45 canastas validadas por dos lecturas iguales»).

Está enganchado a las etapas: el roster (etapa 2) y los puntos (etapa 3) se leen dos veces; la verificación final (etapa 5) incluye el estado de la doble lectura con la lista de lo sin resolver; y la puerta de entrega tiene una comprobación nueva (nada «sin resolver» rellenado en silencio).

## Probado
El prompt se genera sin huecos en EN/FR/ES con la sección y sus frases clave; regresión de partido/importación, todas las páginas, comprobación estática y XSS limpios.

## No hecho / a tener en cuenta
- No probado con una IA real sobre una hoja real. Una IA de chat puede no ser capaz de una segunda lectura verdaderamente independiente de la misma imagen (por eso se le obliga a decirlo y a no fingirlo) y la doble lectura alarga las respuestas. Si ves que se la salta, dime en qué etapa.
