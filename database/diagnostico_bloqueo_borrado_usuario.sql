-- =============================================================================
-- PlayPivot — Diagnóstico: qué tabla sigue bloqueando el borrado de un
-- usuario en Authentication → Users
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
-- Esto NO borra ni cambia nada -- solo lista.
--
-- Repasé todos los .sql del proyecto y, en teoría, step50 + step57 ya
-- cubren todo lo que encuentro por escrito. Si el borrado del usuario
-- TODAVÍA falla después de correr step57, lo más seguro es que haya
-- una tabla/columna que no está en estos archivos (por ejemplo, algo
-- creado a mano desde el Table Editor de Supabase en vez de por SQL).
-- Esta consulta busca en el catálogo real de Postgres, no en mis
-- archivos, así que encuentra la verdad aunque yo me haya perdido algo.
-- =============================================================================

select
  con.conname as constraint_name,
  rel.relname as table_name,
  att.attname as column_name,
  con.confdeltype as on_delete_action  -- 'a' = no action (BLOQUEA), 'c' = cascade, 'n' = set null, 'r' = restrict
from pg_constraint con
join pg_class rel on rel.oid = con.conrelid
join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any(con.conkey)
join pg_class frel on frel.oid = con.confrelid
join pg_namespace fns on fns.oid = frel.relnamespace
where con.contype = 'f'
  and frel.relname = 'users'
  and fns.nspname = 'auth'
  and con.confdeltype not in ('c', 'n')  -- todo lo que NO sea cascade ni set null -- osea, lo que bloquea
order by rel.relname;

-- Si esto devuelve alguna fila: decime el "table_name" y el
-- "column_name" y te preparo el step59 para esa tabla puntual.
-- Si no devuelve NINGUNA fila pero el borrado sigue fallando, entonces
-- no es una foreign key -- probablemente un trigger en auth.users con
-- otro tipo de error. En ese caso mandame el mensaje de error completo
-- (a veces Supabase lo trunca en el popup -- fijate si hay más detalle
-- en Logs → Postgres Logs, filtrando por el momento en que intentaste
-- borrar).
