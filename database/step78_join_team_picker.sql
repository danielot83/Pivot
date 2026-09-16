-- =============================================================================
-- PlayPivot -- step78_join_team_picker
-- =============================================================================
-- Nico (coach nuevo), vía Dani, 2026-09-16: unirse a un club/equipo
-- obligaba a escribir el nombre EXACTO en un popup -- si no coincidía
-- letra por letra, "el equipo no existe". Dani aclaró después: además
-- de elegir el CLUB (p.ej. "Dell"), hace falta poder elegir el EQUIPO
-- concreto dentro de ese club (p.ej. U8 o U10) -- y si el equipo que
-- busca no existe todavía, poder pedir que se cree, sujeto a que el
-- admin del club lo apruebe.
--
-- Esta migración es la parte de base de datos. El código (login.html,
-- dashboard.html, org-switcher.js) va en el mismo zip.
--
-- -----------------------------------------------------------------------------
-- 1. Hallazgo, no pedido por Dani: el desplegable de clubes al registrarse
--    (login.html, "Which one?") ya estaba pensado para funcionar SIN estar
--    todavía conectado -- por eso organizations tiene una policy que deja
--    ver los clubes activos "to authenticated". El problema: durante el
--    registro, antes de crear la cuenta, el navegador todavía NO tiene
--    sesión -- solo lleva la clave pública (anon), así que Postgres lo ve
--    como el rol "anon", no "authenticated". Una policy "to authenticated"
--    no aplica a peticiones "anon" -- el resultado es 0 filas, no un
--    error, así que pasaba desapercibido: el desplegable se veía "vacío"
--    ("None yet -- create the first one!") aunque hubiera clubes de
--    verdad. Esto ya estaba así antes de esta ronda -- no lo rompimos
--    ahora, pero al tocar este mismo flujo para añadir el equipo,
--    convenía arreglarlo también (si no, el desplegable de EQUIPO
--    tampoco habría funcionado nunca en el registro).
--
--    Arreglo: añadir el rol "anon" a esta misma policy, sin cambiar su
--    condición (is_active = true, o ser miembro, o ser el controller) --
--    para "anon", is_member_of()/is_platform_controller() ya evalúan a
--    falso sola (no hay auth.uid()), así que en la práctica un visitante
--    sin cuenta sigue viendo solo los clubes ACTIVOS, nada más -- ni un
--    dato nuevo respecto a lo que esta misma policy ya pretendía mostrar.
-- -----------------------------------------------------------------------------
drop policy if exists "see active club names to join, or full access if member/controller" on public.organizations;
create policy "see active club names to join, or full access if member/controller"
  on public.organizations for select
  to authenticated, anon
  using (
    is_active = true
    or public.is_member_of(id)
    or public.is_platform_controller()
  );

-- -----------------------------------------------------------------------------
-- 2. Mismo problema, mismo arreglo, para el registro de equipos (teams) --
--    hace falta poder verlos ANTES de ser miembro del club, para el
--    desplegable nuevo de "¿qué equipo?". Se añade una condición más a la
--    policy que ya existía (los miembros del club la siguen usando igual
--    que antes) en vez de crear una policy aparte.
-- -----------------------------------------------------------------------------
drop policy if exists "voir les équipes de son club" on public.teams;
-- Hotfix (2026-09-16, tras el primer intento de Dani): el nombre nuevo
-- tiene más de 63 caracteres -- Postgres los identificadores (incluido
-- el nombre de una policy) los trunca en silencio a 63, así que la
-- policy de verdad quedó guardada como "...para uni" (sin el resto).
-- Sin un "drop" para ESE mismo nombre antes de crearla, correr este
-- fichero una segunda vez chocaba contra sí mismo ("policy already
-- exists") -- ya no, con esta línea (el drop se trunca igual que el
-- create, así que sí encuentra y quita la que ya existe).
drop policy if exists "ver los equipos de un club (miembro, platform admin, o para unirse)" on public.teams;
create policy "ver los equipos de un club (miembro, platform admin, o para unirse)"
  on public.teams for select
  to authenticated, anon
  using (
    public.is_staff_member_of(organization_id)
    or public.is_platform_controller()
    or exists (select 1 from public.organizations o where o.id = teams.organization_id and o.is_active = true)
  );

-- -----------------------------------------------------------------------------
-- 3. memberships -- 3 columnas nuevas para poder pedir un equipo que
--    todavía no existe. Reutilizamos team_season/team_name (ya existían
--    desde step53) para guardar el equipo elegido O propuesto -- no hace
--    falta duplicarlas. Lo que sí falta es dónde guardar categoría y
--    género (team_season/team_name no los llevan) y una señal clara para
--    quien aprueba de "este equipo es nuevo, no existe todavía".
--
--    No hace falta tocar la policy de INSERT ("anyone can request to join
--    a club (never directly as admin)", step55) -- ya deja escribir
--    cualquier columna en la fila, solo exige user_id/status/role; añadir
--    estas 3 no cambia nada de esa comprobación.
-- -----------------------------------------------------------------------------
alter table public.memberships add column if not exists requested_team_category text;
alter table public.memberships add column if not exists requested_team_gender text;
alter table public.memberships add column if not exists requested_team_is_new boolean not null default false;

comment on column public.memberships.requested_team_is_new is
  'true = quien pidió unirse propuso un equipo que NO existe todavía en "teams" -- al aprobar, el admin decide si lo crea (con team_season/team_name/requested_team_category/requested_team_gender) o si en realidad quería decir un equipo ya existente.';

-- Seguro de correr más de una vez.
