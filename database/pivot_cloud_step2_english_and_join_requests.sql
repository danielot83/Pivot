-- =============================================================================
-- Pivot Cloud — Step 2 (English pass) + Step 2b combined
-- =============================================================================
-- Run this in Supabase: SQL Editor → New query → paste → Run.
--
-- Context: the very first schema (step2_schema.sql) already ran successfully,
-- with policy names in French. This migration does two things at once:
--   1. Renames every policy from French to English (drop + recreate, same
--      logic, nothing about your data changes).
--   2. Adds the "join an existing club" system (pending requests, approval),
--      which is what step2b_join_requests.sql was going to add -- but
--      written directly in English this time, so you don't need to run
--      the French version at all.
--
-- Safe to run now: you only have a couple of test accounts, so renaming
-- everything costs nothing. Every future migration will be in English
-- from here on.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Drop every French-named policy FIRST -- one of them (on memberships)
--    references the is_active column we're about to remove below, so it
--    has to go before that column can be dropped.
-- -----------------------------------------------------------------------------
drop policy if exists "n'importe qui peut créer un club" on public.organizations;
drop policy if exists "voir son propre club, ou tous si contrôleur" on public.organizations;
drop policy if exists "seul le contrôleur bloque un club" on public.organizations;

drop policy if exists "voir son propre profil, ou tous si contrôleur" on public.profiles;
drop policy if exists "modifier son propre profil" on public.profiles;
drop policy if exists "seul le contrôleur bloque un compte" on public.profiles;

drop policy if exists "voir les membres de son club, ou tous si contrôleur" on public.memberships;
drop policy if exists "un admin gère les membres de son club" on public.memberships;

-- -----------------------------------------------------------------------------
-- 2. Membership status: pending / active / rejected / blocked
--    (replaces the simple is_active true/false with something more precise)
-- -----------------------------------------------------------------------------
create type public.membership_status as enum ('pending', 'active', 'rejected', 'blocked');

alter table public.memberships add column status public.membership_status not null default 'active';
update public.memberships set status = (case when is_active then 'active' else 'blocked' end)::public.membership_status;
alter table public.memberships drop column is_active;

comment on column public.memberships.status is
  'pending = request awaiting approval from a club admin. active = normal member.
   rejected = request denied. blocked = was active, then removed from the club.';

-- -----------------------------------------------------------------------------
-- 3. Update the helper functions that depended on the old is_active column
-- -----------------------------------------------------------------------------
create or replace function public.is_member_of(org_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$ language sql security definer stable;

create or replace function public.handle_new_organization()
returns trigger as $$
begin
  insert into public.memberships (organization_id, user_id, role, status)
  values (new.id, auth.uid(), 'admin', 'active');
  return new;
end;
$$ language plpgsql security definer;

-- -----------------------------------------------------------------------------
-- 4. Recreate everything in English -- organizations
-- -----------------------------------------------------------------------------
create policy "anyone can create a club"
  on public.organizations for insert
  to authenticated
  with check (true);

create policy "see active club names to join, or full access if member/controller"
  on public.organizations for select
  to authenticated
  using (
    is_active = true
    or public.is_member_of(id)
    or public.is_platform_controller()
  );

create policy "only the controller can block a club"
  on public.organizations for update
  to authenticated
  using (public.is_platform_controller())
  with check (public.is_platform_controller());

-- -----------------------------------------------------------------------------
-- 5. Recreate everything in English -- profiles
-- -----------------------------------------------------------------------------
create policy "see own profile, or all if controller"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_platform_controller());

create policy "update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "only the controller can block an account"
  on public.profiles for update
  to authenticated
  using (public.is_platform_controller())
  with check (public.is_platform_controller());

-- -----------------------------------------------------------------------------
-- 6. Recreate everything in English -- memberships
-- -----------------------------------------------------------------------------
create policy "see own requests, own club's members, or all if controller"
  on public.memberships for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_member_of(organization_id)
    or public.is_platform_controller()
  );

create policy "anyone can request to join a club (never directly as admin)"
  on public.memberships for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and role in ('coach', 'assistant', 'viewer')
  );

create policy "a club admin manages their club's members"
  on public.memberships for all
  to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.organization_id = memberships.organization_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
        and m.status = 'active'
    )
  );

-- =============================================================================
-- Done. From here, don't run pivot_cloud_step2b_join_requests.sql (French) --
-- this file already replaces it, in English, on top of step2_schema.sql.
-- =============================================================================
