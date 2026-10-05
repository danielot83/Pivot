-- =============================================================================
-- PlayPivot -- step90_exercise_diagram_court_types
-- =============================================================================
-- Dani, voz, 2026-10-04: "hay algunos usuarios que dicen que [los 5
-- diagramas del creador de ejercicios] no está muy bien" -- antes el tipo
-- de pista de cada uno de los 5 diagramas era FIJO, igual para todos los
-- ejercicios (court-diagram.js: court_1/2/3 = media pista, court_4 =
-- vertical, court_5 = pista entera), sin ninguna forma de cambiarlo.
-- exercises.html (mismo zip) añade un desplegable "This diagram's court"
-- en cada uno de los 5 diagramas (half court / vertical / full court),
-- igual que ya existía en Jugadas (play_design.html) para sus pasos --
-- esta columna nueva es donde se guarda esa elección, por ejercicio.
--
-- Una columna nueva, no un campo dentro de `diagram` (ese jsonb asume que
-- CADA valor es un array de elementos -- Object.values(diagram).forEach
-- en exercises.html recorre todos sus valores esperando arrays; meter un
-- objeto extra ahí dentro lo habría roto).
--
-- Seguro de correr: default '{}'::jsonb -- un ejercicio ya guardado antes
-- de esta ronda no tiene esta columna poblada, así que el código (que ya
-- rellena los que falten con el mismo reparto de siempre -- 3 media
-- pista, 1 vertical, 1 completa) lo sigue mostrando exactamente igual que
-- hasta ahora, sin ningún cambio visible salvo que el desplegable
-- aparece. No hace falta backfill ni tocar filas existentes.
-- =============================================================================

alter table public.exercises
  add column if not exists court_types jsonb not null default '{}'::jsonb;

comment on column public.exercises.court_types is
  'Tipo de pista elegido para cada uno de los 5 diagramas (court_1..court_5):
   "half" | "vertical" | "full". Clave ausente o columna vacía ({}) =
   usar el reparto por defecto de siempre (half/half/half/vertical/full,
   ver COURT_TYPES en court-diagram.js) -- así los ejercicios guardados
   antes de esta columna (2026-10-04) no cambian de aspecto.';

-- Las funciones visible_exercises()/visible_plays()/etc (step87) hacen
-- "select * from exercises" -- devuelven esta columna nueva sin tocarlas
-- (returns setof public.exercises recoge cualquier columna nueva sola).
-- No hace falta ningún cambio de policy: ya se guarda/lee con las mismas
-- reglas que el resto de la fila de exercises.
