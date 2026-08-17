-- =============================================================================
-- PlayPivot — Étape 55 : réduire à 3 niveaux (Platform admin, Team admin, Coach)
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Assistant, Player et Viewer sont retirés PARTOUT -- plus seulement de
-- l'interface (déjà fait), mais du type de donnée lui-même. Après ce
-- script, il devient physiquement impossible d'attribuer un de ces 3
-- rôles à qui que ce soit : la base de données ne les connaît plus.
--
-- Sûr à exécuter : personne n'utilise encore ces rôles (vérifié avec
-- Daniel avant d'écrire ce script). Le bloc de sécurité juste en dessous
-- s'arrête avec une erreur si jamais ce n'était plus vrai, plutôt que de
-- casser silencieusement des comptes existants.
--
-- Trouvé en vérifiant TOUTES les politiques actives (reconstruction
-- complète de leur historique, pas juste une recherche à l'œil) : trois
-- d'entre elles dépendent de memberships.role, sur trois tables
-- différentes. Postgres refuse de changer le type d'une colonne tant
-- qu'une seule politique en dépend encore -- même avec ::text, même sur
-- une autre table -- donc les trois sont retirées AVANT le changement de
-- type, puis remises (deux) ou volontairement pas remises (une, devenue
-- inutile) juste après.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------
-- 0. Garde-fou : on n'avance que si AUCUNE adhésion n'a un rôle autre
--    qu'admin/coach. Si quelqu'un a été créé avec assistant/player/viewer
--    entre-temps, ce script s'arrête ici avec une erreur claire, sans
--    rien avoir touché.
-- -----------------------------------------------------------------------
do $$
declare
  leftover_count int;
begin
  select count(*) into leftover_count
  from public.memberships
  where role::text not in ('admin', 'coach');

  if leftover_count > 0 then
    raise exception 'STOP: % adhésion(s) utilisent encore un rôle autre qu''admin/coach. Résous-les avant de relancer ce script (voir la requête de vérification dans le message de Claude).', leftover_count;
  end if;
end $$;

-- -----------------------------------------------------------------------
-- 1. Retirer les 3 politiques qui dépendent de memberships.role, avant
--    de toucher au type. On les remet (ou pas) après.
-- -----------------------------------------------------------------------
drop policy if exists "un admin de club demande à rejoindre pour son club" on public.club_association_members;
drop policy if exists "anyone can request to join a club (never directly as admin)" on public.memberships;
drop policy if exists "un joueur voit sa propre évaluation" on public.player_assessments;

-- -----------------------------------------------------------------------
-- 2. Le type lui-même : on passe de 5 valeurs possibles à 2. Postgres ne
--    permet pas de retirer une valeur d'un enum directement -- on crée un
--    nouveau type, on bascule la colonne dessus, on supprime l'ancien.
-- -----------------------------------------------------------------------
-- Por si un intento anterior falló a medias y dejó este tipo ya creado.
drop type if exists public.member_role_new;
create type public.member_role_new as enum ('admin', 'coach');

-- Postgres n'arrive pas à convertir tout seul le DEFAULT existant
-- ('coach', sur l'ancien type) vers le nouveau type -- on l'enlève avant
-- le changement de type, on le remet juste après avec le nouveau type.
alter table public.memberships alter column role drop default;

alter table public.memberships
  alter column role type public.member_role_new
  using role::text::public.member_role_new;

alter table public.memberships alter column role set default 'coach'::public.member_role_new;

drop type public.member_role;
alter type public.member_role_new rename to member_role;

comment on type public.member_role is
  'admin (team admin, gère tout dans son club) / coach (crée/édite du contenu). Platform admin est un flag à part (profiles.is_platform_controller), pas une valeur de cet enum. Assistant/Player/Viewer ont existé, retirés le 2026-08-17 -- personne ne les utilisait.';

-- -----------------------------------------------------------------------
-- 3. Remettre les 2 politiques qui gardent un sens, à l'identique --
--    sauf la demande d'adhésion, alignée sur "coach" uniquement (déjà
--    fait côté interface). La 3e (évaluation vue par son propre compte
--    joueur) n'est PAS remise : plus aucun compte ne peut avoir le rôle
--    "player", donc elle ne servirait plus jamais à rien.
-- -----------------------------------------------------------------------
create policy "un admin de club demande à rejoindre pour son club"
  on public.club_association_members for insert
  with check (
    requested_by = auth.uid()
    and exists (
      select 1 from public.memberships m
      where m.organization_id = club_association_members.organization_id
        and m.user_id = auth.uid() and m.role = 'admin' and m.status = 'active'
    )
  );

create policy "anyone can request to join a club (never directly as admin)"
  on public.memberships for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and role = 'coach'
  );

-- -----------------------------------------------------------------------
-- 4. can_edit_content référençait explicitement 'assistant' -- sans ça,
--    n'importe quel appel à cette fonction aurait échoué (Postgres
--    n'aurait plus pu convertir la chaîne 'assistant' vers le nouvel
--    enum, qui ne la connaît plus).
-- -----------------------------------------------------------------------
create or replace function public.can_edit_content(org_id uuid)
returns boolean as $$
  select public.is_platform_controller() or exists (
    select 1 from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('admin', 'coach')
  );
$$ language sql security definer stable;

-- can_delete_content ne changeait déjà que pour admin/coach -- rien à
-- faire, mais on la re-déclare quand même pour que ce fichier soit une
-- photo complète et autosuffisante de l'état final.
create or replace function public.can_delete_content(org_id uuid)
returns boolean as $$
  select public.is_platform_controller() or exists (
    select 1 from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('admin', 'coach')
  );
$$ language sql security definer stable;

-- -----------------------------------------------------------------------
-- 5. is_member_of_team / is_staff_member_of_team (étape 53) comparaient
--    m.role directement à 'player' SANS conversion en texte -- celles-là
--    auraient carrément fait planter roster/matchs/entraînements avec
--    une erreur Postgres à chaque appel, une fois 'player' retiré de
--    l'enum. On les simplifie : plus de joueurs = plus besoin de ce cas
--    particulier, admin et coach voient toujours tout leur club/équipe.
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
          (m.team_season is null and m.team_name is null)
          or (m.team_season = p_season and m.team_name = p_team)
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
        and (
          (m.team_season is null and m.team_name is null)
          or (m.team_season = p_season and m.team_name = p_team)
        )
    );
$$ language sql security definer stable;

-- -----------------------------------------------------------------------
-- 6. is_staff_member_of / is_player_of (étape 37) comparaient déjà via
--    role::text, donc pas de risque d'erreur -- mais autant les rendre
--    honnêtes plutôt que de laisser du code mort qui teste un cas qui ne
--    peut plus jamais arriver.
-- -----------------------------------------------------------------------
create or replace function public.is_staff_member_of(org_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$ language sql security definer stable;

create or replace function public.is_player_of(org_id uuid)
returns boolean as $$
  select false;
$$ language sql security definer stable;

commit;

-- =============================================================================
-- NOTE : les colonnes memberships.linked_player_id et plays.visible_to_players
-- (créées pour le rôle "player") restent en base, inutilisées -- inoffensif,
-- pas la peine de les supprimer pour l'instant.
-- =============================================================================
