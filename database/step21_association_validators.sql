-- =============================================================================
-- Pivot Cloud — Étape 21 : validateurs d'associations (un pouvoir plus
-- petit que "contrôleur de la plateforme")
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
-- Requiere haber aplicado antes step18 (asociaciones de clubes).
--
-- Le contrôleur (is_platform_controller, "toi") garde seul le pouvoir de
-- bloquer un compte ou un club entier. Ce nouveau pouvoir, plus petit,
-- ne fait qu'une seule chose : approuver/rejeter les demandes
-- d'association de clubes. Le contrôleur peut le donner (ou le retirer)
-- à 1-2 personnes de confiance, sans leur donner le reste.
--
-- Une même personne peut très bien être "responsable de son équipe"
-- dans un club ET "validateur d'associations" en même temps -- ce sont
-- deux choses indépendantes (l'une vit dans memberships, l'autre dans
-- profiles), aucun conflit.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Un email lisible sur chaque profil -- pour pouvoir chercher
--    quelqu'un par son email et lui donner ce pouvoir, sans avoir à
--    écrire du SQL à la main à chaque fois.
-- -----------------------------------------------------------------------------
alter table public.profiles add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email);
  return new;
end;
$$ language plpgsql security definer;

comment on column public.profiles.email is
  'Copie de auth.users.email, en lecture facile -- juste pour chercher quelqu''un par email dans l''app (ex: pour le nommer validateur d''associations).';

-- -----------------------------------------------------------------------------
-- 2. Le pouvoir lui-même
-- -----------------------------------------------------------------------------
alter table public.profiles add column if not exists is_association_validator boolean not null default false;

comment on column public.profiles.is_association_validator is
  'Peut approuver/rejeter les demandes d''association de clubes -- rien de plus (ne peut pas bloquer un compte ou un club). Donné à la main par le contrôleur de la plateforme.';

create or replace function public.is_association_validator()
returns boolean as $$
  select coalesce(
    (select p.is_platform_controller or p.is_association_validator from public.profiles p where p.id = auth.uid()),
    false
  );
$$ language sql security definer stable;

-- -----------------------------------------------------------------------------
-- 3. Les demandes d'association peuvent maintenant être validées par le
--    contrôleur OU par un validateur -- avant, seul is_platform_controller()
--    pouvait le faire.
-- -----------------------------------------------------------------------------
drop policy if exists "seul le contrôleur décide du sort d'une association" on public.club_associations;
create policy "le contrôleur ou un validateur décide du sort d'une association"
  on public.club_associations for update
  using (public.is_association_validator())
  with check (public.is_association_validator());

drop policy if exists "seul le contrôleur décide qui rejoint" on public.club_association_members;
create policy "le contrôleur ou un validateur décide qui rejoint"
  on public.club_association_members for update
  using (public.is_association_validator())
  with check (public.is_association_validator());

-- Un validateur doit aussi pouvoir VOIR toutes les demandes en attente
-- (pas seulement celles de son propre club) pour pouvoir les traiter --
-- avant, seul is_platform_controller() avait cette vue élargie.
drop policy if exists "voir les associations de mon club, ou tout si contrôleur" on public.club_associations;
create policy "voir les associations de mon club, ou tout si contrôleur/validateur"
  on public.club_associations for select
  using (
    public.is_association_validator()
    or exists (
      select 1 from public.club_association_members cam
      where cam.association_id = club_associations.id
        and public.is_member_of(cam.organization_id)
    )
  );

drop policy if exists "voir mes lignes d'association, ou tout si contrôleur" on public.club_association_members;
create policy "voir mes lignes d'association, ou tout si contrôleur/validateur"
  on public.club_association_members for select
  using (public.is_association_validator() or public.is_member_of(organization_id));

-- -----------------------------------------------------------------------------
-- Note : la règle "seul le contrôleur bloque un compte/club" (profiles,
-- organizations) ne change PAS ici -- ce pouvoir-là reste uniquement
-- pour toi. Cette étape ajoute un pouvoir séparé, plus petit, pas un
-- remplacement.
-- =============================================================================
