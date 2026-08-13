-- =============================================================================
-- Pivot Cloud — Étape 51 : le garde-fou "dernier admin" ne doit pas
-- bloquer la suppression du club entier
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Le déclencheur de l'étape 7 protège bien contre le cas "le club reste
-- là mais perd son seul admin" -- mais il se déclenche AUSSI quand
-- c'est le club LUI-MÊME qui est en train d'être supprimé (soit
-- directement, soit en cascade depuis la suppression du compte de son
-- seul admin) -- deux cas où il n'y a en réalité aucun club orphelin,
-- juste plus de club du tout.
--
-- Le correctif : si l'organisation elle-même n'existe déjà plus (elle
-- vient d'être supprimée dans le même cascade), le garde-fou ne
-- s'applique plus -- rien à protéger.
-- =============================================================================

create or replace function public.prevent_removing_last_admin()
returns trigger as $$
declare
  remaining_admins int;
  org_still_exists boolean;
begin
  if old.role = 'admin' and old.status = 'active' then
    select exists(select 1 from public.organizations where id = old.organization_id) into org_still_exists;

    -- le club lui-même est en train de disparaître (suppression directe,
    -- ou en cascade depuis le compte de son seul admin) -- rien à protéger
    if org_still_exists then
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
  end if;

  if TG_OP = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$ language plpgsql security definer;
