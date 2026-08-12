-- =============================================================================
-- Pivot Cloud — Étape 47 : un vrai registre d'acceptation des termes
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Une seule colonne "terms_accepted_at" (étape 45) suffisait pour savoir
-- SI quelqu'un avait accepté -- mais pas QUELLE VERSION, et l'écrasait
-- à chaque connexion sans garder d'historique. La pratique standard
-- (clickwrap, pas browsewrap) est de garder un vrai journal : qui, quand,
-- quelle version exacte du document -- l'équivalent le plus proche d'un
-- contrat signé et daté.
-- =============================================================================

create table if not exists public.terms_acceptances (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  terms_version text not null,
  accepted_at  timestamptz not null default now()
);

comment on table public.terms_acceptances is
  'Journal de chaque acceptation des Terms of Service -- une ligne par événement, jamais écrasée. La date la plus récente pour un user_id donné est "la" version actuellement acceptée par cette personne.';

alter table public.terms_acceptances enable row level security;

create policy "chacun voit son propre historique d'acceptation"
  on public.terms_acceptances for select to authenticated
  using (user_id = auth.uid() or public.is_platform_controller());
create policy "chacun peut enregistrer sa propre acceptation"
  on public.terms_acceptances for insert to authenticated
  with check (user_id = auth.uid());

-- Rien n'empêche de garder terms_accepted_at (étape 45) en plus, en
-- "dernière acceptation en cache" pour un affichage rapide -- mais la
-- vraie source de vérité, c'est cette table désormais.
