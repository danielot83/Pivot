-- =============================================================================
-- Pivot Cloud — Étape 39 : message de bienvenue à la toute première connexion
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.

alter table public.profiles add column if not exists onboarded_at timestamptz;

comment on column public.profiles.onboarded_at is
  'Rempli la première fois que la personne a fermé le message de bienvenue expliquant les cercles de partage. NULL = ne l''a jamais vu -- le dashboard le montre à nouveau à chaque connexion jusqu''à ce que ce soit rempli.';
