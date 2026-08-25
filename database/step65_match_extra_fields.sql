-- =============================================================================
-- Pivot Cloud — Étape 65 : nouveaux champs "fiche générale" du match
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- match.html se réorganise en deux colonnes (infos générales / colonnes de
-- stats) -- côté infos générales, en plus de ce qui existait déjà (date,
-- adversaire, lieu, home/away, score), Dani a demandé un numéro de match
-- (comme le "# de séance" de Training builder), l'arbitre et le/la
-- entraîneur(e) référent(e) pour ce match. Trois simples colonnes texte/
-- numérique, rien de sensible, aucun changement de policy RLS nécessaire
-- (elles héritent des policies déjà en place sur toute la ligne).
-- =============================================================================

alter table public.matches add column if not exists match_number integer;
alter table public.matches add column if not exists referee text;
alter table public.matches add column if not exists coach text;

comment on column public.matches.match_number is
  'Numéro de match du club pour la saison/équipe -- même idée que "number" sur trainings, purement informatif.';
comment on column public.matches.referee is
  'Nom de l''arbitre (ou des arbitres) -- simple champ texte libre.';
comment on column public.matches.coach is
  'Qui coachait ce match-là -- distinct des coach1/coach2/coach3 de Training builder, un seul champ texte ici.';
