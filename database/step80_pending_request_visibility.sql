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
-- =============================================================================

-- 1. Ver las propias membresías, sea cual sea su estado.
drop policy if exists "ver las propias membresías (cualquier estado)" on public.memberships;
create policy "ver las propias membresías (cualquier estado)"
  on public.memberships for select
  to authenticated
  using (user_id = auth.uid());

-- 2. Con una solicitud pendiente en un club, ver a sus admins activos.
drop policy if exists "quien tiene una solicitud pendiente ve a los admins de ese club" on public.memberships;
create policy "quien tiene una solicitud pendiente ve a los admins de ese club"
  on public.memberships for select
  to authenticated
  using (
    role = 'admin'
    and status = 'active'
    and exists (
      select 1 from public.memberships mine
      where mine.user_id = auth.uid()
        and mine.organization_id = memberships.organization_id
        and mine.status = 'pending'
    )
  );

-- 3. Con una solicitud pendiente en un club, ver el nombre de sus admins.
drop policy if exists "ver perfil de admins si tengo solicitud pendiente en su club" on public.profiles;
create policy "ver perfil de admins si tengo solicitud pendiente en su club"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.memberships mine
      join public.memberships theirs on theirs.organization_id = mine.organization_id
      where mine.user_id = auth.uid()
        and mine.status = 'pending'
        and theirs.user_id = profiles.id
        and theirs.role = 'admin'
        and theirs.status = 'active'
    )
  );

-- =============================================================================
-- VERIFICAR DESPUÉS DE CORRER ESTO:
--   select polname, cmd from pg_policies where tablename = 'memberships' and cmd = 'r';
--   select polname, cmd from pg_policies where tablename = 'profiles' and cmd = 'r';
-- Debería verse la política de siempre + las 2 nuevas en memberships, y la
-- de siempre (o la de mensajería, si ya se instaló step28) + la nueva en
-- profiles.
-- =============================================================================
