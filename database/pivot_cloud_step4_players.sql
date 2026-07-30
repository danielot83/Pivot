-- =============================================================================
-- Pivot Cloud — Roster module: players table
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
-- Builds on top of the previous migrations (organizations, profiles,
-- memberships already exist).
--
-- Field names match the desktop app's roster (roster.py FIELD_KEYS), so
-- nothing about how a club thinks about its roster changes moving online.
-- =============================================================================

create table if not exists public.players (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  season          text not null,
  team            text not null,
  license         text,
  avs_number      text,
  first_name      text not null,
  last_name       text not null,
  birth_year      integer,
  category        text,
  jersey_number   text,
  gender          text,
  phone           text,
  email           text,
  has_license     boolean not null default false,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

comment on table public.players is
  'Un joueur, rattaché à un club (organization_id), une saison et une équipe.
   Mêmes champs que roster.py côté application de bureau.';

-- -----------------------------------------------------------------------------
-- Qui peut modifier le contenu d'un club (pas juste le voir) : admin, coach,
-- ou assistant -- pas un "viewer" (joueur/parent), qui ne fait que consulter.
-- -----------------------------------------------------------------------------
create or replace function public.can_edit_content(org_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('admin', 'coach', 'assistant')
  );
$$ language sql security definer stable;

alter table public.players enable row level security;

create policy "club members see their club's players"
  on public.players for select
  to authenticated
  using (public.is_member_of(organization_id) or public.is_platform_controller());

create policy "coaches add players to their club"
  on public.players for insert
  to authenticated
  with check (public.can_edit_content(organization_id));

create policy "coaches update their club's players"
  on public.players for update
  to authenticated
  using (public.can_edit_content(organization_id))
  with check (public.can_edit_content(organization_id));

create policy "coaches remove players from their club"
  on public.players for delete
  to authenticated
  using (public.can_edit_content(organization_id));

-- =============================================================================
-- Done. Next: roster.html, the screen that reads and writes this table.
-- =============================================================================
