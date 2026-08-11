-- =============================================================================
-- Pivot Cloud — Étape 41 : catégorie d'équipe (U8, U10...) séparée de la
-- position du joueur
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- players.category existait déjà, mais représente la POSITION du joueur
-- (SG/PG/PF/C...) -- pas la catégorie d'âge de l'équipe. Cette étape
-- ajoute un champ séparé pour ça, pour pouvoir organiser l'arborescence
-- en Équipe → Catégorie (si elle existe) → Saison, au lieu de juste
-- Saison → Équipe.
-- =============================================================================

alter table public.players add column if not exists team_category text;

comment on column public.players.team_category is
  'Catégorie d''âge de l''équipe (U8, U10, Seniors...) -- pas la position du joueur (voir players.category). Facultatif : vide pour les clubes qui n''utilisent pas de tranches d''âge (ex: les Bulls).';
