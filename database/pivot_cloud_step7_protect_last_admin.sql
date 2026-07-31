-- =============================================================================
-- Pivot Cloud — Safeguard: never remove a club's last active admin
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Without this, an admin could demote or remove themselves (or another
-- admin) and leave a club with zero admins -- at that point nobody, not
-- even the platform controller, could fix it from the app (see the
-- earlier conversation about this exact risk).
--
-- This is enforced at the database level (a trigger), not just in the
-- settings screen -- so it holds even if a request is sent directly,
-- bypassing the UI.
-- =============================================================================

create or replace function public.prevent_removing_last_admin()
returns trigger as $$
declare
  remaining_admins int;
begin
  -- Seulement un souci si la ligne qu'on modifie/supprime était un admin actif
  if old.role = 'admin' and old.status = 'active' then
    select count(*) into remaining_admins
    from public.memberships
    where organization_id = old.organization_id
      and role = 'admin'
      and status = 'active'
      and id != old.id;

    if remaining_admins = 0 then
      raise exception 'Cannot remove or demote the last active admin of a club. Promote someone else first.';
    end if;
  end if;

  if TG_OP = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_prevent_removing_last_admin on public.memberships;
create trigger trg_prevent_removing_last_admin
  before update or delete on public.memberships
  for each row execute function public.prevent_removing_last_admin();

-- =============================================================================
-- Done. From now on, trying to demote/remove a club's only admin fails
-- with a clear error instead of silently locking the club out.
-- =============================================================================
