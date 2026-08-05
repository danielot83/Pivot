-- =============================================================================
-- Pivot Cloud — Étape 26 : roster avec seulement 2 niveaux (pas les 4)
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Le roster reste à part des autres modules, comme décidé avec Daniel :
-- pas de partage "association" ni "community" (ce sont des données
-- personnelles de vrais joueurs, parfois mineurs). Seulement 2 niveaux :
--   'team'    -- toute l'équipe le voit (comportement actuel, par défaut)
--   'private' -- seul celui qui l'a créé le voit, même pas ses coéquipiers
-- =============================================================================

alter table public.players
  add column if not exists visibility text not null default 'team',
  add column if not exists created_by uuid references auth.users(id) default auth.uid();

alter table public.players
  add constraint players_visibility_check
  check (visibility in ('private', 'team'));

comment on column public.players.visibility is
  'Seulement 2 niveaux ici (pas 4 comme les autres modules) : team (toute l''équipe) ou private (seul le créateur). Décision de Daniel : le roster ne se partage jamais entre clubes.';

drop policy if exists "club members see their club's players" on public.players;
create policy "voir un joueur selon son niveau restreint (team/private)"
  on public.players for select
  to authenticated
  using (
    public.is_platform_controller()
    or (visibility = 'private' and created_by = auth.uid())
    or (visibility = 'team' and public.is_member_of(organization_id))
  );
