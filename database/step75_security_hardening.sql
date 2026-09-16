-- =============================================================================
-- PlayPivot -- step75_security_hardening
-- =============================================================================
-- Origen: revisión de seguridad externa de Stefano (2026-09-16), "PlayPivot —
-- Security Review". Cubre, de los 12 hallazgos del informe, los que se
-- pudieron arreglar sin ver ficheros que no están en esta sesión (team-tree.js,
-- login.html, y casi todas las migraciones SQL originales, steps 1-66 -- esta
-- sesión de Claude solo tiene guardadas las suyas propias, steps 67-74). Los
-- que se dejan pendientes por eso, con lo que hace falta para completarlos,
-- están listados al final de este fichero y en el LEEME de esta ronda.
--
-- CUBIERTO AQUÍ:
--   CRITICAL-1 -- cualquiera podía hacerse platform admin (profiles)
--   HIGH-3     -- autoaprobación de una asociación entre clubes
--   HIGH-4     -- un coach podía expulsar a cualquiera, admins incluidos
--   LOW-10     -- "marcar mensaje como leído" permitía reescribir el mensaje
--   MEDIUM-7 (parcial) -- is_member_of() ahora respeta cuenta/club bloqueados
--   MEDIUM-5 (parcial) -- player_tracking_entries limitado al equipo del
--                          coach, no a todo el club (Dani: "solo su equipo")
--
-- Seguro de correr más de una vez: "drop policy if exists" antes de cada
-- policy nueva, "create or replace function" en las funciones.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- CRITICAL-1 -- cualquier cuenta autenticada podía hacerse platform admin
-- -----------------------------------------------------------------------------
-- profiles guarda en la misma fila los datos normales de una persona (nombre,
-- preferencias...) Y los flags de privilegio de toda la plataforma
-- (is_platform_controller, is_association_validator...). La policy "update
-- own profile" (pivot_cloud_step2_english_and_join_requests.sql) deja
-- editar tu propia fila entera -- RLS controla FILAS, no columnas, así que
-- sin esto cualquier persona podía mandar
--   supabaseClient.from('profiles').update({ is_platform_controller: true })
-- y convertirse en superadmin de toda la app en una sola petición.
--
-- Dos capas:
--   1) GRANT por columna -- lo único que de verdad puede restringir columnas,
--      RLS no puede. Solo se dejan escribir las columnas que la propia app
--      ya actualiza hoy desde el cliente (comprobado grepeando ".update("
--      contra profiles en los 13 ficheros .html de esta sesión):
--        - terms_accepted_at (dashboard.html, al aceptar los términos)
--        - last_seen, onboarded_at (dashboard.html)
--        - is_association_validator (settings.html, panel de platform admin)
--        - full_name, newsletter_opt_in -- no se ha visto ningún UPDATE real
--          en los ficheros de esta sesión, pero la propia revisión de
--          Stefano los da como editables desde el cliente (probablemente en
--          login.html/onboarding, que esta sesión no tiene) -- se dejan
--          igualmente, no cuesta nada tenerlos de más.
--      NO se deja is_platform_controller, is_active ni email -- ningún
--      fichero de esta sesión los actualiza vía cliente.
--   2) Trigger -- red de seguridad: aunque la columna sea escribible (caso
--      de is_association_validator, que SÍ hace falta que un platform admin
--      pueda cambiar desde settings.html), si quien escribe NO es el
--      platform controller, el valor nuevo se descarta y se deja el de
--      siempre -- así que settings.html sigue funcionando para Dani, pero
--      nadie más puede autoconcederse el flag por ese mismo camino.
-- -----------------------------------------------------------------------------

revoke update on public.profiles from authenticated;
grant update (
  full_name, newsletter_opt_in, onboarded_at, last_seen,
  terms_accepted_at, is_association_validator
) on public.profiles to authenticated;

create or replace function public.protect_profile_privileges()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_platform_controller() then
    new.is_platform_controller   := old.is_platform_controller;
    new.is_association_validator := old.is_association_validator;
    new.is_active                := old.is_active;
    new.email                    := old.email;
  end if;
  return new;
end $$;

drop trigger if exists trg_protect_profile_privileges on public.profiles;
create trigger trg_protect_profile_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();


-- -----------------------------------------------------------------------------
-- HIGH-3 -- una asociación entre clubes se podía autoaprobar
-- -----------------------------------------------------------------------------
-- Ninguna de las dos policies de INSERT comprobaba la columna "status" --
-- un club podía insertar su propia propuesta de asociación (o su propia
-- entrada en una asociación ya existente, si sabía el UUID) directamente
-- como 'approved', saltándose por completo la validación del platform admin
-- (is_association_validator) y exponiendo entre clubes datos de menores
-- (evaluaciones, estadísticas de partido, asistencia) protegidos por
-- visibility='association'.
-- -----------------------------------------------------------------------------

drop policy if exists "un membre actif peut proposer une association" on public.club_associations;
create policy "un membre actif peut proposer une association"
  on public.club_associations for insert to authenticated
  with check (requested_by = auth.uid() and status = 'pending');

drop policy if exists "un admin de club demande à rejoindre pour son club" on public.club_association_members;
create policy "un admin de club demande à rejoindre pour son club"
  on public.club_association_members for insert to authenticated
  with check (
    requested_by = auth.uid()
    and status = 'pending'
    and exists (
      select 1 from public.memberships m
      where m.organization_id = club_association_members.organization_id
        and m.user_id = auth.uid() and m.role = 'admin' and m.status = 'active'
    )
  );


-- -----------------------------------------------------------------------------
-- HIGH-4 -- un coach podía expulsar a cualquiera del club, admins incluidos
-- -----------------------------------------------------------------------------
-- La policy de DELETE en memberships usaba can_delete_content(organization_id)
-- -- tras step55, esa función es "platform admin O role in (admin, coach)",
-- igual que can_edit_content. El resto de operaciones sobre memberships ya
-- pasan correctamente por can_manage_membership_row (solo admin, y limitado
-- a su equipo) -- DELETE era la única que se saltaba ese control.
-- -----------------------------------------------------------------------------

drop policy if exists "admin/coach del club (o platform admin) puede sacar a otra persona" on public.memberships;
create policy "un admin de sa portee peut retirer un membre"
  on public.memberships for delete to authenticated
  using (public.can_manage_membership_row(organization_id, team_season, team_name));

-- La policy de auto-salida (step49, "using (user_id = auth.uid())") es
-- aparte y no se toca -- las dos coexisten bien, las policies de RLS se
-- combinan con OR.


-- -----------------------------------------------------------------------------
-- LOW-10 -- "marcar como leído" permitía reescribir el contenido del mensaje
-- -----------------------------------------------------------------------------
drop policy if exists "un destinataire peut marquer un message comme lu" on public.messages;
-- (si el nombre real de la policy es distinto, esta línea no hace nada --
-- la policy de RLS existente no cambia, pero el GRANT de abajo sí actúa
-- igualmente sobre la tabla entera)

revoke update on public.messages from authenticated;
grant update (read_at) on public.messages to authenticated;


-- -----------------------------------------------------------------------------
-- MEDIUM-7 (parcial) -- bloquear una cuenta o un club no hacía nada
-- -----------------------------------------------------------------------------
-- profiles.is_active y organizations.is_active existían pero ninguna policy
-- los consultaba -- bloquear a alguien (o a un club entero) no le quitaba
-- ningún acceso real. Arreglado para is_member_of(), que es el que usan la
-- mayoría de tablas operativas (attendance, player-photos, etc.).
--
-- OJO -- is_staff_member_of(), is_member_of_team() y is_staff_member_of_team()
-- necesitan el mismo arreglo (mismo hallazgo, MEDIUM-7 completo) pero esta
-- sesión no tiene su definición actual para tocarlos sin arriesgarse a
-- romper algo -- ver la nota al final de este fichero.
-- -----------------------------------------------------------------------------

create or replace function public.is_member_of(org_id uuid)
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

-- is_platform_controller() NO debe llevar este mismo candado -- si alguna
-- vez is_active de Dani se pusiera a false por error, esto evita que se
-- quede fuera de su propia plataforma sin forma de arreglarlo él mismo.


-- -----------------------------------------------------------------------------
-- MEDIUM-5 (parcial) -- Seguimiento (player_tracking_entries) limitado al
-- equipo del coach, no a todo el club
-- -----------------------------------------------------------------------------
-- Decisión de Dani (2026-09-16): un coach asignado a un equipo concreto solo
-- debe ver/editar el seguimiento de SU equipo, no el de todo el club. Un
-- admin (o un coach sin equipo concreto asignado -- team_season/team_name a
-- null en su membership, "todo el club") sigue viendo todo, igual que antes.
--
-- Esta es la única tabla de las que salen en el hallazgo (players,
-- player_assessments, player_tracking_entries, attendance, las fotos de
-- jugador) que se arregla en esta ronda -- es la única cuyas 4 policies
-- actuales están escritas exactamente en step74 (de esta misma sesión), así
-- que se puede tocar con seguridad. Las demás (players, player_assessments,
-- attendance, los buckets de fotos) necesitan verse primero -- ver la nota
-- al final.
-- -----------------------------------------------------------------------------

drop policy if exists "player_tracking_select_org_members" on public.player_tracking_entries;
create policy "player_tracking_select_team_scoped"
  on public.player_tracking_entries for select to authenticated
  using (
    public.is_platform_controller() or exists (
      select 1
      from public.players pl
      join public.memberships m
        on m.organization_id = pl.organization_id
       and m.user_id = auth.uid()
       and m.status = 'active'
      where pl.id = player_tracking_entries.player_id
        and pl.organization_id = player_tracking_entries.organization_id
        and ((m.team_season is null and m.team_name is null)
             or (m.team_season = pl.season and m.team_name = pl.team))
    )
  );

drop policy if exists "player_tracking_insert_org_members" on public.player_tracking_entries;
create policy "player_tracking_insert_team_scoped"
  on public.player_tracking_entries for insert to authenticated
  with check (
    public.is_platform_controller() or exists (
      select 1
      from public.players pl
      join public.memberships m
        on m.organization_id = pl.organization_id
       and m.user_id = auth.uid()
       and m.status = 'active'
       and m.role in ('admin', 'coach')
      where pl.id = player_tracking_entries.player_id
        and pl.organization_id = player_tracking_entries.organization_id
        and ((m.team_season is null and m.team_name is null)
             or (m.team_season = pl.season and m.team_name = pl.team))
    )
  );

drop policy if exists "player_tracking_update_org_members" on public.player_tracking_entries;
create policy "player_tracking_update_team_scoped"
  on public.player_tracking_entries for update to authenticated
  using (
    public.is_platform_controller() or exists (
      select 1
      from public.players pl
      join public.memberships m
        on m.organization_id = pl.organization_id
       and m.user_id = auth.uid()
       and m.status = 'active'
       and m.role in ('admin', 'coach')
      where pl.id = player_tracking_entries.player_id
        and pl.organization_id = player_tracking_entries.organization_id
        and ((m.team_season is null and m.team_name is null)
             or (m.team_season = pl.season and m.team_name = pl.team))
    )
  );

drop policy if exists "player_tracking_delete_org_members" on public.player_tracking_entries;
create policy "player_tracking_delete_team_scoped"
  on public.player_tracking_entries for delete to authenticated
  using (
    public.is_platform_controller() or exists (
      select 1
      from public.players pl
      join public.memberships m
        on m.organization_id = pl.organization_id
       and m.user_id = auth.uid()
       and m.status = 'active'
       and m.role in ('admin', 'coach')
      where pl.id = player_tracking_entries.player_id
        and pl.organization_id = player_tracking_entries.organization_id
        and ((m.team_season is null and m.team_name is null)
             or (m.team_season = pl.season and m.team_name = pl.team))
    )
  );


-- =============================================================================
-- VERIFICAR ANTES Y DESPUÉS DE CORRER ESTO (recomendado por la propia
-- revisión de Stefano) -- confirmar que nadie ha abusado ya de CRITICAL-1:
--
--   select id, email, is_platform_controller, is_association_validator
--   from public.profiles
--   where is_platform_controller or is_association_validator;
--
-- Se espera EXACTAMENTE una fila (daniel.ortiz@epfl.ch). Cualquier otra fila
-- es un incidente, no algo de este script -- avisar antes de seguir.
-- =============================================================================


-- =============================================================================
-- PENDIENTE -- lo que el informe de Stefano marca y que esta sesión no pudo
-- tocar sin ver el fichero/la definición real primero (más detalle en el
-- LEEME de esta ronda):
--
--   HIGH-2    -- el XSS de verdad está en team-tree.js (2 sitios) -- esta
--                sesión no tiene ese fichero.
--   MEDIUM-5  -- players (INSERT/UPDATE/DELETE), player_assessments y
--                attendance necesitan el mismo tipo de arreglo que
--                player_tracking_entries arriba, pero sus policies actuales
--                no están en ningún fichero de esta sesión.
--   MEDIUM-6  -- a las otras 34 funciones SECURITY DEFINER (de 36) les falta
--                "set search_path = public, pg_temp" -- hace falta el cuerpo
--                actual de cada una para tocarlas sin arriesgarse a
--                romperlas.
--   MEDIUM-7  -- is_staff_member_of(), is_member_of_team() y
--                is_staff_member_of_team() necesitan el mismo arreglo que
--                is_member_of() de arriba.
--   LOW-9     -- el consent log (terms_acceptances) necesita una función RPC
--                Y que el sitio del cliente que hoy hace el INSERT directo
--                (probablemente login.html, que esta sesión no tiene) pase a
--                llamar a esa función -- si se cambia solo el lado SQL sin
--                tocar ese fichero, aceptar los términos se rompe.
--   LOW-12    -- las policies de storage (fotos de jugador/licencia, logos)
--                necesitan verse primero para no romper su lógica actual.
--
-- Con el fichero database/ completo (o al menos steps 1-66) y team-tree.js/
-- login.html, se puede completar todo esto en la próxima ronda.
-- =============================================================================
