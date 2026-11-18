# Paquete 82 — Entreno: feedback cuantificable (fase B)

Sube `training.html`, `i18n-fr.js` e `i18n-es.js` (sustituyen a los actuales). `i18n-fr.js` e `i18n-es.js` ya incluyen lo de los paquetes anteriores (81 y antes), así que no hace falta nada más.

## SQL: SÍ (uno)
Ejecuta **`step97_training_feedback.sql`** en el SQL Editor de Supabase: crea 2 tablas nuevas (`training_feedback`, `training_exercise_feedback`) y la función `replace_training_feedback`. Seguro de repetir; no toca ninguna tabla existente. Sin él, la página funciona igual (estrellas, comentarios e ideas) y avisa de que falta ejecutarlo.

## Qué hay de nuevo (dentro de "Post-session feedback")
Las estrellas, comentarios e ideas de siempre **no cambian**. Se añade, todo opcional y de un toque:
- **Preguntas rápidas:** ¿respetaste los tiempos? · ¿objetivo principal cumplido? · ¿entendieron las explicaciones a la primera? · ¿viste mejora? · intensidad · energía del grupo (1–5) · duración real (minutos) · incidencias (material, pista, pocos jugadores, empezó tarde, lesiones, clima). Pulsar otra vez la misma respuesta la quita.
- **¿Cómo fue cada ejercicio?:** para cada ejercicio de la biblioteca del plan: **Funcionó / Ajustar / Descartar**. En Ajustar/Descartar salen motivos (demasiado fácil/difícil, explicación larga, poco tiempo, mucho tiempo en filas, faltaba material, no los enganchó, nivel del grupo) y una nota corta.
- Pausas, partidos y bloques de texto libre no se valoran.
- Se guarda con "Save session". Al reabrir el entreno, el bloque se abre solo con lo guardado.
- **Duplicar sesión** y **sesión nueva** empiezan en blanco.

## Cosas que conviene saber
- La valoración va ligada al **ejercicio de la biblioteca**, no a su posición: si reordenas o quitas ejercicios del plan, cada valoración sigue en su ejercicio (esto es la base del "cuaderno" de la fase C).
- **Privacidad:** el cuestionario y las valoraciones **solo los ve tu club** (o tú si la sesión es privada) y la plataforma. Aunque compartas la sesión con la asociación o la comunidad, el feedback NO se comparte.
- Pueden escribir/borrar admin, coach y assistant. El viewer los ve pero no los puede guardar.
- Si el feedback falla al guardar, la sesión ya está guardada y se avisa con el motivo.

## Comprobado
- SQL ejecutado contra un PostgreSQL 16 real (14 casos: permisos por rol, privacidad entre clubes y sesiones privadas, validaciones, todo-o-nada, borrado en cascada y ejercicio borrado de la biblioteca).
- Pruebas automáticas en EN/FR/ES (rellenar, guardar, reabrir, plan reordenado, ejercicio repetido, vaciar, fallo de guardado, sin step97, duplicar, solo lectura), prueba de XSS, páginas, traducciones y capturas en escritorio y móvil.

## No hecho
- Las respuestas del cuestionario no salen en el PDF de la sesión.
- No se suman todavía en el Plan de temporada (p. ej. "% de sesiones con tiempos respetados").
- Los avisos hacia el siguiente entreno y el cuaderno por ejercicio son la fase C (usarán estos datos).
