-- =============================================================================
-- PlayPivot -- step80_pending_request_visibility
-- =============================================================================
-- Dani, 2026-09-16, viendo la pantalla "You need a club" con una cuenta de
-- prueba con una solicitud pendiente: "aqui deberia de decir que estas
-- esperando a que el entrenador administrador (y el nombre) te valide".
--
-- Al investigarlo: además del fallo ya corregido en step79/hotfix anterior
-- (el INSERT de la solicitud fallaba por falta de user_id), hay un segundo
-- problema, más de fondo, que haría que ESTA pantalla nunca pudiera
-- mostrarse aunque el INSERT funcione: la política de SELECT de
-- `memberships` (pivot_cloud_step2_schema.sql) solo deja ver membresías
-- vía `is_member_of(organization_id)`, y esa función exige
-- `status = 'active'` -- así que alguien con una solicitud PENDIENTE no
-- puede ni siquiera leer su PROPIA fila. El cliente no tiene forma de
-- saber "tengo una solicitud en curso" -- por eso la pantalla no puede
-- distinguir "nunca pediste nada" de "estás esperando aprobación".
--
-- Este fichero añade, sin tocar nada de lo que ya existía (todas las
-- políticas nuevas son ADEMÁS de las de antes, nunca en su lugar --
-- en Postgres, varias políticas permisivas para el mismo comando se
-- combinan con OR, así que esto solo AMPLÍA lo que se puede ver, nunca
-- reduce nada):
--
--   1. Cualquiera puede ver sus PROPIAS filas de `memberships`, sea cual
--      sea su estado (pending/active/blocked) -- antes solo se veían las
--      activas.
--   2. Quien tiene una solicitud pendiente en un club puede ver las filas
--      de los ADMINS activos de ESE club (nada más -- no ve al resto de
--      coaches, ni las solicitudes de otras personas).
--   3. Quien tiene una solicitud pendiente en un club puede ver el NOMBRE
--      (perfil) de esos mismos admins -- si no, el JOIN de arriba
--      devolvería el nombre en blanco (la política de `profiles` es
--      aparte y no se enteraría de nada de esto).
--
-- Con las 3, el Dashboard ya puede preguntar "¿tengo una solicitud
-- pendiente?" y, si la hay, mostrar el nombre del club y de su admin.
--
-- CORRECCIÓN (2026-09-16, antes de que nadie llegara a correr esto):
-- la primera versión de la política 2 comprobaba "¿tengo yo una fila
-- pendiente en este club?" con una subconsulta directa a la propia
-- tabla `memberships` dentro de su propia condición USING. Eso es
-- EXACTAMENTE el error que ya rompió esta misma tabla dos veces antes
-- (`pivot_cloud_step2c_fix_recursion.sql`, `step29_fix_recursion_and_
-- message_links.sql`): una política de `memberships` que vuelve a
-- consultar `memberships` obliga a Postgres a re-evaluar esa misma
-- política para las filas de la subconsulta, que a su vez la vuelven a
-- disparar -- Postgres lo detecta y corta con el error 42P17
-- ("infinite recursion detected in policy for relation memberships"),
-- y ESO rompe TODAS las consultas a memberships de TODO el mundo, no
-- solo las de quien tiene una solicitud pendiente. Se detectó al
-- revisar esto de nuevo (no llegó a subirse así) y se arregló con el
-- mismo truco que ya usa el resto del fichero para este problema
-- exacto: mover la comprobación a una función SECURITY DEFINER
-- (`has_pending_request_for`, más abajo), que consulta `memberships`
-- SIN pasar otra vez por RLS -- rompe el ciclo, igual que ya hacen
-- `is_member_of()`/`is_admin_of()` para sus propios casos.
-- =============================================================================

-- 1. Ver las propias membresías, sea cual sea su estado.
drop policy if exists "ver las propias membresías (cualquier estado)" on public.memberships;
create policy "ver las propias membresías (cualquier estado)"
  on public.memberships for select
  to authenticated
  using (user_id = auth.uid());

-- Función auxiliar (SECURITY DEFINER a propósito -- ver nota de arriba):
-- ¿tiene quien pregunta una solicitud PENDIENTE en este club? Se usa
-- desde políticas de `memberships` Y de `profiles`, así que consulta la
-- tabla saltándose RLS por dentro -- si no, cualquier política de
-- `memberships` que la llamara volvería a caer en el mismo problema de
-- recursión que esto arregla.
create or replace function public.has_pending_request_for(org_id uuid)
returns boolean language sql security definer stable set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'pending'
  );
$$;

-- 2. Con una solicitud pendiente en un club, ver a sus admins activos.
drop policy if exists "quien tiene una solicitud pendiente ve a los admins de ese club" on public.memberships;
create policy "quien tiene una solicitud pendiente ve a los admins de ese club"
  on public.memberships for select
  to authenticated
  using (
    role = 'admin'
    and status = 'active'
    and public.has_pending_request_for(organization_id)
  );

-- 3. Con una solicitud pendiente en un club, ver el nombre de sus admins.
-- (Esta consulta al perfil de OTRA persona SÍ puede ir directa a
-- `memberships` sin pasar por la función de arriba, porque esta política
-- vive en `profiles`, no en `memberships` -- no hay autorreferencia, así
-- que no hay riesgo de recursión aquí. Se usa la misma función de todas
-- formas, por claridad y para no repetir la misma condición dos veces.)
drop policy if exists "ver perfil de admins si tengo solicitud pendiente en su club" on public.profiles;
create policy "ver perfil de admins si tengo solicitud pendiente en su club"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1 from public.memberships theirs
      where theirs.user_id = profiles.id
        and theirs.role = 'admin'
        and theirs.status = 'active'
        and public.has_pending_request_for(theirs.organization_id)
    )
  );

-- =============================================================================
-- VERIFICAR DESPUÉS DE CORRER ESTO:
--   select polname, cmd from pg_policies where tablename = 'memberships' and cmd = 'r';
--   select polname, cmd from pg_policies where tablename = 'profiles' and cmd = 'r';
--   select 1; -- y sobre todo: probar a cargar el Dashboard normal (con
--   una cuenta YA activa) para confirmar que las membresías de siempre
--   se siguen leyendo bien, sin ningún error de "infinite recursion".
-- Debería verse la política de siempre + las 2 nuevas en memberships, y la
-- de siempre (o la de mensajería, si ya se instaló step28) + la nueva en
-- profiles.
-- =============================================================================
