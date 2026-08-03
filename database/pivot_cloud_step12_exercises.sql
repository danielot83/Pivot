-- =============================================================================
-- Pivot Cloud — Exercise library module
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Same diagram idea as plays (players + drawn actions in one JSON blob),
-- plus "is_shared": when true, any club on Pivot can see (but not edit)
-- the exercise -- this is the shared-base-library idea from the plan.
-- =============================================================================

create table if not exists public.exercises (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  category        text,
  difficulty      integer not null default 3 check (difficulty between 1 and 5),
  description     text,
  diagram         jsonb not null default '{}'::jsonb,
  is_shared       boolean not null default false,
  created_at      timestamptz not null default now()
);

comment on table public.exercises is
  'Un exercice : nom, catégorie, difficulté (1-5), description, et un
   diagramme de terrain (mêmes joueurs/actions que plays). is_shared=true
   le rend visible par les autres clubs (base commune de la bibliothèque),
   mais seul le club propriétaire peut le modifier ou le supprimer.';

alter table public.exercises enable row level security;

-- Voir : ses propres exercices, OU n'importe quel exercice partagé par
-- un autre club, OU tout si contrôleur de la plateforme.
create policy "see own or shared exercises"
  on public.exercises for select
  to authenticated
  using (
    public.is_member_of(organization_id)
    or is_shared = true
    or public.is_platform_controller()
  );

create policy "coaches add exercises to their club"
  on public.exercises for insert
  to authenticated
  with check (public.can_edit_content(organization_id));

create policy "coaches update their own club's exercises"
  on public.exercises for update
  to authenticated
  using (public.can_edit_content(organization_id))
  with check (public.can_edit_content(organization_id));

create policy "coaches remove their own club's exercises"
  on public.exercises for delete
  to authenticated
  using (public.can_edit_content(organization_id));

-- =============================================================================
-- Done. Next: exercises.html, the screen that reads and writes this table.
-- =============================================================================
