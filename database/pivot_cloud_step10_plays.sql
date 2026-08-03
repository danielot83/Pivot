-- =============================================================================
-- Pivot Cloud — Play design module: saved plays
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Each play belongs to a club, optionally tagged to a season/team (like
-- players), with the whole diagram (player positions + drawn actions)
-- kept as one JSON blob -- simplest way to store a freeform diagram.
-- =============================================================================

create table if not exists public.plays (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  season          text,
  team            text,
  name            text not null,
  court_type      text not null default 'half',  -- 'half' or 'full'
  diagram         jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.plays is
  'Une jeu/dynamique dessinée : positions des joueurs + actions (écrans,
   passes, dribbles, coupes) dans "diagram". Rattachée à un club, et
   optionnellement à une saison/équipe comme le reste.';

alter table public.plays enable row level security;

create policy "club members see their club's plays"
  on public.plays for select
  to authenticated
  using (public.is_member_of(organization_id) or public.is_platform_controller());

create policy "coaches add plays to their club"
  on public.plays for insert
  to authenticated
  with check (public.can_edit_content(organization_id));

create policy "coaches update their club's plays"
  on public.plays for update
  to authenticated
  using (public.can_edit_content(organization_id))
  with check (public.can_edit_content(organization_id));

create policy "coaches remove their club's plays"
  on public.plays for delete
  to authenticated
  using (public.can_edit_content(organization_id));

-- =============================================================================
-- Done. Next: play_design.html, the interactive drawing screen.
-- =============================================================================
