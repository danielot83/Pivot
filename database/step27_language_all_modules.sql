-- =============================================================================
-- Pivot Cloud — Étape 27 : langue (EN/FR/ES) sur les modules restants
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Même patron que step17 (exercises) : chaque traduction est sa propre
-- ligne, reliée aux autres par translation_group_id. Roster est exclu
-- (décision de Daniel, comme pour le partage).
-- =============================================================================

do $$
declare
  tbl text;
begin
  foreach tbl in array array['plays', 'matches', 'trainings', 'player_assessments']
  loop
    execute format('alter table public.%I add column if not exists language text not null default ''en''', tbl);
    execute format('alter table public.%I add constraint %I check (language in (''en'',''fr'',''es''))', tbl, tbl || '_language_check');
    execute format('alter table public.%I add column if not exists translation_group_id uuid', tbl);
    execute format('update public.%I set translation_group_id = uuid_generate_v4() where translation_group_id is null', tbl);
    execute format('alter table public.%I alter column translation_group_id set not null', tbl);
    execute format('alter table public.%I alter column translation_group_id set default uuid_generate_v4()', tbl);
    execute format('create index if not exists %I on public.%I (language)', tbl || '_language_idx', tbl);
    execute format('create index if not exists %I on public.%I (translation_group_id)', tbl || '_translation_group_idx', tbl);
  end loop;
end $$;

comment on column public.plays.language is 'Idioma de esta fila (en/fr/es). Cada traducción es su propia fila.';
comment on column public.matches.language is 'Idioma de esta fila (en/fr/es). Cada traducción es su propia fila.';
comment on column public.trainings.language is 'Idioma de esta fila (en/fr/es). Cada traducción es su propia fila.';
comment on column public.player_assessments.language is 'Idioma de esta fila (en/fr/es). Cada traducción es su propia fila.';
