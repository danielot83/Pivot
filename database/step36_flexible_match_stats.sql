-- =============================================================================
-- Pivot Cloud — Étape 36 : colonnes de stats de match configurables par club
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Chaque club a des habitudes différentes pour noter un match -- certains
-- veulent juste points/rebonds/passes, d'autres tout un box-score détaillé
-- (interceptions, contres, pertes de balle, +/-...). Au lieu d'imposer une
-- liste fixe, chaque club définit ses propres colonnes en plus des
-- basiques (qui restent toujours là, pour les clubs qui veulent rester
-- simples).
-- =============================================================================

create table if not exists public.match_stat_fields (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  key             text not null,
  label           text not null,
  position        integer not null default 0,
  enabled         boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (organization_id, key)
);

comment on table public.match_stat_fields is
  'Les colonnes de stats de match qu''un club a choisi de suivre, en plus des basiques (minutes/points/rebonds/passes/fautes) qui restent toujours disponibles.';

alter table public.match_stat_fields enable row level security;

create policy "voir les colonnes de son propre club"
  on public.match_stat_fields for select to authenticated
  using (public.is_member_of(organization_id) or public.is_platform_controller());
create policy "coach/admin créent des colonnes pour leur club"
  on public.match_stat_fields for insert to authenticated
  with check (public.can_edit_content(organization_id));
create policy "coach/admin modifient les colonnes de leur club"
  on public.match_stat_fields for update to authenticated
  using (public.can_edit_content(organization_id)) with check (public.can_edit_content(organization_id));
create policy "coach/admin suppriment une colonne de leur club"
  on public.match_stat_fields for delete to authenticated
  using (public.can_edit_content(organization_id));

-- Là où les valeurs de ces colonnes personnalisées sont vraiment stockées,
-- une par joueur par match -- un simple objet {clé: valeur}.
alter table public.match_player_stats add column if not exists custom_stats jsonb not null default '{}'::jsonb;
comment on column public.match_player_stats.custom_stats is
  'Valeurs des colonnes personnalisées de ce club (voir match_stat_fields) -- {"steals": 3, "turnovers": 1, ...}.';
