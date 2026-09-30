-- =============================================================================
-- Pivot Cloud — Étape 86 : cotisation payée, par joueur
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Demandé par Dani, roster: une case à cocher par joueur, comme "Active" ou
-- "Ready" (has_license) déjà en place -- pour savoir d'un coup d'œil qui a
-- payé sa cotisation cette saison. Import Excel : reconnaît aussi une
-- colonne "Cotisation"/"Coti" avec des valeurs oui/non (voir roster.html).
-- =============================================================================

alter table public.players add column if not exists dues_paid boolean not null default false;

comment on column public.players.dues_paid is
  'Cotisation payée pour la saison en cours -- simple case à cocher, pas de montant ni de date derrière (volontairement, pour rester simple).';
