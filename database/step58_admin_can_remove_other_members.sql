-- =============================================================================
-- PlayPivot — Step 58: el botón "Remove" (sacar a alguien del club) no
-- borraba nada -- faltaba el permiso
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Encontré el motivo de que "Los loles" siga apareciendo en tu selector
-- de club aunque uses "Remove" sobre tu propio nombre en Manage: la
-- ÚNICA policy de borrado que existe en "memberships" (creada en el
-- step 49) es "cada quien puede borrar SU PROPIA fila" -- no cubre a un
-- admin borrando la fila de otra persona. Como Supabase no lanza un
-- error visible cuando RLS bloquea un delete (simplemente borra 0
-- filas), el botón "Remove" parecía funcionar pero no hacía nada --
-- para nadie, no solo para vos.
--
-- Esto agrega una SEGUNDA policy de borrado (se suman con OR, no
-- reemplaza a la de "salir yo mismo"): un admin/coach de ESE club, o
-- el platform admin, también puede borrar la fila de otra persona.
-- Reutiliza can_delete_content(), la misma función que ya protege
-- "Delete data…" y el borrado de equipos.
-- =============================================================================

drop policy if exists "admin/coach del club (o platform admin) puede sacar a otra persona" on public.memberships;
create policy "admin/coach del club (o platform admin) puede sacar a otra persona"
  on public.memberships for delete
  to authenticated
  using (public.can_delete_content(organization_id));

-- Nota: esto NO toca la policy de "salir yo mismo" del step 49 -- las
-- dos conviven. Después de correr esto, probá de nuevo: Admin (all
-- clubs) → Los loles → Manage → buscate a vos → Remove.
