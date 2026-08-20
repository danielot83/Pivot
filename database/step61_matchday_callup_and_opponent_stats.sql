-- =============================================================================
-- PlayPivot — Step 61: Match day — "Convocado" separado, y estadísticas
-- opcionales de jugadores rivales
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- 1. "called_up" (convocado) es un campo nuevo, distinto de "started"
--    (si jugó desde el inicio) y distinto de la asistencia (que vive en
--    la tabla "attendance", separada a propósito). Un jugador puede
--    estar convocado y no jugar ni un segundo, o estar presente pero no
--    convocado (por ejemplo, viene a ver el partido).
--
-- 2. "match_opponent_stats" -- para anotar estadísticas de jugadores
--    rivales si el entrenador quiere, sin tener su roster cargado en
--    ningún lado. Por eso el nombre es texto libre, no una referencia a
--    la tabla de jugadores -- y la tabla entera es opcional: si nunca
--    se agrega una fila, no pasa nada, no bloquea nada.
-- =============================================================================

alter table public.match_player_stats add column if not exists called_up boolean not null default false;
comment on column public.match_player_stats.called_up is
  'Convocado a este partido -- separado a propósito de "started" (si jugó desde el inicio) y de la asistencia (tabla attendance).';

create table if not exists public.match_opponent_stats (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  match_id        uuid not null references public.matches(id) on delete cascade,
  player_name     text not null,
  minutes         numeric,
  points          integer default 0,
  rebounds        integer default 0,
  assists         integer default 0,
  fouls           integer default 0,
  custom_stats    jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

comment on table public.match_opponent_stats is
  'Estadísticas opcionales de jugadores del equipo rival -- nombre libre
   (no hay roster del rival cargado en ningún lado), así que esta tabla
   nunca es obligatoria para guardar un partido.';

alter table public.match_opponent_stats enable row level security;

drop policy if exists "club members see their club's opponent stats" on public.match_opponent_stats;
create policy "club members see their club's opponent stats"
  on public.match_opponent_stats for select
  to authenticated
  using (public.is_member_of(organization_id) or public.is_platform_controller());

drop policy if exists "coaches manage opponent stats for their club" on public.match_opponent_stats;
create policy "coaches manage opponent stats for their club"
  on public.match_opponent_stats for insert
  to authenticated
  with check (public.can_edit_content(organization_id));

drop policy if exists "coaches update opponent stats for their club" on public.match_opponent_stats;
create policy "coaches update opponent stats for their club"
  on public.match_opponent_stats for update
  to authenticated
  using (public.can_edit_content(organization_id))
  with check (public.can_edit_content(organization_id));

drop policy if exists "coaches delete opponent stats for their club" on public.match_opponent_stats;
create policy "coaches delete opponent stats for their club"
  on public.match_opponent_stats for delete
  to authenticated
  using (public.can_edit_content(organization_id) or public.is_platform_controller());
