-- =============================================================================
-- PlayPivot — Step 57: "events" se quedó afuera del arreglo del step 50
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- El error "Database error deleting user" al borrar una cuenta desde
-- Authentication → Users es el mismo problema que ya arreglamos en el
-- step 50 (created_by bloqueando el borrado) -- pero crear_tabla_events.sql
-- se escribió sin "on delete set null", y no estaba en la lista de
-- tablas que revisó el step 50. Si esa persona creó aunque sea un solo
-- evento de calendario, Postgres bloquea el borrado de su cuenta.
--
-- Mismo arreglo que el step 50: buscar la restricción real (no adivinar
-- el nombre) y reemplazarla por "on delete set null" -- el evento se
-- queda en el club, solo se vacía quién lo creó.
-- =============================================================================

do $$
declare
  found_conname text;
begin
  select con.conname into found_conname
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any(con.conkey)
  where con.contype = 'f'
    and rel.relnamespace = 'public'::regnamespace
    and rel.relname = 'events'
    and att.attname = 'created_by'
  limit 1;

  if found_conname is not null then
    execute format('alter table public.events drop constraint %I', found_conname);
  end if;

  execute 'alter table public.events add constraint events_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null';
end $$;

-- Después de correr esto, reintentá borrar el usuario desde
-- Authentication → Users. Si te vuelve a fallar con el mismo mensaje,
-- probablemente sea otra tabla con el mismo problema -- decime el
-- email exacto de la cuenta que estás intentando borrar y reviso a qué
-- club/contenido está ligada para encontrar cuál.
