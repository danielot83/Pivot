-- =============================================================================
-- Pivot Cloud — Exercise library: match the desktop app's exact structure
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- The first version of this table used a simplified shape. This migration
-- brings it in line with the real desktop app's exercise sheets: number,
-- favorite, multiple ages/categories/material, difficulty 1-3 (not 1-5),
-- tags, objectives, variants, and a 5-step diagram (court_1..court_5).
-- Safe to run even if step12 was already applied.
-- =============================================================================

alter table public.exercises
  add column if not exists number integer,
  add column if not exists favorite boolean not null default false,
  add column if not exists age text[] not null default '{}',
  add column if not exists material text[] not null default '{}',
  add column if not exists tags text[] not null default '{}',
  add column if not exists objectives text[] not null default '{}',
  add column if not exists variants text;

-- "categories" doit être une liste (l'app de bureau permet plusieurs
-- catégories par exercice), pas un texte unique comme dans la 1ère version.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'exercises'
      and column_name = 'category' and data_type <> 'ARRAY'
  ) then
    alter table public.exercises rename column category to category_old;
    alter table public.exercises add column categories text[] not null default '{}';
    update public.exercises set categories = array[category_old] where category_old is not null;
    alter table public.exercises drop column category_old;
  end if;
end $$;

-- La difficulté de l'app de bureau va de 1 à 3, pas 1 à 5 -- il faut
-- d'abord ramener les valeurs existantes dans cette plage, AVANT d'ajouter
-- la contrainte, sinon Postgres refuse la contrainte à cause des lignes
-- déjà à 4 ou 5.
update public.exercises set difficulty = 3 where difficulty > 3;
alter table public.exercises drop constraint if exists exercises_difficulty_check;
alter table public.exercises add constraint exercises_difficulty_check check (difficulty between 1 and 3);

-- Numéro auto-incrémenté (comme "number" dans l'app de bureau) pour les
-- exercices qui n'en ont pas encore.
create sequence if not exists public.exercises_number_seq;
update public.exercises set number = nextval('public.exercises_number_seq') where number is null;

comment on table public.exercises is
  'Même structure que les fiches JSON de l''application de bureau : number,
   name, favorite, age[], categories[], material[], difficulty (1-3),
   tags[], objectives[] (max 4), description, variants, diagram
   (5 étapes : court_1 à court_5, chacune une liste d''éléments dessinés).';

-- =============================================================================
-- Done. exercises.html gets rebuilt to match this shape exactly.
-- =============================================================================
