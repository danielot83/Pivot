-- =============================================================================
-- PlayPivot — Step 56: let the platform admin delete team-scoped data from
-- ANY club, not just clubs they're personally an active member of
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- The new "🗑️ Delete data…" popup in Dashboard → Admin general lets Daniel
-- (platform admin) delete players/matches/trainings/plays for a specific
-- team, from any club on the platform. But the existing DELETE policies on
-- these tables only check can_edit_content(organization_id) — active
-- membership (admin/coach/assistant) in THAT club. Daniel isn't a member of
-- every club, so without this step the popup fails with a permissions
-- error on any club he doesn't personally coach.
--
-- "organizations" already does this correctly (its UPDATE policy checks
-- is_platform_controller() — that's why "Remove whole team" already works
-- platform-wide). This step brings players/matches/trainings/plays/teams
-- in line with that same pattern.
-- =============================================================================

drop policy if exists "coaches delete their club's players" on public.players;
create policy "coaches delete their club's players"
  on public.players for delete
  to authenticated
  using (public.can_edit_content(organization_id) or public.is_platform_controller());

drop policy if exists "coaches delete their club's matches" on public.matches;
create policy "coaches delete their club's matches"
  on public.matches for delete
  to authenticated
  using (public.can_edit_content(organization_id) or public.is_platform_controller());

drop policy if exists "coaches delete their club's trainings" on public.trainings;
create policy "coaches delete their club's trainings"
  on public.trainings for delete
  to authenticated
  using (public.can_edit_content(organization_id) or public.is_platform_controller());

drop policy if exists "coaches delete their club's plays" on public.plays;
create policy "coaches delete their club's plays"
  on public.plays for delete
  to authenticated
  using (public.can_edit_content(organization_id) or public.is_platform_controller());

drop policy if exists "admin/coach suppriment une équipe de leur club" on public.teams;
create policy "admin/coach suppriment une équipe de leur club"
  on public.teams for delete
  to authenticated
  using (public.can_delete_content(organization_id) or public.is_platform_controller());

-- Nota: los nombres de policy de arriba (players/matches/trainings/plays)
-- son mi mejor suposición basada en el patrón del resto del proyecto --
-- "drop policy if exists" no falla si el nombre no coincide exactamente,
-- así que en el peor caso esto simplemente CREA la policy correcta sin
-- borrar una vieja con otro nombre. Si eso pasara, tendrías dos policies
-- de delete en la misma tabla (no rompe nada -- Postgres las combina con
-- OR -- pero conviene limpiar la duplicada a mano desde el dashboard de
-- Supabase si la ves).
