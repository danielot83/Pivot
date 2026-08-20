-- =============================================================================
-- PlayPivot — Step 62: Género como dimensión nueva del equipo
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Hasta ahora un equipo era Temporada + Nombre + Categoría (U8, U10...).
-- Se agrega Género (Boys / Girls / Mixed) como una cuarta dimensión,
-- igual de real que la categoría -- "DEL U12 Boys" y "DEL U12 Girls" son
-- dos equipos separados, con jugadores separados, partidos separados,
-- todo separado -- mismo patrón que ya usamos para categoría.
-- =============================================================================

alter table public.players add column if not exists team_gender text;
alter table public.teams add column if not exists team_gender text;
alter table public.matches add column if not exists team_gender text;
alter table public.trainings add column if not exists team_gender text;
alter table public.events add column if not exists team_gender text;
alter table public.plays add column if not exists team_gender text;

-- Arreglamos la restricción de "teams" otra vez (mismo problema que la
-- vez pasada con la categoría) para que el género también cuente a la
-- hora de decidir si dos filas son "el mismo equipo" o no.
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

  execute 'alter table public.teams add constraint teams_org_season_team_category_gender_key unique (organization_id, season, team, team_category, team_gender)';
end $$;

-- Nota: esto NO le pone género a los equipos que ya tenés cargados --
-- quedan con team_gender = null (equivalente a "sin especificar") hasta
-- que lo edites desde la app. La interfaz nueva va a pedir elegir
-- género al crear un equipo de acá en adelante.
