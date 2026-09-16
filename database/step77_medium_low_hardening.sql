-- =============================================================================
-- PlayPivot -- step77_medium_low_hardening
-- =============================================================================
-- Segunda mitad de la respuesta al informe de seguridad de Stefano
-- (2026-09-16) -- ronda 2, ahora con el repositorio completo (gracias al
-- zip que mandó Dani). Cierra los hallazgos que la ronda 1 (step75/step76)
-- había dejado pendientes por no tener el fichero/la definición real.
--
-- Cubre:
--   MEDIUM-5 (el resto) -- players, player_assessments, attendance y las
--             fotos de jugador/licencia, limitados al equipo del coach
--             (decisión de Dani, 2026-09-16: "solo su equipo").
--   MEDIUM-6 -- search_path fijado en el resto de funciones SECURITY
--             DEFINER que aparecen en el repositorio (is_member_of ya se
--             arregló en step75; get_platform_admin_contact ya lo tenía).
--   MEDIUM-7 (el resto) -- is_staff_member_of(), is_member_of_team() y
--             is_staff_member_of_team() respetan ahora cuenta/club
--             bloqueados, igual que is_member_of() en step75.
--   LOW-12   -- las policies de storage que convierten el nombre de
--             carpeta a uuid ya no revientan con un 500 si alguien manda
--             un path raro -- ahora deniegan limpio.
--   HIGH-3 (refuerzo, opcional) -- los triggers de límite anti-spam de
--             asociaciones fuerzan status='pending' también ellos, por
--             si alguna policy futura se olvida de hacerlo.
--
-- Nota sobre alcance -- NO se toca: exercises, plays, notebooks,
-- matches/trainings en escritura, teams, logos de club -- el propio
-- código ya documenta (step53) que esos son contenido del club en
-- general, no de un equipo concreto, a propósito. Solo se limita al
-- equipo lo que ya estaba pensado como "team" en el resto de la app:
-- datos de jugadores concretos.
--
-- Nota sobre una limitación que ya existía antes de esta ronda, no
-- introducida aquí: el "equipo" de una membership (team_season +
-- team_name, step53) no incluye categoría ni género -- igual que el
-- problema de nombres de fichero duplicados de la ronda 23 (U8/U10 con
-- el mismo nombre de equipo), un coach fijado a "DEL, 2026-2027" vería
-- de hecho el U8 Y el U10 si ambos se llaman "DEL" esa temporada, porque
-- la membership no distingue por categoría. No es parte de los 12
-- hallazgos de Stefano y arreglarlo de raíz significa rediseñar cómo se
-- fija el alcance de una membership (afecta a más que solo seguridad) --
-- se deja anotado para decidir con Dani en otra ronda, no en esta.
--
-- Seguro de correr más de una vez.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0. Helper -- convertir texto a uuid sin reventar (LOW-12)
-- -----------------------------------------------------------------------------
-- ((storage.foldername(name))[1])::uuid revienta con un error de Postgres
-- (500 en vez de un denegado limpio) si alguien sube un archivo a una
-- carpeta que no es un uuid válido. No es una fuga de datos, pero
-- convierte una denegación normal en un fallo de servidor, y mezcla
-- "esto está mal formado" con "hubo un fallo real" en los logs.
-- -----------------------------------------------------------------------------
create or replace function public.safe_uuid(input text)
returns uuid language plpgsql immutable set search_path = public, pg_temp as $$
begin
  return input::uuid;
exception when others then
  return null;
end;
$$;


-- -----------------------------------------------------------------------------
-- 1. Helper nuevo -- "puede editar contenido de ESTE equipo concreto"
--    (MEDIUM-5) -- mismo patrón que can_manage_membership_row (step54) y
--    is_member_of_team (step53), aplicado a la edición de contenido en
--    vez de a la gestión de miembros o a la lectura.
-- -----------------------------------------------------------------------------
create or replace function public.can_edit_content_for_team(org_id uuid, p_season text, p_team text)
returns boolean language sql security definer stable set search_path = public, pg_temp as $$
  select public.is_platform_controller() or exists (
    select 1 from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('admin', 'coach')
      and (
        (m.team_season is null and m.team_name is null)  -- coach/admin de todo el club: como siempre
        or (m.team_season = p_season and m.team_name = p_team)  -- fijado a este equipo: solo este
      )
  );
$$;


-- -----------------------------------------------------------------------------
-- 2. MEDIUM-7 (el resto) -- cuenta o club bloqueados vuelven a no tener
--    efecto real si is_staff_member_of()/is_member_of_team()/
--    is_staff_member_of_team() no comprueban is_active. Mismo candado que
--    ya se añadió a is_member_of() en step75.
-- -----------------------------------------------------------------------------
create or replace function public.is_staff_member_of(org_id uuid)
returns boolean language sql security definer stable set search_path = public, pg_temp as $$
  select exists (
    select 1
    from public.memberships m
    join public.profiles p on p.id = m.user_id
    join public.organizations o on o.id = m.organization_id
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and p.is_active
      and o.is_active
  );
$$;

create or replace function public.is_member_of_team(org_id uuid, p_season text, p_team text)
returns boolean language sql security definer stable set search_path = public, pg_temp as $$
  select
    public.is_platform_controller()
    or exists (
      select 1
      from public.memberships m
      join public.profiles p on p.id = m.user_id
      join public.organizations o on o.id = m.organization_id
      where m.organization_id = org_id
        and m.user_id = auth.uid()
        and m.status = 'active'
        and p.is_active
        and o.is_active
        and (
          (m.team_season is null and m.team_name is null)
          or (m.team_season = p_season and m.team_name = p_team)
        )
    );
$$;

create or replace function public.is_staff_member_of_team(org_id uuid, p_season text, p_team text)
returns boolean language sql security definer stable set search_path = public, pg_temp as $$
  select
    public.is_platform_controller()
    or exists (
      select 1
      from public.memberships m
      join public.profiles p on p.id = m.user_id
      join public.organizations o on o.id = m.organization_id
      where m.organization_id = org_id
        and m.user_id = auth.uid()
        and m.status = 'active'
        and p.is_active
        and o.is_active
        and (
          (m.team_season is null and m.team_name is null)
          or (m.team_season = p_season and m.team_name = p_team)
        )
    );
$$;

-- is_platform_controller() sigue sin este candado, a propósito (mismo
-- motivo que step75): si is_active de Dani se pusiera a false por
-- error, esto evita que se quede fuera de su propia plataforma.


-- -----------------------------------------------------------------------------
-- 3. MEDIUM-5 -- players: la lectura ya estaba limitada al equipo desde
--    step53 (visibility='team' + is_member_of_team); INSERT/UPDATE/DELETE
--    seguían usando can_edit_content (todo el club). Un coach fijado a un
--    equipo podía editar o borrar jugadores de OTRO equipo del mismo club
--    (no podía luego verlos, por el punto anterior, pero sí manipularlos
--    a ciegas -- alteración/destrucción de datos, no exposición).
-- -----------------------------------------------------------------------------
drop policy if exists "coaches add players to their club" on public.players;
create policy "coaches add players to their team"
  on public.players for insert to authenticated
  with check (public.can_edit_content_for_team(organization_id, season, team));

drop policy if exists "coaches update their club's players" on public.players;
create policy "coaches update their team's players"
  on public.players for update to authenticated
  using (public.can_edit_content_for_team(organization_id, season, team))
  with check (public.can_edit_content_for_team(organization_id, season, team));

drop policy if exists "coaches remove players from their club" on public.players;
create policy "coaches remove their team's players"
  on public.players for delete to authenticated
  using (public.can_edit_content_for_team(organization_id, season, team));


-- -----------------------------------------------------------------------------
-- 4. MEDIUM-5 -- player_assessments: la evaluación no tiene season/team
--    propios (solo player_id) -- se llega al equipo del jugador con un
--    join a players, igual que ya hace player_tracking_entries (step74).
-- -----------------------------------------------------------------------------
drop policy if exists "voir una evaluación según su cercle de partage" on public.player_assessments;
create policy "voir una evaluación según su cercle de partage"
  on public.player_assessments for select to authenticated
  using (
    public.is_platform_controller()
    or (visibility = 'private' and created_by = auth.uid())
    or (visibility = 'team' and exists (
      select 1 from public.players p
      where p.id = player_assessments.player_id
        and public.is_staff_member_of_team(player_assessments.organization_id, p.season, p.team)
    ))
    or (visibility = 'association' and (public.is_staff_member_of(organization_id) or public.shares_association_with(organization_id)))
    -- 'community' quitado a propósito: step48 ya prohíbe ese valor con un
    -- check constraint en esta tabla (nunca puede coincidir de verdad).
  );

drop policy if exists "coaches add assessments for their club" on public.player_assessments;
create policy "coaches add assessments for their team"
  on public.player_assessments for insert to authenticated
  with check (
    exists (
      select 1 from public.players p
      where p.id = player_assessments.player_id
        and public.can_edit_content_for_team(player_assessments.organization_id, p.season, p.team)
    )
  );

drop policy if exists "coaches update their club's assessments" on public.player_assessments;
create policy "coaches update their team's assessments"
  on public.player_assessments for update to authenticated
  using (
    exists (
      select 1 from public.players p
      where p.id = player_assessments.player_id
        and public.can_edit_content_for_team(player_assessments.organization_id, p.season, p.team)
    )
  )
  with check (
    exists (
      select 1 from public.players p
      where p.id = player_assessments.player_id
        and public.can_edit_content_for_team(player_assessments.organization_id, p.season, p.team)
    )
  );

drop policy if exists "coaches remove their club's assessments" on public.player_assessments;
create policy "coaches remove their team's assessments"
  on public.player_assessments for delete to authenticated
  using (
    exists (
      select 1 from public.players p
      where p.id = player_assessments.player_id
        and public.can_edit_content_for_team(player_assessments.organization_id, p.season, p.team)
    )
  );


-- -----------------------------------------------------------------------------
-- 5. MEDIUM-5 -- attendance: igual que player_assessments, se llega al
--    equipo con un join a players vía player_id (no importa si la fila
--    es de un partido, un entreno o un evento -- el jugador siempre
--    tiene su propio season/team).
-- -----------------------------------------------------------------------------
drop policy if exists "club members see their club's attendance" on public.attendance;
create policy "club members see their team's attendance"
  on public.attendance for select to authenticated
  using (
    public.is_platform_controller()
    or exists (
      select 1 from public.players p
      where p.id = attendance.player_id
        and public.is_member_of_team(attendance.organization_id, p.season, p.team)
    )
  );

drop policy if exists "coaches mark attendance for their club" on public.attendance;
create policy "coaches mark attendance for their team"
  on public.attendance for insert to authenticated
  with check (
    exists (
      select 1 from public.players p
      where p.id = attendance.player_id
        and public.can_edit_content_for_team(attendance.organization_id, p.season, p.team)
    )
  );

drop policy if exists "coaches update attendance for their club" on public.attendance;
create policy "coaches update attendance for their team"
  on public.attendance for update to authenticated
  using (
    exists (
      select 1 from public.players p
      where p.id = attendance.player_id
        and public.can_edit_content_for_team(attendance.organization_id, p.season, p.team)
    )
  )
  with check (
    exists (
      select 1 from public.players p
      where p.id = attendance.player_id
        and public.can_edit_content_for_team(attendance.organization_id, p.season, p.team)
    )
  );

drop policy if exists "coaches delete attendance for their club" on public.attendance;
create policy "coaches delete attendance for their team"
  on public.attendance for delete to authenticated
  using (
    public.is_platform_controller()
    or exists (
      select 1 from public.players p
      where p.id = attendance.player_id
        and public.can_edit_content_for_team(attendance.organization_id, p.season, p.team)
    )
  );


-- -----------------------------------------------------------------------------
-- 6. MEDIUM-5 + LOW-12 -- fotos de jugador/licencia: mismo candado de
--    equipo, y el cast a uuid ya no revienta con un path raro.
-- -----------------------------------------------------------------------------
create or replace function public.can_view_player_photo(player_id uuid)
returns boolean language sql security definer stable set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.players p
    where p.id = player_id
      and (public.is_platform_controller() or public.is_staff_member_of_team(p.organization_id, p.season, p.team))
  );
$$;

create or replace function public.can_edit_player_photo(player_id uuid)
returns boolean language sql security definer stable set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.players p
    where p.id = player_id
      and public.can_edit_content_for_team(p.organization_id, p.season, p.team)
  );
$$;

drop policy if exists "club members view player photos" on storage.objects;
create policy "club members view player photos"
  on storage.objects for select to authenticated
  using (
    bucket_id in ('player-photos', 'license-photos')
    and public.can_view_player_photo(public.safe_uuid((storage.foldername(name))[1]))
  );

drop policy if exists "coaches upload player photos" on storage.objects;
create policy "coaches upload player photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('player-photos', 'license-photos')
    and public.can_edit_player_photo(public.safe_uuid((storage.foldername(name))[1]))
  );

drop policy if exists "coaches replace player photos" on storage.objects;
create policy "coaches replace player photos"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('player-photos', 'license-photos')
    and public.can_edit_player_photo(public.safe_uuid((storage.foldername(name))[1]))
  );

drop policy if exists "coaches remove player photos" on storage.objects;
create policy "coaches remove player photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('player-photos', 'license-photos')
    and public.can_edit_player_photo(public.safe_uuid((storage.foldername(name))[1]))
  );


-- -----------------------------------------------------------------------------
-- 7. LOW-12 -- logos (club/equipo): mismo arreglo de cast, sin cambiar
--    quién puede subir/reemplazar/borrar (eso ya es a propósito club
--    entero, step63/64 -- un logo no es un dato sensible de un menor).
-- -----------------------------------------------------------------------------
drop policy if exists "club admins upload their own logo" on storage.objects;
create policy "club admins upload their own logo"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'logos'
    and (
      public.is_admin_of(public.safe_uuid((storage.foldername(name))[1]))
      or public.can_edit_content(public.safe_uuid((storage.foldername(name))[1]))
    )
  );

drop policy if exists "club admins replace their own logo" on storage.objects;
create policy "club admins replace their own logo"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'logos'
    and (
      public.is_admin_of(public.safe_uuid((storage.foldername(name))[1]))
      or public.can_edit_content(public.safe_uuid((storage.foldername(name))[1]))
    )
  );

drop policy if exists "club admins remove their own logo" on storage.objects;
create policy "club admins remove their own logo"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'logos'
    and (
      public.is_admin_of(public.safe_uuid((storage.foldername(name))[1]))
      or public.can_edit_content(public.safe_uuid((storage.foldername(name))[1]))
    )
  );


-- -----------------------------------------------------------------------------
-- 8. HIGH-3 -- refuerzo opcional. La policy de INSERT (step75) ya obliga
--    status='pending' -- esto es un segundo candado, por si alguna policy
--    futura se olvida de repetirlo.
-- -----------------------------------------------------------------------------
create or replace function public.check_association_member_rate_limit()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  pending_count int;
begin
  new.status := 'pending';

  select count(*) into pending_count
  from public.club_association_members
  where organization_id = new.organization_id and status = 'pending';

  if pending_count >= 5 then
    raise exception 'Your club already has 5 pending association requests. Wait for one to be approved or rejected before sending another.';
  end if;

  return new;
end;
$$;

create or replace function public.check_association_proposal_rate_limit()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  pending_count int;
begin
  new.status := 'pending';

  select count(*) into pending_count
  from public.club_associations
  where requested_by = auth.uid() and status = 'pending';

  if pending_count >= 5 then
    raise exception 'You already have 5 pending association proposals waiting for approval. Wait for one to be approved or rejected before proposing another.';
  end if;

  return new;
end;
$$;


-- -----------------------------------------------------------------------------
-- 9. MEDIUM-6 -- search_path en el resto de funciones SECURITY DEFINER
--    del repositorio. No hace falta tocar el cuerpo de ninguna -- ALTER
--    FUNCTION solo le añade este ajuste sin cambiar su lógica.
--    (is_member_of ya se arregló en step75; get_platform_admin_contact ya
--    lo tenía desde step40; las demás ya quedaron con esto puesto arriba
--    en este mismo fichero, al reescribirlas por otro motivo.)
-- -----------------------------------------------------------------------------
alter function public.can_delete_content(org_id uuid) set search_path = public, pg_temp;
alter function public.can_edit_content(org_id uuid) set search_path = public, pg_temp;
alter function public.can_manage_membership_row(target_org_id uuid, target_team_season text, target_team_name text) set search_path = public, pg_temp;
alter function public.can_message(recipient uuid) set search_path = public, pg_temp;
alter function public.handle_new_organization() set search_path = public, pg_temp;
alter function public.handle_new_user() set search_path = public, pg_temp;
alter function public.is_admin_of(org_id uuid) set search_path = public, pg_temp;
alter function public.is_association_validator() set search_path = public, pg_temp;
alter function public.is_platform_controller() set search_path = public, pg_temp;
alter function public.is_player_of(org_id uuid) set search_path = public, pg_temp;
alter function public.prevent_removing_last_admin() set search_path = public, pg_temp;
alter function public.shares_association_with(other_org_id uuid) set search_path = public, pg_temp;
alter function public.sync_exercise_is_shared() set search_path = public, pg_temp;


-- =============================================================================
-- VERIFICAR DESPUÉS DE CORRER ESTO -- confirma que ya no queda ninguna
-- función SECURITY DEFINER sin search_path fijo (debería devolver 0 filas;
-- la propia consulta del informe de Stefano, sección 13):
--
--   select p.proname, p.prosecdef, p.proconfig
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public' and p.prosecdef
--     and (p.proconfig is null or not exists (
--       select 1 from unnest(p.proconfig) c where c like 'search_path=%'
--     ));
--
-- Si sale alguna fila, hay una función SECURITY DEFINER en tu base de
-- datos real que no está en ninguno de los ficheros de este repositorio
-- (creada a mano en el dashboard de Supabase alguna vez, por ejemplo) --
-- mándamela (nombre + código) y la arreglo en otra ronda.
-- =============================================================================
