-- =============================================================================
-- PlayPivot — Étape 54 : un admin scopé à une équipe ne gère QUE cette
-- équipe, pas tout le club
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Jusqu'ici, is_admin_of() donnait accès à TOUTES les adhésions du club,
-- même pour un admin scopé (étape 53) à une seule équipe -- la portée
-- s'appliquait à la lecture des jugadores/partidos/entrenamientos, mais
-- pas à la gestion des membres eux-mêmes. Cette étape corrige ça.
--
-- Comme pour le bug corrigé à l'étape 29 : la vérification vit dans une
-- fonction SECURITY DEFINER (pas une sous-requête directe dans la
-- policy), sinon la requête interne se retrouve soumise à la même
-- policy qu'elle est en train d'évaluer -- boucle infinie.
-- =============================================================================

create or replace function public.can_manage_membership_row(target_org_id uuid, target_team_season text, target_team_name text)
returns boolean as $$
  select
    public.is_platform_controller()
    or exists (
      select 1 from public.memberships m
      where m.organization_id = target_org_id
        and m.user_id = auth.uid()
        and m.status = 'active'
        and m.role = 'admin'
        and (
          (m.team_season is null and m.team_name is null)  -- admin de tout le club : gère tout le monde
          or (m.team_season = target_team_season and m.team_name = target_team_name)  -- admin scopé : seulement sa propre équipe
        )
    );
$$ language sql security definer stable;

drop policy if exists "un admin de club ou le platform admin gère les membres" on public.memberships;
create policy "un admin gere seulement sa portee (club entier ou son equipe)"
  on public.memberships for all
  to authenticated
  using (public.can_manage_membership_row(organization_id, team_season, team_name))
  with check (public.can_manage_membership_row(organization_id, team_season, team_name));
