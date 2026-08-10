-- =============================================================================
-- Pivot Cloud — Étape 37 : le rôle "player" (jugador)
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Jusqu'ici, tous les rôles supposaient que la personne connectée fait
-- partie du staff (admin/coach/assistant/viewer). Un vrai joueur n'avait
-- nulle part où exister -- et s'il avait rejoint le club avec n'importe
-- quel rôle existant, il aurait vu TOUT ce qui est marqué "mon équipe" :
-- évaluations d'autres joueurs, jugadas privées, etc.
--
-- Ce que fait cette étape :
--   1. Ajoute "player" comme rôle possible.
--   2. Un joueur ne peut jamais rien créer/modifier/supprimer (déjà
--      garanti : can_edit_content/can_delete_content listent
--      explicitement qui peut, "player" n'y est pas).
--   3. Un joueur NE voit PLUS automatiquement tout ce qui est "mon
--      équipe" pour les évaluations (données personnelles d'un autre
--      joueur -- ça ne doit jamais être diffusé en bloc) ni pour les
--      jugadas (dorénavant choisies une par une par l'entraîneur, avec
--      un nouvel interrupteur "Show to players").
--   4. Exercices/matchs/entraînements/roster restent comme avant --
--      voir la note à la fin de ce fichier.
--
-- IMPORTANT : ce fichier compare le rôle en le convertissant en texte
-- (role::text = 'player') plutôt que directement à la valeur d'enum,
-- exprès -- comparer à une valeur d'enum tout juste ajoutée dans la
-- même transaction fait échouer Postgres ("unsafe use of new value").
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Le rôle
-- -----------------------------------------------------------------------------
alter type public.member_role add value if not exists 'player';

comment on type public.member_role is
  'admin/coach/assistant/viewer : le staff, qui peuvent tout voir de leur club. player : un vrai joueur -- ne voit que ce qui lui est explicitement partagé (jamais tout "mon équipe" en bloc pour les données sensibles).';

-- -----------------------------------------------------------------------------
-- 2. Qui compte comme "staff" (pas un joueur) -- utilisé à la place de
--    is_member_of() partout où "mon équipe" ne doit PAS inclure
--    automatiquement les joueurs.
-- -----------------------------------------------------------------------------
create or replace function public.is_staff_member_of(org_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role::text <> 'player'
  );
$$ language sql security definer stable;

create or replace function public.is_player_of(org_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role::text = 'player'
  );
$$ language sql security definer stable;

-- -----------------------------------------------------------------------------
-- 3. Évaluations : "mon équipe" veut dire "le staff de mon équipe" --
--    jamais un joueur, même si l'évaluation concerne un autre joueur.
--    Une évaluation n'est jamais "partagée avec les joueurs" en bloc.
-- -----------------------------------------------------------------------------
drop policy if exists "voir una evaluación según su cercle de partage" on public.player_assessments;
create policy "voir una evaluación según su cercle de partage"
  on public.player_assessments for select to authenticated
  using (
    public.is_platform_controller()
    or (visibility = 'private' and created_by = auth.uid())
    or (visibility = 'team' and public.is_staff_member_of(organization_id))
    or (visibility = 'association' and (public.is_staff_member_of(organization_id) or public.shares_association_with(organization_id)))
    or (visibility = 'community')
  );

-- -----------------------------------------------------------------------------
-- 4. Jugadas : "mon équipe" veut dire le staff -- un joueur ne voit que
--    les jugadas où l'entraîneur a explicitement activé "Show to players".
-- -----------------------------------------------------------------------------
alter table public.plays add column if not exists visible_to_players boolean not null default false;
comment on column public.plays.visible_to_players is
  'Coché par l''entraîneur : cette jugada précise est montrée aux comptes joueur de ce club, quel que soit son cercle de partage pour le staff.';

drop policy if exists "voir una jugada según son cercle de partage" on public.plays;
create policy "voir una jugada según son cercle de partage"
  on public.plays for select to authenticated
  using (
    public.is_platform_controller()
    or (visibility = 'private' and created_by = auth.uid())
    or (visibility = 'team' and public.is_staff_member_of(organization_id))
    or (visibility = 'association' and (public.is_staff_member_of(organization_id) or public.shares_association_with(organization_id)))
    or (visibility = 'community')
    or (public.is_player_of(organization_id) and visible_to_players)
  );

-- =============================================================================
-- NOTE : exercices, partidos, entrenamientos et roster gardent encore
-- l'ancien comportement ("mon équipe" = is_member_of, joueurs compris)
-- -- volontairement, pas oublié. Pour beaucoup de clubes, que les
-- jugadores voient le calendrier des matchs/entraînements ou la
-- bibliothèque d'exercices n'est pas un problème, contrairement aux
-- évaluations et aux jugadas. Si tu veux verrouiller ça aussi de la
-- même manière, dis-le et on fait une étape 38 dédiée.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 5. Pouvoir demander à rejoindre un club EN TANT QUE joueur -- avant,
--    la règle qui autorise une demande "en attente" limitait
--    explicitement le rôle à coach/assistant/viewer. Deux anciennes
--    versions de cette règle existent encore (noms différents, même
--    effet) -- les deux sont corrigées, pour ne pas dépendre de
--    laquelle est vraiment active.
-- -----------------------------------------------------------------------------
drop policy if exists "anyone can request to join a club (never directly as admin)" on public.memberships;
drop policy if exists "n'importe qui peut demander à rejoindre un club (jamais comme admin)" on public.memberships;
create policy "anyone can request to join a club (never directly as admin)"
  on public.memberships for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and role::text in ('coach', 'assistant', 'viewer', 'player')
  );

