-- =============================================================================
-- Pivot Cloud — Étape 42 : un vrai registre d'équipes
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Jusqu'ici, une saison/équipe n'existait QUE si elle avait des joueurs
-- (le players table). Impossible de créer une équipe vide, ou de la
-- créer depuis Training builder/Match day/Player assessment -- seul
-- Roster pouvait "faire semblant" d'en montrer une toute juste créée.
-- Cette étape ajoute un vrai registre, séparé des joueurs eux-mêmes.
-- =============================================================================

create table if not exists public.teams (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  season          text not null,
  team            text not null,
  team_category   text,
  created_by      uuid references auth.users(id) default auth.uid(),
  created_at      timestamptz not null default now(),
  unique (organization_id, season, team)
);

comment on table public.teams is
  'Registre léger saison/équipe -- existe indépendamment d''avoir des joueurs. Permet de créer une équipe vide depuis N''IMPORTE QUEL module (Training builder, Match day, Player assessment...), pas seulement Roster.';

alter table public.teams enable row level security;

create policy "voir les équipes de son club"
  on public.teams for select to authenticated
  using (public.is_staff_member_of(organization_id) or public.is_platform_controller());
create policy "coach/admin créent une équipe pour leur club"
  on public.teams for insert to authenticated
  with check (public.can_edit_content(organization_id));
create policy "coach/admin modifient une équipe de leur club"
  on public.teams for update to authenticated
  using (public.can_edit_content(organization_id)) with check (public.can_edit_content(organization_id));
create policy "admin/coach suppriment une équipe de leur club"
  on public.teams for delete to authenticated
  using (public.can_delete_content(organization_id));

-- -----------------------------------------------------------------------------
-- Une "pause" dans le plan d'une séance -- une ligne sans exercice, juste
-- un temps de repos entre deux exercices. Distinct de "l'exercice lié a
-- été supprimé depuis" (exercise_id null pour une autre raison).
-- -----------------------------------------------------------------------------
alter table public.training_exercises add column if not exists is_pause boolean not null default false;
comment on column public.training_exercises.is_pause is
  'true = une pause (repos), pas un exercice -- exercise_id est alors toujours null, mais volontairement, pas parce que l''exercice lié a été supprimé.';
