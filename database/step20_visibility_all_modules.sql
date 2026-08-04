-- =============================================================================
-- Pivot Cloud — Étape 20 : les 4 cercles de partage sur TOUS les modules
-- (sauf roster, qui reste à part -- décision de Daniel)
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
-- Requiere haber aplicado antes step18 (asociaciones) y step19 (ejercicios,
-- primer módulo con este mismo patrón).
--
-- Mismo patrón que step19, repetido en 4 tablas: plays, matches,
-- trainings, player_assessments. Todo lo ya existente se queda en 'team'
-- (el comportamiento actual, nada cambia para nadie hasta que alguien
-- elija otra cosa).
--
-- Aviso (no bloqueante, solo para que quede escrito): matches y
-- player_assessments contienen datos reales de jugadores concretos
-- (nombres, estadísticas, valoraciones) -- compartirlos fuera del propio
-- club es una decisión distinta a compartir una jugada o un ejercicio
-- genérico. Se construye igual en los 4 módulos, tal como se pidió.
-- =============================================================================

do $$
declare
  tbl text;
begin
  foreach tbl in array array['plays', 'matches', 'trainings', 'player_assessments']
  loop
    execute format('alter table public.%I add column if not exists visibility text not null default ''team''', tbl);
    execute format('alter table public.%I add constraint %I check (visibility in (''private'', ''team'', ''association'', ''community''))', tbl, tbl || '_visibility_check');
    execute format('alter table public.%I add column if not exists created_by uuid references auth.users(id) default auth.uid()', tbl);
  end loop;
end $$;

comment on column public.plays.visibility is
  'Le cercle de partage : private (moi seul), team (mon club), association (un groupe de clubes approuvé), community (tout Pivot).';
comment on column public.matches.visibility is
  'Le cercle de partage. Attention : une ligne "matches" contient des statistiques de vrais joueurs.';
comment on column public.trainings.visibility is
  'Le cercle de partage : private (moi seul), team (mon club), association (un groupe de clubes approuvé), community (tout Pivot).';
comment on column public.player_assessments.visibility is
  'Le cercle de partage. Attention : une ligne "player_assessments" contient l''évaluation d''un vrai joueur.';

-- -----------------------------------------------------------------------------
-- Remplace chaque règle "voir" existante (juste is_member_of) par les 4
-- cercles réels -- sinon 'private'/'association'/'community' resteraient
-- de simples étiquettes sans rien changer côté base de données.
-- -----------------------------------------------------------------------------

drop policy if exists "club members see their club's plays" on public.plays;
create policy "voir une jugada según son cercle de partage"
  on public.plays for select to authenticated
  using (
    public.is_platform_controller()
    or (visibility = 'private' and created_by = auth.uid())
    or (visibility = 'team' and public.is_member_of(organization_id))
    or (visibility = 'association' and (public.is_member_of(organization_id) or public.shares_association_with(organization_id)))
    or (visibility = 'community')
  );

drop policy if exists "club members see their club's matches" on public.matches;
create policy "voir un partido según su cercle de partage"
  on public.matches for select to authenticated
  using (
    public.is_platform_controller()
    or (visibility = 'private' and created_by = auth.uid())
    or (visibility = 'team' and public.is_member_of(organization_id))
    or (visibility = 'association' and (public.is_member_of(organization_id) or public.shares_association_with(organization_id)))
    or (visibility = 'community')
  );

drop policy if exists "club members see their club's trainings" on public.trainings;
create policy "voir un entrenamiento según su cercle de partage"
  on public.trainings for select to authenticated
  using (
    public.is_platform_controller()
    or (visibility = 'private' and created_by = auth.uid())
    or (visibility = 'team' and public.is_member_of(organization_id))
    or (visibility = 'association' and (public.is_member_of(organization_id) or public.shares_association_with(organization_id)))
    or (visibility = 'community')
  );

drop policy if exists "club members see their club's assessments" on public.player_assessments;
create policy "voir una evaluación según su cercle de partage"
  on public.player_assessments for select to authenticated
  using (
    public.is_platform_controller()
    or (visibility = 'private' and created_by = auth.uid())
    or (visibility = 'team' and public.is_member_of(organization_id))
    or (visibility = 'association' and (public.is_member_of(organization_id) or public.shares_association_with(organization_id)))
    or (visibility = 'community')
  );

-- -----------------------------------------------------------------------------
-- Les tables "enfants" (match_player_stats, training_exercises,
-- training_attendance) héritent déjà leurs droits de la ligne parente
-- (matches / trainings) -- rien à changer là, la nouvelle règle de la
-- table parente s'applique automatiquement à travers le "exists (...)".
-- -----------------------------------------------------------------------------
