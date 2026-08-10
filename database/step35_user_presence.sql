-- =============================================================================
-- Pivot Cloud — Étape 35 : combien d'utilisateurs, combien sont en ligne
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- "En ligne" n'existe pas tout seul dans Postgres -- il faut qu'un
-- utilisateur donne régulièrement signe de vie. On ajoute une colonne
-- last_seen, mise à jour depuis le dashboard toutes les minutes tant
-- que la page reste ouverte -- "en ligne" veut dire "vu il y a moins de
-- 3 minutes".
-- =============================================================================

alter table public.profiles add column if not exists last_seen timestamptz;

comment on column public.profiles.last_seen is
  'Dernier "signe de vie" envoyé depuis le dashboard -- sert à estimer qui est en ligne (vu il y a moins de 3 minutes).';

-- Pas besoin d'une nouvelle policy : "update own profile" (déjà en
-- place depuis le tout début) couvre déjà la mise à jour de n'importe
-- quelle colonne de sa propre ligne, celle-ci y compris.
