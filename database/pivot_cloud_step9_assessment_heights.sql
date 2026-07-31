-- =============================================================================
-- Pivot Cloud — Suivi: add height fields (missed in the original build)
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- The original desktop app tracked height_player / height_father /
-- height_mother (used to estimate a young player's likely adult height).
-- This got missed when player_assessments was first created — adding it
-- now, without touching any existing data.
-- =============================================================================

alter table public.player_assessments
  add column if not exists height_player text,
  add column if not exists height_father text,
  add column if not exists height_mother text;

-- =============================================================================
-- Done. Existing assessments keep working; these three columns start empty.
-- =============================================================================
