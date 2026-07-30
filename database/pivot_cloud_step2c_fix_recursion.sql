-- =============================================================================
-- Pivot Cloud — Fix: infinite recursion in the "memberships" admin policy
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- The bug: "a club admin manages their club's members" checked admin status
-- by querying the memberships table directly inside its own condition.
-- Since that inner query is itself subject to Row Level Security, Postgres
-- ends up re-checking the same policy again, and again -- infinite
-- recursion, which Supabase reports as a plain 500 error with no useful
-- message. Every membership query (including the dashboard's "which club
-- am I in") was silently failing because of this, not because the data
-- was missing.
--
-- The fix: move the admin check into a SECURITY DEFINER function (same
-- trick already used for is_member_of), which bypasses RLS for its own
-- internal query and breaks the loop.
-- =============================================================================

create or replace function public.is_admin_of(org_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.role = 'admin'
      and m.status = 'active'
  );
$$ language sql security definer stable;

drop policy if exists "a club admin manages their club's members" on public.memberships;
create policy "a club admin manages their club's members"
  on public.memberships for all
  to authenticated
  using (public.is_admin_of(organization_id));

-- =============================================================================
-- Done. This should immediately fix the 500 error on every page that reads
-- memberships (dashboard, roster, assessment, login).
-- =============================================================================
