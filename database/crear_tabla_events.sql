-- =============================================================================
-- PlayPivot — Tabla "events" para el calendario (eventos genéricos, no
-- partidos ni entrenamientos -- esos ya existen en matches/trainings).
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
-- =============================================================================

begin;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  date date not null,
  title text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

drop policy if exists "members can view events for their club" on public.events;
create policy "members can view events for their club"
  on public.events for select
  using (public.is_member_of(organization_id));

drop policy if exists "coaches can create events for their club" on public.events;
create policy "coaches can create events for their club"
  on public.events for insert
  with check (public.can_edit_content(organization_id));

drop policy if exists "coaches can delete events for their club" on public.events;
create policy "coaches can delete events for their club"
  on public.events for delete
  using (public.can_delete_content(organization_id));

commit;
