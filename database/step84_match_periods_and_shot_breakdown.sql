-- =============================================================================
-- PlayPivot -- step84_match_periods_and_shot_breakdown
-- =============================================================================
-- Dani, ronda 31: hacer el importador de hojas de partido más flexible,
-- pidiendo explícitamente que lo nuevo quede "contable, para hacer
-- estadísticas" -- es decir, columnas propias en la tabla, no datos
-- escondidos dentro de un jsonb genérico.
--
-- Dos cosas nuevas, las dos opcionales (nunca obligatorias, nunca rompen
-- una hoja/partido que no las traiga):
--
-- 1. periods_played -- cuántos periodos/cuartos jugó un jugador en el
--    partido. Ninguna hoja de la app lo registraba en ningún sitio; el
--    formato de la LRBC (federación) sí lo trae como columna propia.
--
-- 2. made_1 / made_2 / made_3 -- desglose de canastas anotadas de 1/2/3
--    puntos (no solo el total de puntos). Algunas hojas (torneos de
--    categorías inferiores, p.ej. U8) anotan directamente quién metió
--    cada canasta en vez de un total ya sumado. match.html ya calcula el
--    total de puntos a partir de este desglose SOLO si la hoja no trae
--    ya una columna de puntos total (ver MATCH_STAT_ALIASES/comentario
--    "Dani, ronda 31" en match.html) -- si la hoja trae las dos cosas,
--    el total explícito manda siempre (por si hay puntos que el
--    desglose 1/2/3 no contempla: técnicos, antideportivas de 4, etc.).
--
-- Se añaden también a match_opponent_stats por simetría con
-- match_player_stats (mismo criterio que ya siguen custom_stats/fouls/
-- minutes en las dos tablas desde step36/step61) -- aunque hoy match.html
-- no muestra estas columnas para el rival (alcance de esta ronda,
-- centrado en las stats del propio equipo), tenerlas ya en el esquema
-- evita una migración nueva si en el futuro se quiere lo mismo ahí.
--
-- Run in Supabase: SQL Editor → New query → paste → Run. Seguro de
-- correr más de una vez (add column if not exists, create or replace
-- function).
-- =============================================================================

alter table public.match_player_stats add column if not exists periods_played integer;
comment on column public.match_player_stats.periods_played is
  'Cuántos periodos/cuartos jugó este jugador en este partido. Opcional -- NULL cuando no se registró (la mayoría de hojas de partido no lo traen).';

alter table public.match_player_stats add column if not exists made_1 integer;
alter table public.match_player_stats add column if not exists made_2 integer;
alter table public.match_player_stats add column if not exists made_3 integer;
comment on column public.match_player_stats.made_1 is 'Canastas de 1 punto anotadas (tiros libres). Opcional, desglose del total en "points".';
comment on column public.match_player_stats.made_2 is 'Canastas de 2 puntos anotadas. Opcional, desglose del total en "points".';
comment on column public.match_player_stats.made_3 is 'Canastas de 3 puntos anotadas. Opcional, desglose del total en "points".';

alter table public.match_opponent_stats add column if not exists periods_played integer;
alter table public.match_opponent_stats add column if not exists made_1 integer;
alter table public.match_opponent_stats add column if not exists made_2 integer;
alter table public.match_opponent_stats add column if not exists made_3 integer;

-- -----------------------------------------------------------------------
-- replace_match_details -- misma función atómica de step83 (security
-- invoker, sin más acceso del que ya daban las policies de siempre),
-- ampliada para leer/guardar también estas 4 columnas nuevas de cada
-- fila jsonb. Los partidos guardados antes de esta ronda simplemente no
-- traían estas claves en su jsonb -- coalesce/nullif las deja en su
-- valor por defecto (NULL para periods_played, 0 para made_1/2/3),
-- exactamente igual que ya pasa hoy con minutes/points/etc.
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
    (organization_id, match_id, player_name, minutes, points, rebounds, assists, fouls, custom_stats, periods_played, made_1, made_2, made_3)
  select
    p_organization_id,
    p_match_id,
    r->>'player_name',
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
--   -- prosecdef debe seguir saliendo "f" (false), igual que en step83.
--   Y en la app (match.html): activar en "Columns ▾" las columnas
--   "Periods"/"1PM"/"2PM"/"3PM", rellenar alguna a mano, guardar y volver
--   a abrir el partido -- debe conservarse. Luego probar un import de
--   Excel con una columna "Periods played" (o similar) y con columnas
--   "1PM"/"2PM"/"3PM" en vez de "Points" -- el total de puntos debe salir
--   calculado solo.
-- =============================================================================
