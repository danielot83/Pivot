-- =============================================================================
-- Pivot Cloud — Étape 32 : corrige un oubli de l'étape 31
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- En créant les traductions françaises (étape 31), j'ai copié les
-- catégories/matériel/âge de la version anglaise, mais j'ai OUBLIÉ de
-- copier le diagramme -- les fiches françaises se sont retrouvées avec
-- un diagramme vide, même quand l'originale anglaise en a un vrai
-- (ex: "King of the dribble", "The pirates"). Cette étape copie le
-- diagramme manquant, sans toucher à rien d'autre.
-- =============================================================================

update public.exercises fr
set diagram = en.diagram
from public.exercises en
where fr.language = 'fr'
  and en.language = 'en'
  and fr.translation_group_id = en.translation_group_id
  and (fr.diagram is null or fr.diagram = '{}'::jsonb)
  and en.diagram is not null and en.diagram <> '{}'::jsonb;
