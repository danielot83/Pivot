-- =============================================================================
-- Pivot Cloud — Étape 19 : les 4 cercles de partage (exercises), et la
-- langue par défaut des exports PDF
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Les 4 cercles décidés avec Daniel, du plus grand au plus petit :
--   'community'   -- Pivot Community : tout le monde
--   'association'  -- une association de clubes (step18), demande + validation
--   'team'        -- mon équipe (mon club)
--   'private'     -- moi seul
--
-- Remplace l'ancien is_shared (oui/non) par ce choix à 4 niveaux. Tout ce
-- qui était partagé (is_shared = true) devient 'community' -- exactement
-- ce que "partagé avec tout Pivot" voulait déjà dire. Tout le reste
-- devient 'team' (le comportement par défaut d'avant).
--
-- Ce module (exercises) sert de premier essai réel avant de faire pareil
-- sur les autres (jugadas, entraînements...).
--
-- Requiere haber aplicado antes step18_club_associations.sql (usa su
-- función shares_association_with para el círculo "association").
-- =============================================================================

alter table public.exercises
  add column if not exists visibility text not null default 'team';

alter table public.exercises
  add constraint exercises_visibility_check
  check (visibility in ('private', 'team', 'association', 'community'));

update public.exercises set visibility = 'community' where is_shared = true;

comment on column public.exercises.visibility is
  'Le cercle de partage : private (moi seul), team (mon club), association (un groupe de clubes approuvé), community (tout Pivot). Remplace is_shared.';

-- Pour que 'private' (moi seul) veuille dire quelque chose de réel --
-- pas juste "mon club", mais "moi, la personne précise" -- il faut
-- savoir qui a créé chaque ligne. Se remplit automatiquement à la
-- création ; les lignes déjà existantes restent à NULL (sans
-- conséquence : elles sont toutes en 'team' par défaut, qui ne dépend
-- pas de created_by).
alter table public.exercises
  add column if not exists created_by uuid references auth.users(id) default auth.uid();

comment on column public.exercises.created_by is
  'Qui a créé cette ligne -- utilisé uniquement pour faire respecter le cercle "private" (moi seul).';

-- Remplace l'ancienne règle (juste is_shared = true) par les 4 cercles
-- réels -- sinon "private" et "association" resteraient juste des
-- étiquettes dans l'interface, sans rien empêcher vraiment côté base de
-- données.
drop policy if exists "see own or shared exercises" on public.exercises;
create policy "voir un exercice selon son cercle de partage"
  on public.exercises for select
  using (
    public.is_platform_controller()
    or (visibility = 'private' and created_by = auth.uid())
    or (visibility = 'team' and public.is_member_of(organization_id))
    or (visibility = 'association' and (public.is_member_of(organization_id) or public.shares_association_with(organization_id)))
    or (visibility = 'community')
  );

-- On garde is_shared pour l'instant (pour ne rien casser tant que
-- library.html/settings.html n'ont pas fini leur transition), mais on le
-- fait maintenant dépendre de visibility -- une seule vérité, pas deux
-- champs qui pourraient se contredire.
create or replace function public.sync_exercise_is_shared()
returns trigger as $$
begin
  new.is_shared := (new.visibility = 'community');
  return new;
end;
$$ language plpgsql;

drop trigger if exists sync_exercise_is_shared_trigger on public.exercises;
create trigger sync_exercise_is_shared_trigger
  before insert or update on public.exercises
  for each row execute function public.sync_exercise_is_shared();

-- -----------------------------------------------------------------------------
-- Idioma de exportación de PDF, por club (Settings → un desplegable)
-- -----------------------------------------------------------------------------
alter table public.organizations
  add column if not exists export_language text not null default 'en';

alter table public.organizations
  add constraint organizations_export_language_check
  check (export_language in ('en', 'fr', 'es'));

comment on column public.organizations.export_language is
  'Idioma en el que se generan los PDF exportados (roster, evaluación, jugadas...) para este club.';
