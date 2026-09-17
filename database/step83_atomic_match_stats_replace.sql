-- =============================================================================
-- PlayPivot -- step83_atomic_match_stats_replace
-- =============================================================================
-- Mismo problema que step82 (training_exercises), encontrado al revisar
-- match.html mientras se arreglaba el hallazgo ALTO nº5 del test
-- funcional ronda 30: `saveMatch()` hace DOS pares de
-- delete()-luego-insert() sueltos, sin transacción -- uno para
-- `match_player_stats`, otro para `match_opponent_stats`. Si cualquiera
-- de los dos insert() falla a mitad de camino (red, un dato raro), el
-- delete() de esa tabla ya se confirmó: las estadísticas de ese partido
-- quedan vacías de verdad en la base de datos aunque la pantalla las
-- siga mostrando completas -- el mismo riesgo silencioso que ya se
-- arregló para el plan de ejercicios de una sesión.
--
-- Arreglo: una función que hace los dos pares de delete/insert dentro
-- de una sola llamada (una única transacción implícita) -- si algo
-- falla, se deshace TODO (las dos tablas), nunca queda una a medias.
-- `security invoker` a propósito, igual que step82: ni un pelo más de
-- acceso del que ya daban las policies de siempre sobre estas dos
-- tablas -- el DELETE/INSERT de dentro sigue pasando por RLS con el
-- usuario real que llama.
-- =============================================================================

create or replace function public.replace_match_details(
  p_match_id uuid,
  p_organization_id uuid,
  p_player_rows jsonb,
  p_opponent_rows jsonb
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  delete from public.match_player_stats where match_id = p_match_id;
  insert into public.match_player_stats
    (match_id, player_id, started, minutes, points, rebounds, assists, fouls, custom_stats, called_up)
  select
    p_match_id,
    (r->>'player_id')::uuid,
    coalesce((r->>'started')::boolean, false),
    nullif(r->>'minutes', '')::numeric,
    coalesce((r->>'points')::int, 0),
    coalesce((r->>'rebounds')::int, 0),
    coalesce((r->>'assists')::int, 0),
    coalesce((r->>'fouls')::int, 0),
    coalesce(r->'custom_stats', '{}'::jsonb),
    coalesce((r->>'called_up')::boolean, false)
  from jsonb_array_elements(coalesce(p_player_rows, '[]'::jsonb)) as r;

  delete from public.match_opponent_stats where match_id = p_match_id;
  insert into public.match_opponent_stats
    (organization_id, match_id, player_name, minutes, points, rebounds, assists, fouls, custom_stats)
  select
    p_organization_id,
    p_match_id,
    r->>'player_name',
    nullif(r->>'minutes', '')::numeric,
    coalesce((r->>'points')::int, 0),
    coalesce((r->>'rebounds')::int, 0),
    coalesce((r->>'assists')::int, 0),
    coalesce((r->>'fouls')::int, 0),
    coalesce(r->'custom_stats', '{}'::jsonb)
  from jsonb_array_elements(coalesce(p_opponent_rows, '[]'::jsonb)) as r;
end;
$$;

grant execute on function public.replace_match_details(uuid, uuid, jsonb, jsonb) to authenticated;

-- =============================================================================
-- VERIFICAR DESPUÉS DE CORRER ESTO:
--   select proname, prosecdef from pg_proc where proname = 'replace_match_details';
--   -- prosecdef debe salir "f" (false).
--   Y en la app: abrir un partido ya guardado con stats de jugadores y
--   del rival, cambiar algo y guardar -- debe verse igual que antes.
-- =============================================================================
