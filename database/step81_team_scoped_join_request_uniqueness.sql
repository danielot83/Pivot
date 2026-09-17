-- =============================================================================
-- PlayPivot -- step81_team_scoped_join_request_uniqueness
-- =============================================================================
-- Dani, 2026-09-17, mandó una captura: al pedir unirse a un club ("Request
-- to join a club") eligiendo "+ My team isn't listed — request a new one",
-- el formulario devuelve el error crudo de Postgres:
--
--   duplicate key value violates unique constraint
--   "memberships_organization_id_user_id_key"
--
-- Causa raíz
-- ----------
-- `memberships` nació (pivot_cloud_step2_schema.sql, línea 81) con
-- `unique (organization_id, user_id)`: como en ese momento "ser miembro de
-- un club" era una sola cosa (sin equipos dentro de un club), un usuario
-- solo podía tener UNA fila por club, punto.
--
-- Ese supuesto dejó de ser cierto en step53_team_scoped_membership (añade
-- `team_name`/`team_season` para que una adhesión pueda estar acotada a UN
-- equipo concreto dentro del club, no al club entero) y sobre todo en
-- step78_join_team_picker (el formulario de "pedir unirse" ya deja elegir
-- un equipo concreto, o pedir uno nuevo). Desde entonces, un mismo usuario
-- SÍ puede legítimamente necesitar más de una fila en `memberships` para el
-- mismo club -- p. ej. alguien que ya es coach de un equipo del club
-- ("Palinzards") y pide entrar TAMBIÉN como coach de un segundo equipo
-- nuevo ("Adults") del mismo club -- pero la constraint original de 2025
-- nunca se actualizó y lo sigue bloqueando en seco, con un mensaje de
-- error que ni siquiera es legible para quien lo pide.
--
-- No es solo un problema de redacción del mensaje: la fila NUNCA llega a
-- crearse, así que el admin no ve nada que aprobar -- la solicitud se
-- pierde en el sitio, como pasaba antes con el fallo de `user_id` que se
-- corrigió en la ronda anterior.
--
-- Arreglo
-- -------
-- Se sustituye la constraint única de "una fila por club" por dos índices
-- únicos PARCIALES, que reflejan lo que el producto realmente permite hoy:
--
--   1. Como mucho una fila SIN equipo concreto (acceso a "todo el club")
--      por usuario y club -- el comportamiento histórico, para quien no
--      elige equipo (p. ej. quien crea el club, `role='admin'` sin
--      team_name/team_season).
--   2. Como mucho una fila por usuario+club+equipo concreto -- permite
--      varias filas para el mismo club siempre que sean de EQUIPOS
--      distintos, pero sigue bloqueando pedir el mismo equipo dos veces
--      (la propia solicitud duplicada, que sí debe rechazarse).
--
-- Como la constraint vieja era MÁS estricta que las dos nuevas juntas (no
-- dejaba ni un duplicado de ningún tipo), no puede haber datos ya
-- guardados que violen los índices nuevos -- no hace falta limpiar nada
-- antes de crearlos.
--
-- `dashboard.html` (mismo zip) también cambia: el `catch` de "Send
-- request" ahora reconoce este tipo de error (código Postgres 23505) y
-- muestra un mensaje humano en vez del texto crudo de la base de datos,
-- para el caso en que sí sea un duplicado real (pedir el mismo equipo dos
-- veces).
-- =============================================================================

alter table public.memberships
  drop constraint if exists memberships_organization_id_user_id_key;

create unique index if not exists memberships_org_user_team_key
  on public.memberships (organization_id, user_id, team_name, team_season)
  where team_name is not null and team_season is not null;

create unique index if not exists memberships_org_user_whole_club_key
  on public.memberships (organization_id, user_id)
  where team_name is null and team_season is null;

-- =============================================================================
-- VERIFICAR DESPUÉS DE CORRER ESTO:
--   select conname from pg_constraint where conrelid = 'public.memberships'::regclass;
--   -- ya NO debe aparecer "memberships_organization_id_user_id_key"
--   select indexname from pg_indexes where tablename = 'memberships';
--   -- deben aparecer memberships_org_user_team_key y
--   -- memberships_org_user_whole_club_key
--
--   Y en la app: con una cuenta que ya sea miembro/admin de un club, abrir
--   "+ Join a club" (o "Request to join a club" desde "You need a club"),
--   elegir ESE MISMO club y "My team isn't listed — request a new one" con
--   un nombre de equipo distinto al que ya tiene -- debe crear la
--   solicitud sin error. Repetir la MISMA solicitud (mismo club + mismo
--   nombre de equipo + misma temporada) una segunda vez sí debe seguir
--   dando error, pero ahora con un mensaje legible en vez del texto crudo
--   de Postgres.
-- =============================================================================
