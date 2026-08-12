-- =============================================================================
-- Pivot Cloud — Étape 45 : garder une trace de quand les termes ont été
-- acceptés
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- La case à cocher à l'inscription (étape précédente) obligeait déjà à
-- accepter avant de créer un compte -- mais rien n'enregistrait QUAND.
-- Cette étape ajoute cette date, pour pouvoir la montrer dans le
-- dashboard ("tu as accepté ça le...").
-- =============================================================================

alter table public.profiles add column if not exists terms_accepted_at timestamptz;

comment on column public.profiles.terms_accepted_at is
  'Quand la personne a coché "J''ai lu et j''accepte" à l''inscription. NULL pour les comptes créés avant cette étape.';
