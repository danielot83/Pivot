-- =============================================================================
-- Pivot Cloud — Étape 29 : corrige deux bugs réels trouvés en test
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Bug 1 (grave) : la règle de l'étape 22 sur memberships se re-interroge
-- elle-même directement, exactement le même piège de récursion déjà
-- documenté et corrigé au tout début du projet -- j'ai refait la même
-- erreur en l'écrivant. Ça cassait TOUTE lecture de memberships (erreur
-- 500), donc tout le dashboard.
--
-- Bug 2 : messages.sender_id/recipient_id pointaient vers auth.users,
-- une table que PostgREST n'expose pas pour "embedder" -- impossible de
-- récupérer le nom (full_name) de qui a écrit. Comme profiles.id est
-- toujours égal à auth.users.id (1 pour 1), on peut pointer directement
-- vers profiles à la place, sans rien changer aux données.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Bug 1 : remplace la requête directe par is_admin_of(), qui existe
-- justement pour éviter ce piège (et qui, depuis l'étape 24, inclut déjà
-- le platform admin -- pas besoin de le répéter ici).
-- -----------------------------------------------------------------------------
drop policy if exists "un admin de club ou le platform admin gère les membres" on public.memberships;
create policy "un admin de club ou le platform admin gère les membres"
  on public.memberships for all
  to authenticated
  using (public.is_admin_of(organization_id))
  with check (public.is_admin_of(organization_id));

-- -----------------------------------------------------------------------------
-- Bug 2 : sender_id / recipient_id pointent vers profiles, pas auth.users
-- -----------------------------------------------------------------------------
alter table public.messages drop constraint if exists messages_sender_id_fkey;
alter table public.messages drop constraint if exists messages_recipient_id_fkey;

alter table public.messages
  add constraint messages_sender_id_fkey foreign key (sender_id) references public.profiles(id) on delete cascade;
alter table public.messages
  add constraint messages_recipient_id_fkey foreign key (recipient_id) references public.profiles(id) on delete cascade;
