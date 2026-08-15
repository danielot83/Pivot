-- =============================================================================
-- PlayPivot — Étape 53 : membres du club scopés à UNE équipe précise (pas
-- forcément tout le club)
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Jusqu'ici, "membre de ce club" voulait dire "voit tout le club" -- pas de
-- différence entre le DEL U8 et le DEL U15, même s'ils sont dans le même
-- club "DEL". Cette étape ajoute la possibilité de scoper une adhésion à
-- UNE saison+équipe précise, sans rien casser pour ceux qui restent
-- scopés à tout le club (le comportement par défaut, si on ne précise
-- rien).
--
-- Cas particulier des joueurs : si le compte est lié à une fiche du
-- roster (linked_player_id), le scope se déduit automatiquement de
-- cette fiche (sa propre saison+équipe) -- pas besoin de le fixer à la
-- main en plus.
-- =============================================================================

alter table public.memberships add column if not exists team_season text;
alter table public.memberships add column if not exists team_name text;

comment on column public.memberships.team_season is
  'Si rempli (avec team_name), cette adhésion ne voit que CETTE saison+équipe précise, pas tout le club. NULL = tout le club (comportement historique).';
comment on column public.memberships.team_name is
  'Voir team_season.';

-- -----------------------------------------------------------------------
-- Nouvelle fonction : "est membre de CETTE saison+équipe précise"
-- (contrairement à is_member_of, qui ne regarde que le club entier).
-- Couvre trois cas : adhésion scopée à cette équipe pile, adhésion pas
-- scopée du tout (tout le club, donc oui), ou joueur lié dont la fiche
-- roster est justement cette saison+équipe.
-- -----------------------------------------------------------------------
create or replace function public.is_member_of_team(org_id uuid, p_season text, p_team text)
returns boolean as $$
  select
    public.is_platform_controller()
    or exists (
      select 1 from public.memberships m
      where m.organization_id = org_id
        and m.user_id = auth.uid()
        and m.status = 'active'
        and (
          -- non-joueur, pas scopé = tout le club (comportement historique)
          (m.role != 'player' and m.team_season is null and m.team_name is null)
          -- scopé pile à cette équipe (n'importe quel rôle, joueur y compris)
          or (m.team_season = p_season and m.team_name = p_team)
          -- joueur SANS scope manuel : jamais l'accès "tout le club" --
          -- uniquement via sa propre fiche liée, rien d'autre
          or (m.role = 'player' and exists (
            select 1 from public.players p
            where p.id = m.linked_player_id
              and p.season = p_season and p.team = p_team
          ))
        )
    );
$$ language sql security definer stable;

create or replace function public.is_staff_member_of_team(org_id uuid, p_season text, p_team text)
returns boolean as $$
  select
    public.is_platform_controller()
    or exists (
      select 1 from public.memberships m
      where m.organization_id = org_id
        and m.user_id = auth.uid()
        and m.status = 'active'
        and m.role != 'player'
        and (
          (m.team_season is null and m.team_name is null)
          or (m.team_season = p_season and m.team_name = p_team)
        )
    );
$$ language sql security definer stable;

-- -----------------------------------------------------------------------
-- Les policies "team" de players/matches/trainings utilisaient
-- is_member_of(organization_id) -- on les remplace par la version qui
-- vérifie aussi la saison+équipe précise de la ligne elle-même.
-- -----------------------------------------------------------------------
drop policy if exists "voir un joueur selon son niveau restreint (team/private)" on public.players;
create policy "les membres voient les joueurs de leur equipe"
  on public.players for select to authenticated
  using (
    public.is_platform_controller()
    or (visibility = 'private' and created_by = auth.uid())
    or (visibility = 'team' and public.is_member_of_team(organization_id, season, team))
  );

drop policy if exists "voir un partido según su cercle de partage" on public.matches;
create policy "les membres voient les matchs de leur equipe"
  on public.matches for select to authenticated
  using (
    public.is_platform_controller()
    or (visibility = 'private' and created_by = auth.uid())
    or (visibility = 'team' and public.is_member_of_team(organization_id, season, team))
    or (visibility = 'association' and (public.is_member_of(organization_id) or public.shares_association_with(organization_id)))
  );

drop policy if exists "voir un entrenamiento según su cercle de partage" on public.trainings;
create policy "les membres voient les entrainements de leur equipe"
  on public.trainings for select to authenticated
  using (
    public.is_platform_controller()
    or (visibility = 'private' and created_by = auth.uid())
    or (visibility = 'team' and public.is_member_of_team(organization_id, season, team))
    or (visibility = 'association' and (public.is_member_of(organization_id) or public.shares_association_with(organization_id)))
  );

-- NOTE : exercises et plays ne changent pas -- pas de saison/équipe sur
-- ces tables (contenu du club en général, pas d'une équipe précise).
