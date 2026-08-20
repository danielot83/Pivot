-- =============================================================================
-- PlayPivot — Step 60: módulo de Asistencia
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Esto prepara la base de datos para el nuevo módulo "Attendance":
-- 1. "events" (el calendario) todavía no sabía a qué equipo pertenece
--    un evento -- solo tenía fecha y título. Le agrego season/team/
--    team_category, igual que ya tienen matches/trainings/plays, para
--    que un evento se pueda ligar a un equipo concreto (opcional --
--    dejarlo vacío significa "evento general del club", sigue
--    apareciendo en el Calendario igual que siempre).
-- 2. Tabla nueva "attendance" -- una sola fila por jugador+fecha,
--    apunte a un partido, un entreno o un evento (nunca a dos a la
--    vez). El estado es Present/Absent/Excused/Late.
--
-- Importante: las columnas de fecha en la página de Asistencia NO se
-- generan escribiendo filas acá de antemano -- se calculan solas
-- mirando directamente matches/trainings/events de ese equipo (igual
-- que ya hace el Calendario). Una fila en "attendance" solo se crea
-- cuando alguien de verdad marca la asistencia de un jugador.
-- =============================================================================

alter table public.events add column if not exists season text;
alter table public.events add column if not exists team text;
alter table public.events add column if not exists team_category text;

create table if not exists public.attendance (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  match_id          uuid references public.matches(id) on delete cascade,
  training_id       uuid references public.trainings(id) on delete cascade,
  event_id          uuid references public.events(id) on delete cascade,
  player_id         uuid not null references public.players(id) on delete cascade,
  status            text not null check (status in ('present','absent','excused','late')),
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint attendance_exactly_one_event check (
    (match_id is not null)::int + (training_id is not null)::int + (event_id is not null)::int = 1
  )
);

-- Una sola fila por jugador y por partido/entreno/evento -- marcar de
-- nuevo actualiza en vez de duplicar.
create unique index if not exists attendance_match_player_key on public.attendance (match_id, player_id) where match_id is not null;
create unique index if not exists attendance_training_player_key on public.attendance (training_id, player_id) where training_id is not null;
create unique index if not exists attendance_event_player_key on public.attendance (event_id, player_id) where event_id is not null;

create index if not exists attendance_org_idx on public.attendance (organization_id);

alter table public.attendance enable row level security;

drop policy if exists "club members see their club's attendance" on public.attendance;
create policy "club members see their club's attendance"
  on public.attendance for select
  to authenticated
  using (public.is_member_of(organization_id) or public.is_platform_controller());

drop policy if exists "coaches mark attendance for their club" on public.attendance;
create policy "coaches mark attendance for their club"
  on public.attendance for insert
  to authenticated
  with check (public.can_edit_content(organization_id));

drop policy if exists "coaches update attendance for their club" on public.attendance;
create policy "coaches update attendance for their club"
  on public.attendance for update
  to authenticated
  using (public.can_edit_content(organization_id))
  with check (public.can_edit_content(organization_id));

drop policy if exists "coaches delete attendance for their club" on public.attendance;
create policy "coaches delete attendance for their club"
  on public.attendance for delete
  to authenticated
  using (public.can_edit_content(organization_id) or public.is_platform_controller());

comment on table public.attendance is
  'Presente/Ausente/Justificado/Tarde por jugador, para un partido, un entreno
   o un evento concreto (nunca dos a la vez -- ver el check constraint).
   Las columnas de fecha en la página de Asistencia se calculan mirando
   directamente matches/trainings/events -- esta tabla solo guarda una fila
   cuando alguien marca la asistencia de verdad.';
