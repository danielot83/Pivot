-- =============================================================================
-- PlayPivot -- step73_matches_coaches
-- =============================================================================
-- A petición de Dani: poder anotar varios coaches en un partido de Match
-- day, igual que ya se puede en Training builder (Coach 1/2/3, desde la
-- ronda 2). "matches" solo tenía un campo de texto suelto "coach" -- se
-- añade "coaches" (lista, hasta 3 nombres desde la app) al lado, mismo
-- patrón que "trainings.coaches".
--
-- No se borra la columna vieja "coach" -- se queda ahí sin usar (la app ya
-- no la lee ni la escribe desde esta ronda) por si hiciera falta consultar
-- el histórico. Los partidos que ya tuvieran un coach anotado ahí se
-- traspasan una vez a "coaches" para no perder ese dato al abrir un partido
-- antiguo en el formulario nuevo.
--
-- Seguro de correr más de una vez: "add column if not exists" no falla si
-- la columna ya está, y el traspaso solo toca partidos cuyo "coaches"
-- siga vacío (una segunda pasada no encuentra nada que cambiar). No cambia
-- ninguna policy RLS.
-- =============================================================================

alter table public.matches
  add column if not exists coaches jsonb not null default '[]'::jsonb;

update public.matches
set coaches = jsonb_build_array(coach)
where coach is not null
  and trim(coach) <> ''
  and coaches = '[]'::jsonb;
