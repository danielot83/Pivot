-- =============================================================================
-- PlayPivot -- step82_atomic_training_exercises_replace
-- =============================================================================
-- Test funcional ronda 30 (hallazgo ALTO nº5): guardar el plan de
-- ejercicios de una sesión (training.html, saveTraining()) hacía DOS
-- llamadas de red separadas -- primero
-- `training_exercises.delete().eq("training_id", trainingId)`, después
-- `training_exercises.insert(rows)` -- sin ninguna transacción que las
-- uniera. Si la segunda fallaba (red, un exercise_id inválido, lo que
-- sea), la primera YA se había confirmado en la base de datos: el plan
-- de esa sesión quedaba vacío de verdad, aunque `sessionExercises` (en
-- memoria, en el navegador) siguiera mostrando el plan completo en
-- pantalla -- quien lo estaba usando no tenía forma de notarlo hasta
-- recargar la página, y para entonces ya era tarde.
--
-- Arreglo: una función `replace_training_exercises(training_id, rows)`
-- que hace el DELETE y el INSERT dentro de una sola llamada -- en
-- Postgres, una función normal (PL/pgSQL) se ejecuta como una única
-- transacción implícita: si el INSERT falla a mitad de camino, TODO se
-- deshace, incluido el DELETE de más arriba -- así que un fallo deja el
-- plan viejo intacto, nunca a medias.
--
-- Importante: esta función es `security invoker` (el valor por
-- defecto, pero se deja explícito para que quede claro que es a
-- propósito) -- NO se salta ningún permiso. El DELETE y el INSERT de
-- dentro siguen pasando por las mismas políticas RLS de siempre
-- (step22_five_roles.sql) con el usuario real que llama, ni un pelo
-- más de acceso del que ya tenía llamando a delete()/insert() por
-- separado como hasta ahora -- lo único que cambia es que ahora las dos
-- operaciones se confirman o se deshacen juntas.
-- =============================================================================

create or replace function public.replace_training_exercises(p_training_id uuid, p_rows jsonb)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  delete from public.training_exercises where training_id = p_training_id;

  insert into public.training_exercises
    (training_id, exercise_id, order_index, duration_minutes, key_points, session_variants, is_pause, is_match, match_format)
  select
    p_training_id,
    (r->>'exercise_id')::uuid,
    coalesce((r->>'order_index')::int, 0),
    coalesce((r->>'duration_minutes')::int, 10),
    coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(r->'key_points', '[]'::jsonb)) x), '{}'),
    r->>'session_variants',
    coalesce((r->>'is_pause')::boolean, false),
    coalesce((r->>'is_match')::boolean, false),
    r->>'match_format'
  from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) as r;
end;
$$;

grant execute on function public.replace_training_exercises(uuid, jsonb) to authenticated;

-- =============================================================================
-- VERIFICAR DESPUÉS DE CORRER ESTO:
--   select proname, prosecdef from pg_proc where proname = 'replace_training_exercises';
--   -- prosecdef debe salir "f" (false) -- security invoker, no definer.
--
--   Y en la app: abrir una sesión con un plan de ejercicios ya guardado,
--   cambiarlo (añadir/quitar un ejercicio) y guardar -- debe verse
--   igual que antes. No hay forma fácil de simular el fallo a mitad de
--   camino desde la propia app, pero con esto ya no puede pasar aunque
--   la red falle justo entre el borrado y el guardado nuevo -- antes sí.
-- =============================================================================
