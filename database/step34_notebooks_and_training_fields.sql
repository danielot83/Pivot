-- =============================================================================
-- Pivot Cloud — Étape 34 : Notebooks (les "Cahiers") + champs manquants
-- dans Training builder, comme dans l'app de bureau
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
-- Requiere haber aplicado antes step18 (asociaciones), step22 (5 rôles).
--
-- Deux parties :
--   1. Notebooks -- des listes d'exercices toutes prêtes, groupées par
--      thème/âge, indépendantes de la saison/équipe (comme les "Cahiers"
--      du programme de bureau).
--   2. Les champs qu'il manquait dans une séance : numéro, catégorie,
--      nombre de joueurs, jusqu'à 3 coachs, un résumé auto
--      (catégories/matériel/objectifs), et les notes d'après-séance
--      (note, commentaires, idées pour la prochaine fois) -- séparées
--      exprès de la préparation.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Notebooks
-- -----------------------------------------------------------------------------
create table if not exists public.notebooks (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  visibility      text not null default 'team' check (visibility in ('private', 'team', 'association', 'community')),
  created_by      uuid references auth.users(id) default auth.uid(),
  created_at      timestamptz not null default now()
);

comment on table public.notebooks is
  'Une liste d''exercices toute prête, groupée par thème/âge (ex: "Défense", "U8") -- indépendante de la saison/équipe. Équivalent des "Cahiers" de l''app de bureau.';

create table if not exists public.notebook_exercises (
  notebook_id uuid not null references public.notebooks(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  position    integer not null default 0,
  primary key (notebook_id, exercise_id)
);

alter table public.notebooks enable row level security;
alter table public.notebook_exercises enable row level security;

create policy "voir un notebook selon son cercle de partage"
  on public.notebooks for select to authenticated
  using (
    public.is_platform_controller()
    or (visibility = 'private' and created_by = auth.uid())
    or (visibility = 'team' and public.is_member_of(organization_id))
    or (visibility = 'association' and (public.is_member_of(organization_id) or public.shares_association_with(organization_id)))
    or (visibility = 'community')
  );
create policy "coaches créent des notebooks pour leur club"
  on public.notebooks for insert to authenticated
  with check (public.can_edit_content(organization_id));
create policy "coaches modifient leurs notebooks"
  on public.notebooks for update to authenticated
  using (public.can_edit_content(organization_id)) with check (public.can_edit_content(organization_id));
create policy "seuls admin/coach/platform admin suppriment un notebook"
  on public.notebooks for delete to authenticated
  using (public.can_delete_content(organization_id));

-- La table de liaison hérite ses droits du notebook auquel elle appartient.
create policy "voir le contenu d'un notebook visible"
  on public.notebook_exercises for select to authenticated
  using (exists (select 1 from public.notebooks n where n.id = notebook_id));
create policy "ajouter un exercice à mon notebook"
  on public.notebook_exercises for insert to authenticated
  with check (exists (select 1 from public.notebooks n where n.id = notebook_id and public.can_edit_content(n.organization_id)));
create policy "réordonner le contenu de mon notebook"
  on public.notebook_exercises for update to authenticated
  using (exists (select 1 from public.notebooks n where n.id = notebook_id and public.can_edit_content(n.organization_id)))
  with check (exists (select 1 from public.notebooks n where n.id = notebook_id and public.can_edit_content(n.organization_id)));
create policy "retirer un exercice de mon notebook"
  on public.notebook_exercises for delete to authenticated
  using (exists (select 1 from public.notebooks n where n.id = notebook_id and public.can_edit_content(n.organization_id)));

-- -----------------------------------------------------------------------------
-- 2. Champs manquants dans une séance -- exactement ceux du programme de
--    bureau, plus "rating" (une note sur 5, propre à Pivot Cloud).
-- -----------------------------------------------------------------------------
alter table public.trainings
  add column if not exists number integer,
  add column if not exists category text,
  add column if not exists players_count integer,
  add column if not exists coaches text[] not null default '{}',
  add column if not exists categories_summary text[] not null default '{}',
  add column if not exists material_summary text[] not null default '{}',
  add column if not exists objectives_summary text[] not null default '{}',
  add column if not exists rating integer,
  add column if not exists comments text,
  add column if not exists next_training_notes text;

alter table public.trainings
  add constraint trainings_rating_check check (rating is null or (rating between 0 and 5));

comment on column public.trainings.comments is
  'Notes d''après-séance : ce qui s''est passé, pas ce qui était prévu -- rempli après coup, pas pendant la préparation.';
comment on column public.trainings.next_training_notes is
  'Idées pour la prochaine séance -- même logique : après coup.';

-- Ce qui était "time"/"points"/"variants" propres à CETTE séance dans
-- l'app de bureau (pas l'exercice original, une version ajustée juste
-- pour ce jour-là).
alter table public.training_exercises
  add column if not exists key_points text[] not null default '{}',
  add column if not exists session_variants text;
