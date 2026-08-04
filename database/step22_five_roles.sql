-- =============================================================================
-- Pivot Cloud — Étape 22 : les 5 rôles réels
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Les 5 rôles décidés avec Daniel :
--   1. Platform admin (is_platform_controller, "toi" + qui tu ajoutes) --
--      peut TOUT faire, dans N'IMPORTE QUEL club : changer les rôles,
--      éditer le roster, etc. Avant cette étape, il pouvait seulement
--      VOIR et bloquer des comptes/clubes -- pas éditer leur contenu ni
--      changer qui a quel rôle. Ça change ici.
--   2. Team admin (role = 'admin') -- gère tout dans SON club, jamais
--      dans un autre. Inchangé.
--   3. Coach (role = 'coach') -- crée/édite du contenu. Inchangé.
--   4. Assistant (role = 'assistant') -- crée/édite du contenu, mais ne
--      peut RIEN supprimer. NOUVEAU : avant, assistant = coach, aucune
--      différence réelle.
--   5. Viewer (role = 'viewer') -- regarde seulement. Inchangé.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. can_edit_content inclut maintenant le platform admin -- avant, il
--    pouvait voir le roster/les exercices/etc. de n'importe quel club,
--    mais pas les modifier. Comme cette fonction est utilisée PARTOUT
--    (roster, exercises, plays, matches, trainings, assessments), ce
--    seul changement lui donne le pouvoir d'éditer n'importe quoi,
--    n'importe où.
-- -----------------------------------------------------------------------------
create or replace function public.can_edit_content(org_id uuid)
returns boolean as $$
  select public.is_platform_controller() or exists (
    select 1 from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('admin', 'coach', 'assistant')
  );
$$ language sql security definer stable;

-- -----------------------------------------------------------------------------
-- 2. Nouvelle fonction : qui peut SUPPRIMER (pas juste créer/éditer).
--    Un assistant peut ajouter et modifier, mais jamais supprimer -- ni
--    une jugada, ni un exercice, ni un joueur du roster, etc.
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 3. Remplace chaque règle "delete" qui utilisait can_edit_content par
--    can_delete_content -- sur toutes les tables de contenu.
-- -----------------------------------------------------------------------------
drop policy if exists "coaches remove players from their club" on public.players;
create policy "seuls admin/coach/platform admin suppriment un joueur"
  on public.players for delete to authenticated
  using (public.can_delete_content(organization_id));

drop policy if exists "coaches remove their club's plays" on public.plays;
create policy "seuls admin/coach/platform admin suppriment une jugada"
  on public.plays for delete to authenticated
  using (public.can_delete_content(organization_id));

drop policy if exists "coaches remove their club's matches" on public.matches;
create policy "seuls admin/coach/platform admin suppriment un partido"
  on public.matches for delete to authenticated
  using (public.can_delete_content(organization_id));

drop policy if exists "coaches remove match stats" on public.match_player_stats;
create policy "seuls admin/coach/platform admin suppriment des stats"
  on public.match_player_stats for delete to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id and public.can_delete_content(m.organization_id)));

drop policy if exists "coaches remove their club's trainings" on public.trainings;
create policy "seuls admin/coach/platform admin suppriment un entrenamiento"
  on public.trainings for delete to authenticated
  using (public.can_delete_content(organization_id));

-- training_exercises / training_attendance avaient une seule règle "for
-- all" -- on la sépare : select/insert/update restent ouverts à
-- can_edit_content, delete passe par can_delete_content.
drop policy if exists "coaches manage training exercises" on public.training_exercises;
create policy "voir/ajouter/modifier les exercices d'un entrenamiento"
  on public.training_exercises for select to authenticated
  using (exists (select 1 from public.trainings t where t.id = training_id and (public.is_member_of(t.organization_id) or public.is_platform_controller())));
create policy "ajouter un exercice à un entrenamiento"
  on public.training_exercises for insert to authenticated
  with check (exists (select 1 from public.trainings t where t.id = training_id and public.can_edit_content(t.organization_id)));
create policy "modifier un exercice d'un entrenamiento"
  on public.training_exercises for update to authenticated
  using (exists (select 1 from public.trainings t where t.id = training_id and public.can_edit_content(t.organization_id)))
  with check (exists (select 1 from public.trainings t where t.id = training_id and public.can_edit_content(t.organization_id)));
create policy "seuls admin/coach/platform admin suppriment un exercice d'entrenamiento"
  on public.training_exercises for delete to authenticated
  using (exists (select 1 from public.trainings t where t.id = training_id and public.can_delete_content(t.organization_id)));

drop policy if exists "coaches manage training attendance" on public.training_attendance;
create policy "voir/ajouter/modifier l'attendance"
  on public.training_attendance for select to authenticated
  using (exists (select 1 from public.trainings t where t.id = training_id and (public.is_member_of(t.organization_id) or public.is_platform_controller())));
create policy "ajouter une ligne d'attendance"
  on public.training_attendance for insert to authenticated
  with check (exists (select 1 from public.trainings t where t.id = training_id and public.can_edit_content(t.organization_id)));
create policy "modifier une ligne d'attendance"
  on public.training_attendance for update to authenticated
  using (exists (select 1 from public.trainings t where t.id = training_id and public.can_edit_content(t.organization_id)))
  with check (exists (select 1 from public.trainings t where t.id = training_id and public.can_edit_content(t.organization_id)));
create policy "seuls admin/coach/platform admin suppriment l'attendance"
  on public.training_attendance for delete to authenticated
  using (exists (select 1 from public.trainings t where t.id = training_id and public.can_delete_content(t.organization_id)));

drop policy if exists "coaches remove their club's assessments" on public.player_assessments;
create policy "seuls admin/coach/platform admin suppriment una evaluación"
  on public.player_assessments for delete to authenticated
  using (public.can_delete_content(organization_id));

drop policy if exists "coaches remove their own club's exercises" on public.exercises;
create policy "seuls admin/coach/platform admin suppriment un ejercicio"
  on public.exercises for delete to authenticated
  using (public.can_delete_content(organization_id));

-- -----------------------------------------------------------------------------
-- 4. Le platform admin peut maintenant gérer les membres/rôles de
--    N'IMPORTE QUEL club (avant : seulement voir, jamais changer un
--    rôle ni approuver quelqu'un ailleurs que dans son cercle
--    d'associations).
-- -----------------------------------------------------------------------------
drop policy if exists "un admin gère les membres de son club" on public.memberships;
create policy "un admin de club ou le platform admin gère les membres"
  on public.memberships for all
  to authenticated
  using (
    public.is_platform_controller()
    or exists (
      select 1 from public.memberships m
      where m.organization_id = memberships.organization_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
        and m.status = 'active'
    )
  )
  with check (
    public.is_platform_controller()
    or exists (
      select 1 from public.memberships m
      where m.organization_id = memberships.organization_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
        and m.status = 'active'
    )
  );

-- -----------------------------------------------------------------------------
-- Note : le trigger "jamais retirer le dernier admin actif d'un club"
-- (step7) continue de s'appliquer tel quel, y compris quand c'est le
-- platform admin qui fait le changement -- une bonne chose : même toi,
-- tu ne dois pas pouvoir laisser un club sans aucun admin par erreur.
-- =============================================================================
