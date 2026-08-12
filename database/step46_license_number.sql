-- =============================================================================
-- Pivot Cloud — Étape 46 : le numéro de licence revient (sans document)
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Étape 43 avait retiré la licence entièrement (numéro + scan du
-- document). En y repensant : le numéro seul, sans le document derrière,
-- est une simple référence interne -- pas plus sensible qu'un numéro de
-- maillot. Il revient, sous un autre nom pour ne pas se mélanger avec
-- l'ancienne colonne "license" (qui n'existe plus). Le document scanné,
-- lui, reste supprimé -- c'était ça la vraie donnée sensible.
-- =============================================================================

alter table public.players add column if not exists license_number text;

comment on column public.players.license_number is
  'Juste le numéro (référence interne du club/fédération) -- jamais de document ni de scan derrière, volontairement.';
