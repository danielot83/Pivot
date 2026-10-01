-- =============================================================================
-- PlayPivot -- step89_opponent_number_started_totals
-- =============================================================================
-- Run in Supabase: SQL Editor -> New query -> paste -> Run. Seguro de correr
-- más de una vez (add column if not exists, create or replace function).
--
-- Dani (voz, ronda 35): "hay que meter el numero de los oponentes. En
-- verdad hay que hacer el mismo analisis que el nuestro salvo called up y
-- present." -- la tabla "Opponent stats" de Match day (match.html) hoy
-- solo tiene Player name/Min/Pts/Reb/Ast/Fouls -- le faltan, respecto a la
-- tabla "Called up" del propio equipo: el número de dorsal, "Starter",
-- "Periods played" y el desglose de canastas 1PM/2PM/3PM.
--
-- "Periods played", "made_1/2/3" y "custom_stats" ya existen en
-- match_opponent_stats desde step84/step61 (se agregaron por simetría en
-- su momento, pero match.html nunca los mostraba ni los guardaba del lado
-- del rival -- este paso es el que por fin los usa). Lo único que falta de
-- verdad en el esquema es:
--
-- 1. jersey_number -- a diferencia del equipo propio (donde el dorsal sale
--    de Roster, de solo lectura en Match day), el rival no tiene roster
--    cargado en ningún lado: el dorsal hay que poder escribirlo a mano,
--    como el nombre. Por eso es una columna de texto libre, igual que
--    player_name (no "integer": algunos equipos usan dorsales como "00").
-- 2. started -- "jugó desde el inicio", mismo campo que ya tiene
--    match_player_stats desde siempre.
-- =============================================================================

alter table public.match_opponent_stats add column if not exists jersey_number text;
comment on column public.match_opponent_stats.jersey_number is
  'Dorsal del jugador rival, escrito a mano (no hay roster del rival cargado en ningún lado). Texto libre a propósito -- algunos equipos usan dorsales como "00".';

alter table public.match_opponent_stats add column if not exists started boolean not null default false;
comment on column public.match_opponent_stats.started is
  'Jugó desde el inicio del partido -- mismo campo que match_player_stats.started, ahora también disponible para el rival.';

-- -----------------------------------------------------------------------
-- replace_match_details -- misma función atómica de step83/step84
-- (security invoker, sin más acceso del que ya daban las policies de
-- siempre), ampliada para leer/guardar también jersey_number y started
-- del lado del rival. periods_played/made_1/2/3/custom_stats YA se leían
-- y guardaban para el rival desde step84 -- no cambian aquí.
-- -----------------------------------------------------------------------
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
    (match_id, player_id, started, minutes, points, rebounds, assists, fouls, custom_stats, called_up, periods_played, made_1, made_2, made_3)
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
    coalesce((r->>'called_up')::boolean, false),
    nullif(r->>'periods_played', '')::int,
    coalesce((r->>'made_1')::int, 0),
    coalesce((r->>'made_2')::int, 0),
    coalesce((r->>'made_3')::int, 0)
  from jsonb_array_elements(coalesce(p_player_rows, '[]'::jsonb)) as r;

  delete from public.match_opponent_stats where match_id = p_match_id;
  insert into public.match_opponent_stats
    (organization_id, match_id, player_name, jersey_number, started, minutes, points, rebounds, assists, fouls, custom_stats, periods_played, made_1, made_2, made_3)
  select
    p_organization_id,
    p_match_id,
    r->>'player_name',
    nullif(r->>'jersey_number', ''),
    coalesce((r->>'started')::boolean, false),
    nullif(r->>'minutes', '')::numeric,
    coalesce((r->>'points')::int, 0),
    coalesce((r->>'rebounds')::int, 0),
    coalesce((r->>'assists')::int, 0),
    coalesce((r->>'fouls')::int, 0),
    coalesce(r->'custom_stats', '{}'::jsonb),
    nullif(r->>'periods_played', '')::int,
    coalesce((r->>'made_1')::int, 0),
    coalesce((r->>'made_2')::int, 0),
    coalesce((r->>'made_3')::int, 0)
  from jsonb_array_elements(coalesce(p_opponent_rows, '[]'::jsonb)) as r;
end;
$$;

grant execute on function public.replace_match_details(uuid, uuid, jsonb, jsonb) to authenticated;

-- =============================================================================
-- VERIFICAR DESPUÉS DE CORRER ESTO:
--   select proname, prosecdef from pg_proc where proname = 'replace_match_details';
--   -- prosecdef debe seguir saliendo "f" (false).
--   Y en la app (match.html, después de subir la versión nueva): en
--   "Opponent stats", activar en su propio "Columns ▾" las columnas N°/
--   Starter/Periods/1PM/2PM/3PM, rellenar alguna a mano, guardar y volver
--   a abrir el partido -- debe conservarse. Un import de Excel con esas
--   mismas columnas del lado del rival también debe guardarlas.
-- =============================================================================
