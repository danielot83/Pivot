-- =============================================================================
-- Pivot Cloud — Training builder module
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- A training session pulls exercises from the library (with a duration
-- each, to track a running total against the planned length) and tracks
-- who attended, from the roster.
-- =============================================================================

create table if not exists public.trainings (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  season            text not null,
  team              text not null,
  date              date not null default current_date,
  title             text,
  planned_minutes   integer,
  created_at        timestamptz not null default now()
);

create table if not exists public.training_exercises (
  id            uuid primary key default uuid_generate_v4(),
  training_id   uuid not null references public.trainings(id) on delete cascade,
  exercise_id   uuid references public.exercises(id) on delete set null,
  order_index   integer not null default 0,
  duration_minutes integer not null default 10,
  notes         text
);

create table if not exists public.training_attendance (
  id           uuid primary key default uuid_generate_v4(),
  training_id  uuid not null references public.trainings(id) on delete cascade,
  player_id    uuid not null references public.players(id) on delete cascade,
  present      boolean not null default true,
  unique (training_id, player_id)
);

comment on table public.trainings is
  'Une séance : titre, date, durée prévue. Les exercices utilisés et la
   présence vivent dans les deux tables liées.';

alter table public.trainings enable row level security;
alter table public.training_exercises enable row level security;
alter table public.training_attendance enable row level security;

create policy "club members see their club's trainings"
  on public.trainings for select to authenticated
  using (public.is_member_of(organization_id) or public.is_platform_controller());
create policy "coaches add trainings to their club"
  on public.trainings for insert to authenticated
  with check (public.can_edit_content(organization_id));
create policy "coaches update their club's trainings"
  on public.trainings for update to authenticated
  using (public.can_edit_content(organization_id)) with check (public.can_edit_content(organization_id));
create policy "coaches remove their club's trainings"
  on public.trainings for delete to authenticated
  using (public.can_edit_content(organization_id));

-- Les deux tables liées héritent leurs droits de la séance à laquelle
-- chaque ligne appartient (même logique que match_player_stats).
create policy "club members see training exercises"
  on public.training_exercises for select to authenticated
  using (exists (select 1 from public.trainings t where t.id = training_id and (public.is_member_of(t.organization_id) or public.is_platform_controller())));
create policy "coaches manage training exercises"
  on public.training_exercises for all to authenticated
  using (exists (select 1 from public.trainings t where t.id = training_id and public.can_edit_content(t.organization_id)))
  with check (exists (select 1 from public.trainings t where t.id = training_id and public.can_edit_content(t.organization_id)));

create policy "club members see training attendance"
  on public.training_attendance for select to authenticated
  using (exists (select 1 from public.trainings t where t.id = training_id and (public.is_member_of(t.organization_id) or public.is_platform_controller())));
create policy "coaches manage training attendance"
  on public.training_attendance for all to authenticated
  using (exists (select 1 from public.trainings t where t.id = training_id and public.can_edit_content(t.organization_id)))
  with check (exists (select 1 from public.trainings t where t.id = training_id and public.can_edit_content(t.organization_id)));

-- =============================================================================
-- Done. Next: training.html, the screen that reads and writes these tables.
-- =============================================================================
