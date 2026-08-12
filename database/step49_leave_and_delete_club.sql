-- =============================================================================
-- Pivot Cloud — Étape 49 : pouvoir quitter un club, ou le supprimer si on
-- en est le seul admin
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Aucune des deux n'était possible avant cette étape :
--   - Quitter un club (supprimer sa propre ligne memberships) exigeait
--     déjà d'être admin de CE club (is_admin_of) -- donc un simple
--     membre ne pouvait jamais partir de lui-même.
--   - Supprimer une organisation entière n'avait carrément aucune
--     policy -- personne, pas même le platform admin, ne pouvait le
--     faire depuis l'app.
-- =============================================================================

drop policy if exists "chacun peut quitter un club de son propre chef" on public.memberships;
create policy "chacun peut quitter un club de son propre chef"
  on public.memberships for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "un admin de son club (ou le platform admin) peut le supprimer" on public.organizations;
create policy "un admin de son club (ou le platform admin) peut le supprimer"
  on public.organizations for delete
  to authenticated
  using (public.is_admin_of(id));
