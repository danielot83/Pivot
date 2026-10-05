-- =============================================================================
-- PlayPivot -- step91_training_exercises_freetext
-- =============================================================================
-- Dani (voz, ronda 42): un tercer botón en Training builder, "al lado de
-- pause y match" -- un bloque de texto libre en el plan de la sesión, para
-- cualquier cosa que no sea un ejercicio de la librería ni una pausa/
-- partido ("Team talk", "Video analysis", "Water break"...). Mismo patrón
-- que is_match/match_format (step71): exercise_id se guarda a null, un
-- flag booleano marca el tipo de fila.
--
-- El texto en sí se guarda en `notes` -- columna que ya existe desde el
-- esquema original (pivot_cloud_step13_trainings.sql) pero que la app
-- nunca ha usado hasta ahora. No hace falta añadirla.
-- =============================================================================

alter table public.training_exercises add column if not exists is_freetext boolean not null default false;

comment on column public.training_exercises.is_freetext is
  'true = esta fila del plan de la sesión es una nota de texto libre (p.ej. "Team talk", "Water break"), no un ejercicio de la librería ni una pausa/partido -- exercise_id se guarda a null, igual que is_pause/is_match.';
comment on column public.training_exercises.notes is
  'Texto libre de la fila -- solo tiene contenido cuando is_freetext es true (el coach lo escribe directamente en la fila del plan). Columna original del esquema (step13), sin uso hasta ronda 42.';

-- -----------------------------------------------------------------------
-- replace_training_exercises (step82) hace el DELETE+INSERT del plan
-- completo en una sola función -- su lista de columnas es fija, así que
-- hay que recrearla para que acepte is_freetext/notes. Mismo cuerpo que
-- step82, security invoker (sin cambios de permisos), solo se añaden las
-- dos columnas nuevas.
-- -----------------------------------------------------------------------
create or replace function public.replace_training_exercises(p_training_id uuid, p_rows jsonb)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  delete from public.training_exercises where training_id = p_training_id;

  insert into public.training_exercises
    (training_id, exercise_id, order_index, duration_minutes, key_points, session_variants, is_pause, is_match, match_format, is_freetext, notes)
  select
    p_training_id,
    (r->>'exercise_id')::uuid,
    coalesce((r->>'order_index')::int, 0),
    coalesce((r->>'duration_minutes')::int, 10),
    coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(r->'key_points', '[]'::jsonb)) x), '{}'),
    r->>'session_variants',
    coalesce((r->>'is_pause')::boolean, false),
    coalesce((r->>'is_match')::boolean, false),
    r->>'match_format',
    coalesce((r->>'is_freetext')::boolean, false),
    r->>'notes'
  from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) as r;
end;
$$;

grant execute on function public.replace_training_exercises(uuid, jsonb) to authenticated;

-- =============================================================================
-- VERIFICAR DESPUÉS DE CORRER ESTO:
--   select proname, prosecdef from pg_proc where proname = 'replace_training_exercises';
--   -- prosecdef debe salir "f" (false) -- security invoker, no definer.
--
--   Y en la app: Training builder -> "📝 Add free text" -> escribir algo,
--   p.ej. "Team talk" -> guardar -> reabrir la sesión -> debe seguir ahí,
--   en su sitio en el plan, con el texto exacto.
-- =============================================================================
