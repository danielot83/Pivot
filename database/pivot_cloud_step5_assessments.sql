-- =============================================================================
-- Pivot Cloud — Suivi module: player assessments
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
-- Builds on top of players (step4) and the earlier organization/membership
-- migrations.
-- =============================================================================

create table if not exists public.player_assessments (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  player_id       uuid not null references public.players(id) on delete cascade,
  date            date not null default current_date,
  location        text,
  ratings         jsonb not null default '{}'::jsonb,
  positive_points text,
  negative_points text,
  to_improve      text,
  created_at      timestamptz not null default now()
);

comment on table public.player_assessments is
  'Une évaluation d''un joueur à une date donnée. "ratings" garde la même
   forme imbriquée que suivi.py côté application de bureau : secteur ->
   groupe -> liste de notes (0-5 ou null si pas encore noté).';

alter table public.player_assessments enable row level security;

create policy "club members see their club's assessments"
  on public.player_assessments for select
  to authenticated
  using (public.is_member_of(organization_id) or public.is_platform_controller());

create policy "coaches add assessments for their club"
  on public.player_assessments for insert
  to authenticated
  with check (public.can_edit_content(organization_id));

create policy "coaches update their club's assessments"
  on public.player_assessments for update
  to authenticated
  using (public.can_edit_content(organization_id))
  with check (public.can_edit_content(organization_id));

create policy "coaches remove their club's assessments"
  on public.player_assessments for delete
  to authenticated
  using (public.can_edit_content(organization_id));

-- =============================================================================
-- Done. Next: assessment.html, the screen that reads and writes this table.
-- =============================================================================
