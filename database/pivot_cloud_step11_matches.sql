-- =============================================================================
-- Pivot Cloud — Match day module
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Same idea as the desktop app: a match has a roster call-up, starters,
-- and per-player stats (points, rebounds, assists, fouls, minutes) --
-- which is what a season summary per player is built from later.
-- =============================================================================

create table if not exists public.matches (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  season          text not null,
  team            text not null,
  date            date not null default current_date,
  opponent        text,
  location        text,
  home_away       text default 'home', -- 'home' or 'away'
  team_score      integer,
  opponent_score  integer,
  created_at      timestamptz not null default now()
);

create table if not exists public.match_player_stats (
  id           uuid primary key default uuid_generate_v4(),
  match_id     uuid not null references public.matches(id) on delete cascade,
  player_id    uuid not null references public.players(id) on delete cascade,
  started      boolean not null default false,
  minutes      numeric,
  points       integer default 0,
  rebounds     integer default 0,
  assists      integer default 0,
  fouls        integer default 0,
  unique (match_id, player_id)
);

comment on table public.matches is
  'Un match : date, adversaire, score. Le détail par joueur vit dans
   match_player_stats -- c''est ce qui permet un résumé de saison par joueur.';

alter table public.matches enable row level security;
alter table public.match_player_stats enable row level security;

create policy "club members see their club's matches"
  on public.matches for select
  to authenticated
  using (public.is_member_of(organization_id) or public.is_platform_controller());

create policy "coaches add matches to their club"
  on public.matches for insert
  to authenticated
  with check (public.can_edit_content(organization_id));

create policy "coaches update their club's matches"
  on public.matches for update
  to authenticated
  using (public.can_edit_content(organization_id))
  with check (public.can_edit_content(organization_id));

create policy "coaches remove their club's matches"
  on public.matches for delete
  to authenticated
  using (public.can_edit_content(organization_id));

-- match_player_stats hérite ses droits de la table matches à laquelle
-- chaque ligne appartient (même logique, juste avec un niveau d'indirection).
create policy "club members see their club's match stats"
  on public.match_player_stats for select
  to authenticated
  using (exists (
    select 1 from public.matches m
    where m.id = match_id and (public.is_member_of(m.organization_id) or public.is_platform_controller())
  ));

create policy "coaches add match stats"
  on public.match_player_stats for insert
  to authenticated
  with check (exists (
    select 1 from public.matches m where m.id = match_id and public.can_edit_content(m.organization_id)
  ));

create policy "coaches update match stats"
  on public.match_player_stats for update
  to authenticated
  using (exists (
    select 1 from public.matches m where m.id = match_id and public.can_edit_content(m.organization_id)
  ))
  with check (exists (
    select 1 from public.matches m where m.id = match_id and public.can_edit_content(m.organization_id)
  ));

create policy "coaches remove match stats"
  on public.match_player_stats for delete
  to authenticated
  using (exists (
    select 1 from public.matches m where m.id = match_id and public.can_edit_content(m.organization_id)
  ));

-- =============================================================================
-- Done. Next: match.html, the screen that reads and writes these tables.
-- =============================================================================
