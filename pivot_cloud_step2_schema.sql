-- =============================================================================
-- Pivot Cloud — Étape 2 : squelette de la base de données
-- =============================================================================
-- À coller dans Supabase : Dashboard → SQL Editor → New query → coller tout
-- ce fichier → Run.
--
-- Ce que ça met en place (rien de plus pour l'instant, exprès) :
--   1. Les organisations (les clubs)
--   2. Les profils utilisateurs (liés aux comptes Supabase existants)
--   3. Les "memberships" (qui appartient à quel club, avec quel rôle)
--   4. Les règles de sécurité (Row Level Security) qui garantissent que :
--        - un club ne voit JAMAIS le contenu d'un autre club
--        - le contrôleur (toi) peut activer/bloquer des comptes et des
--          clubs, mais ne voit pas leur contenu
--        - n'importe qui peut s'inscrire librement et créer son propre club
--
-- Pas encore dedans (viendra avec les prochaines étapes) : joueurs,
-- exercices, entraînements, matchs, suivi individuel.
-- =============================================================================

create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Organisations (les clubs)
-- -----------------------------------------------------------------------------
create table if not exists public.organizations (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  created_at   timestamptz not null default now(),
  is_active    boolean not null default true  -- le contrôleur peut bloquer tout un club ici
);

comment on column public.organizations.is_active is
  'Mis à false par le contrôleur de la plateforme pour bloquer un club entier (accès refusé partout, sans supprimer les données).';

-- -----------------------------------------------------------------------------
-- 2. Profils utilisateurs
-- -----------------------------------------------------------------------------
-- Supabase gère déjà les comptes eux-mêmes (email, mot de passe, connexion)
-- dans une table système "auth.users" qu'on ne touche jamais directement.
-- Ici, on garde juste les informations propres à Pivot pour chaque personne.
create table if not exists public.profiles (
  id                     uuid primary key references auth.users(id) on delete cascade,
  full_name              text,
  is_platform_controller boolean not null default false,  -- true UNIQUEMENT pour toi
  is_active              boolean not null default true,    -- le contrôleur bloque UNE personne ici
  created_at             timestamptz not null default now()
);

comment on column public.profiles.is_platform_controller is
  'Un seul compte (le tien) doit avoir true ici. Donne le droit de gérer les comptes/clubs, jamais de voir leur contenu.';

-- Crée automatiquement un profil vide dès qu'un compte Supabase est créé,
-- pour ne jamais avoir un compte "orphelin" sans profil associé.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 3. Appartenance à un club, avec un rôle
-- -----------------------------------------------------------------------------
create type public.member_role as enum ('admin', 'coach', 'assistant', 'viewer');

create table if not exists public.memberships (
  id               uuid primary key default uuid_generate_v4(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  user_id          uuid not null references public.profiles(id) on delete cascade,
  role             public.member_role not null default 'coach',
  is_active        boolean not null default true,  -- bloquer CETTE personne dans CE club précis
  created_at       timestamptz not null default now(),
  unique (organization_id, user_id)
);

comment on table public.memberships is
  'Qui appartient à quel club, avec quel rôle. Une personne peut appartenir à plusieurs clubs.';

-- Quand quelqu'un crée un nouveau club, il en devient automatiquement
-- l'administrateur (sinon : il vient de créer un club dont il n'est pas
-- encore membre, et ne pourrait donc même pas le voir ni y ajouter
-- d'autres personnes -- un peu comme construire une maison sans porte
-- pour y entrer soi-même).
create or replace function public.handle_new_organization()
returns trigger as $$
begin
  insert into public.memberships (organization_id, user_id, role)
  values (new.id, auth.uid(), 'admin');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_organization_created on public.organizations;
create trigger on_organization_created
  after insert on public.organizations
  for each row execute function public.handle_new_organization();

-- -----------------------------------------------------------------------------
-- 4. Fonctions utilitaires pour les règles de sécurité ci-dessous
-- -----------------------------------------------------------------------------
-- Est-ce que je suis membre actif de cette organisation (quel que soit mon rôle) ?
create or replace function public.is_member_of(org_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.is_active = true
  );
$$ language sql security definer stable;

-- Est-ce que je suis le contrôleur de la plateforme ?
create or replace function public.is_platform_controller()
returns boolean as $$
  select coalesce(
    (select p.is_platform_controller from public.profiles p where p.id = auth.uid()),
    false
  );
$$ language sql security definer stable;

-- -----------------------------------------------------------------------------
-- 5. Activation des règles de sécurité (Row Level Security)
-- -----------------------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.profiles      enable row level security;
alter table public.memberships   enable row level security;

-- --- organizations --------------------------------------------------------
-- Tout le monde connecté peut CRÉER une organisation (inscription libre).
create policy "n'importe qui peut créer un club"
  on public.organizations for insert
  to authenticated
  with check (true);

-- On ne voit que les clubs dont on est membre, OU tous si on est le contrôleur.
create policy "voir son propre club, ou tous si contrôleur"
  on public.organizations for select
  to authenticated
  using (public.is_member_of(id) or public.is_platform_controller());

-- Seul le contrôleur peut activer/désactiver un club entier.
create policy "seul le contrôleur bloque un club"
  on public.organizations for update
  to authenticated
  using (public.is_platform_controller())
  with check (public.is_platform_controller());

-- Note : pour l'instant, un admin de club ne peut pas encore renommer
-- son propre club via cette table (seul le contrôleur peut modifier
-- "organizations"). Volontairement laissé de côté ici : l'ajouter proprement
-- demande une fonction dédiée (pour ne pas ouvrir, par erreur, le champ
-- is_active à un admin de club qui pourrait alors se débloquer lui-même).
-- À traiter dans une étape ultérieure, pas oublié.

-- --- profiles ---------------------------------------------------------------
create policy "voir son propre profil, ou tous si contrôleur"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_platform_controller());

create policy "modifier son propre profil"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Seul le contrôleur peut bloquer un compte (is_active).
create policy "seul le contrôleur bloque un compte"
  on public.profiles for update
  to authenticated
  using (public.is_platform_controller())
  with check (public.is_platform_controller());

-- --- memberships --------------------------------------------------------
-- On voit les memberships de son(ses) propre(s) club(s) uniquement --
-- le contrôleur voit tout (pour pouvoir gérer les comptes), mais ceci ne
-- donne accès qu'à "qui appartient à quel club avec quel rôle", jamais
-- au contenu du club (joueurs, matchs, suivi...) qui vivra dans des
-- tables séparées avec leurs propres règles, plus tard.
create policy "voir les membres de son club, ou tous si contrôleur"
  on public.memberships for select
  to authenticated
  using (public.is_member_of(organization_id) or public.is_platform_controller());

-- Un admin de club peut ajouter/gérer les membres de SON club.
create policy "un admin gère les membres de son club"
  on public.memberships for all
  to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.organization_id = memberships.organization_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
        and m.is_active = true
    )
  );

-- =============================================================================
-- Fin de l'étape 2. Prochaine étape (4) : les joueurs (Effectif), avec les
-- mêmes principes de séparation par club appliqués à leurs propres données.
-- =============================================================================
