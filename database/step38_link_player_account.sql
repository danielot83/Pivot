-- =============================================================================
-- Pivot Cloud — Étape 38 : relier un compte "player" à sa fiche du roster
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- L'étape 37 a créé le rôle "player", mais rien ne relie ce compte à SA
-- fiche dans le roster -- impossible de savoir "je suis quel joueur",
-- donc impossible de lui montrer sa propre évaluation par exemple.
-- Cette étape ajoute ce lien, à faire à la main par un admin/coach
-- (jamais par le joueur lui-même).
-- =============================================================================

alter table public.memberships add column if not exists linked_player_id uuid references public.players(id) on delete set null;

comment on column public.memberships.linked_player_id is
  'Pour un membre de rôle "player" : quelle fiche du roster est la sienne. Choisi par un admin/coach, jamais par le joueur lui-même.';

-- Un compte joueur peut voir SA PROPRE évaluation, même si elle est
-- marquée "mon équipe" (donc normalement bloquée pour un rôle player
-- depuis l'étape 37) -- mais seulement la sienne, jamais celle d'un
-- autre joueur.
drop policy if exists "un joueur voit sa propre évaluation" on public.player_assessments;
create policy "un joueur voit sa propre évaluation"
  on public.player_assessments for select to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.organization_id = player_assessments.organization_id
        and m.user_id = auth.uid()
        and m.status = 'active'
        and m.role::text = 'player'
        and m.linked_player_id = player_assessments.player_id
    )
  );

-- Seul un admin de club (ou toi, contrôleur de plateforme) peut faire ce
-- lien -- le joueur ne peut jamais se l'attribuer lui-même. Déjà couvert
-- par la règle "un admin de club ou le platform admin gère les membres"
-- (étape 22/29), qui autorise déjà is_admin_of(organization_id) à
-- modifier n'importe quelle colonne d'une ligne memberships de son club.
