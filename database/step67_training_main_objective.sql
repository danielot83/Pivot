-- =============================================================================
-- PlayPivot -- step67_training_main_objective
-- =============================================================================
-- A petición de Dani: un desplegable "Main objective" en el Training builder
-- (Módulo 3, "New session"), reutilizando la misma lista de enfoques que ya
-- usan los ejercicios (Warm-up, Shooting, Defense...) en vez de inventar un
-- vocabulario nuevo. Guarda un único valor de texto libre (uno de esos
-- nombres) -- no hay tabla nueva ni relación, solo una columna más en
-- "trainings", igual de simple que "category" (age group) que ya existía.
--
-- Seguro de correr más de una vez / sobre una base ya al día:
-- "add column if not exists" no falla si la columna ya está.
-- No cambia ninguna policy RLS -- hereda las que ya existen sobre toda la fila.
-- =============================================================================

alter table public.trainings
  add column if not exists main_objective text;
