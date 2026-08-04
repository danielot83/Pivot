-- =============================================================================
-- Pivot Cloud — Étape 18 : associations de clubes (le cercle "communauté")
-- =============================================================================
-- À coller dans Supabase : SQL Editor → New query → coller → Run.
--
-- Rappel des 4 cercles de partage décidés avec Daniel :
--   1. Pivot Community (tout le monde)
--   2. Association de clubes (CETTE étape) -- demande + validation du
--      contrôleur de la plateforme (is_platform_controller, déjà
--      existant depuis l'étape 2 -- pas besoin d'inventer un nouveau rôle)
--   3. Mon équipe (déjà : organization_id)
--   4. Moi seul
--
-- Ce que fait cette étape : un club peut proposer la création d'une
-- association (ou demander à rejoindre une association déjà approuvée).
-- Tant que le contrôleur n'a pas validé, la demande reste "pending" et
-- ne donne AUCUN accès -- ce n'est qu'une demande, pas un partage réel.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Les associations elles-mêmes
-- -----------------------------------------------------------------------------
create table if not exists public.club_associations (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_by uuid not null references auth.users(id),
  created_at   timestamptz not null default now(),
  decided_at   timestamptz,
  decided_by   uuid references auth.users(id)
);

comment on table public.club_associations is
  'Un groupe de clubs qui ont demandé à partager du contenu entre eux (le cercle "communauté"). Doit être approuvé par le contrôleur de la plateforme avant d''exister vraiment.';

alter table public.club_associations enable row level security;

-- -----------------------------------------------------------------------------
-- 2. Qui appartient (ou demande à appartenir) à quelle association
-- -----------------------------------------------------------------------------
create table if not exists public.club_association_members (
  association_id  uuid not null references public.club_associations(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  status          text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_by    uuid not null references auth.users(id),
  created_at      timestamptz not null default now(),
  decided_at      timestamptz,
  decided_by      uuid references auth.users(id),
  primary key (association_id, organization_id)
);

comment on table public.club_association_members is
  'Un club par ligne : son statut (pending/approved/rejected) dans une association donnée.';

alter table public.club_association_members enable row level security;

-- -----------------------------------------------------------------------------
-- 3. Fonction utilitaire : mon club appartient-il (déjà approuvé) à
--    la même association qu'un autre club ? -- servira plus tard pour
--    la règle de partage "communauté" sur les exercices/jugadas.
-- -----------------------------------------------------------------------------
create or replace function public.shares_association_with(other_org_id uuid)
returns boolean as $$
  select exists (
    select 1
    from public.club_association_members mine
    join public.club_association_members theirs on theirs.association_id = mine.association_id
    where mine.organization_id in (select organization_id from public.memberships where user_id = auth.uid() and status = 'active')
      and mine.status = 'approved'
      and theirs.organization_id = other_org_id
      and theirs.status = 'approved'
  );
$$ language sql security definer stable;

-- -----------------------------------------------------------------------------
-- 4. Règles de sécurité
-- -----------------------------------------------------------------------------

-- Voir une association : si mon club en fait partie (ou l'a demandé), ou
-- si je suis le contrôleur (qui doit voir TOUTES les demandes pour
-- pouvoir les valider).
create policy "voir les associations de mon club, ou tout si contrôleur"
  on public.club_associations for select
  using (
    public.is_platform_controller()
    or exists (
      select 1 from public.club_association_members cam
      where cam.association_id = club_associations.id
        and public.is_member_of(cam.organization_id)
    )
  );

-- N'importe quel membre actif peut PROPOSER une nouvelle association
-- (elle reste "pending" tant que le contrôleur ne l'a pas validée).
create policy "un membre actif peut proposer une association"
  on public.club_associations for insert
  with check (requested_by = auth.uid());

-- Seul le contrôleur peut approuver/rejeter (changer le status).
create policy "seul le contrôleur décide du sort d'une association"
  on public.club_associations for update
  using (public.is_platform_controller())
  with check (public.is_platform_controller());

-- Voir les lignes de mon propre club, ou tout si contrôleur.
create policy "voir mes lignes d'association, ou tout si contrôleur"
  on public.club_association_members for select
  using (public.is_platform_controller() or public.is_member_of(organization_id));

-- Un admin de club peut demander que SON club rejoigne une association
-- (nouvelle ou déjà approuvée) -- jamais au nom d'un autre club.
create policy "un admin de club demande à rejoindre pour son club"
  on public.club_association_members for insert
  with check (
    requested_by = auth.uid()
    and exists (
      select 1 from public.memberships m
      where m.organization_id = club_association_members.organization_id
        and m.user_id = auth.uid() and m.role = 'admin' and m.status = 'active'
    )
  );

-- Seul le contrôleur approuve/rejette une demande d'adhésion.
create policy "seul le contrôleur décide qui rejoint"
  on public.club_association_members for update
  using (public.is_platform_controller())
  with check (public.is_platform_controller());
