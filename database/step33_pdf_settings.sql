-- =============================================================================
-- Pivot Cloud — Étape 33 : sections du PDF configurables par club
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Chaque club peut décider quelles sections apparaissent sur la fiche
-- PDF d'un exercice (ex: "je n'aime pas la difficulté, je l'enlève").
-- Tout est activé par défaut, pour ne rien changer pour personne tant
-- qu'ils n'ont pas touché ce réglage.
-- =============================================================================

alter table public.organizations
  add column if not exists pdf_sections jsonb not null default '{"age": true, "categories": true, "material": true, "objectives": true, "difficulty": true}'::jsonb;

comment on column public.organizations.pdf_sections is
  'Quelles sections du PDF d''exercice ce club veut voir -- age/categories/material/objectives/difficulty, chacune true/false.';
