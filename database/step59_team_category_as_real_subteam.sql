-- =============================================================================
-- PlayPivot — Step 59: la categoría (U8, U10...) pasa a ser un
-- sub-equipo de verdad, no solo una etiqueta
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Hasta ahora, "DEL" + "2026-2027" solo podía tener UNA categoría en el
-- registro de equipos -- crear una segunda (U10) sobrescribía la
-- primera (U8) en vez de crear un equipo separado. Y aunque no la
-- hubiera sobrescrito, Match day/Training/Play design ni siquiera
-- tenían dónde guardar la categoría, así que jugadores de U8 y U10
-- hubieran terminado mezclados en los mismos partidos/entrenos.
--
-- Este paso:
-- 1. Agrega "team_category" a matches, trainings y plays (las tablas
--    que todavía no la tenían -- players y teams ya la tenían).
-- 2. Arregla la restricción de "teams" para que permita más de una
--    categoría por equipo/temporada.
-- =============================================================================

alter table public.matches add column if not exists team_category text;
alter table public.trainings add column if not exists team_category text;
alter table public.plays add column if not exists team_category text;

-- La restricción vieja era (organization_id, season, team) -- por eso
-- "DEL" + "2026-2027" con categoría U10 pisaba al que ya existía con
-- U8. La cambiamos para que la categoría también cuente. Buscamos el
-- nombre real de la restricción (no lo adivinamos) por si Postgres le
-- puso un nombre distinto al esperado.
do $$
declare
  found_conname text;
begin
  select con.conname into found_conname
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where con.contype = 'u'
    and rel.relnamespace = 'public'::regnamespace
    and rel.relname = 'teams';

  if found_conname is not null then
    execute format('alter table public.teams drop constraint %I', found_conname);
  end if;

  execute 'alter table public.teams add constraint teams_org_season_team_category_key unique (organization_id, season, team, team_category)';
end $$;

-- Nota importante: esto NO reorganiza automáticamente los jugadores
-- que ya tenías cargados en "DEL" para 2026-2027 -- ellos quedan tal
-- cual, algunos marcados U8 y otros U10 dentro del mismo "DEL". El
-- roster.html que te mando junto con este paso ya filtra por
-- categoría también, así que en cuanto subas ese archivo, cada
-- jugador va a aparecer en la rama de árbol que le corresponda según
-- su propia categoría -- no hace falta que muevas nada a mano.
