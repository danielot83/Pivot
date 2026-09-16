-- =============================================================================
-- PlayPivot -- step71_training_exercises_match
-- =============================================================================
-- Ronda 13 (2026-09-14): Nico/Dani -- "En training hay que meter pausa (ya
-- esta) y partido 5c5 3c3". Este fichero es el que faltaba en tu repo
-- (auditoría de seguridad, ronda 28, 2026-09-16, test de humo) -- el
-- botón "Add match" de training.html ya usa estas dos columnas en
-- producción (session_exercises: is_match, match_format), así que lo
-- más probable es que ya las hayas corrido desde el zip original de la
-- ronda 13 -- esto solo repone el fichero que faltaba en la carpeta
-- database/ para que el repositorio sea una foto completa. Seguro de
-- correr más de una vez (add column if not exists).
-- =============================================================================

alter table public.training_exercises add column if not exists is_match boolean not null default false;
alter table public.training_exercises add column if not exists match_format text;

comment on column public.training_exercises.is_match is
  'true = esta fila del plan de la sesión es un partido/scrimmage (5v5 o 3v3), no un ejercicio ni una pausa -- exercise_id se guarda a null, igual que ya se hacía para is_pause.';
comment on column public.training_exercises.match_format is
  '"5v5" o "3v3" -- solo tiene sentido cuando is_match es true.';
