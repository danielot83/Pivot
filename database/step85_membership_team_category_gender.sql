-- =============================================================================
-- PlayPivot -- step85_membership_team_category_gender
-- =============================================================================
-- Run in Supabase: SQL Editor -> New query -> paste -> Run.
--
-- Dani, 2026-09-29 (captura de "Team org chart" mostrando "COACH · DEL
-- BASKET SAINT SULPICE" en vez de "COACH · U8" / "COACH · U8, U10"):
-- "debería aparecer el equipo, y si es de los dos entonces poner u8, u10
-- etc...".
--
-- Causa real: "memberships" solo guarda team_season + team_name (step53)
-- -- nunca llegó a tener team_category/team_gender, a pesar de que
-- matches/trainings/plays/events/players/teams sí los tienen desde hace
-- varios pasos (step41/step59/step62). En un club donde dos equipos
-- comparten el mismo "team" (nombre) y solo se distinguen por categoría
-- (p.ej. los dos se llaman "Del Basket Saint Sulpice" pero uno es U8 y
-- el otro U10), no había forma de que la membresía de un coach dijera A
-- CUÁL de los dos pertenece -- por eso el organigrama solo podía enseñar
-- el nombre genérico del equipo, igual para ambos.
--
-- Esto ya existía a medias: step78 añadió requested_team_category/
-- requested_team_gender, pero SOLO para la solicitud pendiente de unirse
-- -- en cuanto el admin la aprobaba, esas dos columnas se perdían (el
-- código de aprobar solo copiaba el status a "active", nada más). Este
-- paso añade las columnas "de verdad" (viven mientras la membresía esté
-- activa, no solo durante la solicitud) y el código que las acompaña
-- (mismo zip) las rellena al aprobar y permite elegirlas a mano desde
-- Settings -> Members.
-- =============================================================================

alter table public.memberships add column if not exists team_category text;
alter table public.memberships add column if not exists team_gender text;

comment on column public.memberships.team_category is
  'Categoría (U8, U10...) del equipo al que está acotada esta membresía -- null = no distingue categoría (todo el "team_name", o todo el club si team_name también es null). Igual que players.team_category/teams.team_category, no un valor nuevo distinto.';
comment on column public.memberships.team_gender is
  'Género (Boys/Girls/Mixed...) del equipo al que está acotada esta membresía -- mismo criterio que team_category.';

-- Nota importante: esto NO adivina la categoría de las membresías que ya
-- existían antes de este paso -- quedan con team_category/team_gender en
-- null (siguen viéndose como "todo team_name", igual que hasta ahora,
-- nada cambia para nadie). Si de verdad un coach dirige solo una
-- categoría concreta dentro de un team_name compartido por varias, hay
-- que ir a Settings -> Members y volver a elegir su equipo ahí -- ahora
-- el desplegable sí distingue categoría/género, antes los mezclaba todos
-- bajo la misma opción.
