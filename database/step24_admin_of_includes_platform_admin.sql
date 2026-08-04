-- =============================================================================
-- Pivot Cloud — Étape 24 : is_admin_of() doit inclure le platform admin
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Oubli trouvé pendant la revue de sécurité : is_admin_of() (utilisée
-- pour uploader/remplacer le LOGO d'un club) ne tenait pas compte du
-- platform admin -- alors que le modèle des 5 rôles dit clairement que
-- le platform admin doit pouvoir tout faire, dans n'importe quel club.
-- Un seul changement ici corrige aussi le logo, puisque c'est la seule
-- fonction qui s'en sert.
-- =============================================================================

create or replace function public.is_admin_of(org_id uuid)
returns boolean as $$
  select public.is_platform_controller() or exists (
    select 1 from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.role = 'admin'
      and m.status = 'active'
  );
$$ language sql security definer stable;
