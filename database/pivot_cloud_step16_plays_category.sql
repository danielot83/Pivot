-- =============================================================================
-- Pivot Cloud — Play design: add a category column
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Lets plays be grouped by category (e.g. "Half-court offense", "Out of
-- bounds", "Press break") within a season/team, matching the new
-- playbook grouping in play_design.html.
-- =============================================================================

alter table public.plays add column if not exists category text;

-- =============================================================================
-- Done.
-- =============================================================================
