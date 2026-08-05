-- =============================================================================
-- Pivot Cloud — Étape 30 : numéro de version sur les exercices
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Comme dans l'app de bureau : chaque fois qu'un exercice DÉJÀ existant
-- est modifié, sa version avance (v1 à la création, v2 au premier
-- changement, etc.) -- utile pour repérer une fiche retouchée récemment
-- dans la bibliothèque, ou lors d'un import/export entre clubes.
-- =============================================================================

alter table public.exercises add column if not exists version integer not null default 1;

comment on column public.exercises.version is
  'Avance de 1 à chaque modification (jamais à la création). Purement informatif, ne bloque rien.';
