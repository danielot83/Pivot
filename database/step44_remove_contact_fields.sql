-- =============================================================================
-- Pivot Cloud — Étape 44 : retirer numéro AVS, téléphone et email du roster
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Suite logique de l'étape 43 : moins de données de contact/identifiantes
-- stockées sur un mineur, moins de risque. Le numéro AVS en particulier
-- (l'équivalent suisse d'un numéro de sécurité sociale) n'avait aucune
-- raison d'être dans une app de gestion d'équipe.
-- =============================================================================

alter table public.players drop column if exists avs_number;
alter table public.players drop column if exists phone;
alter table public.players drop column if exists email;
