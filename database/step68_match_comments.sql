-- =============================================================================
-- PlayPivot -- step68_match_comments
-- =============================================================================
-- A petición de Dani: un campo "Comments" corto en Match details, para poder
-- anotar cosas como "Final", "Semifinal", "Cuartos" en un torneo (o
-- cualquier otra nota corta sobre el partido). Texto libre, no un
-- desplegable -- cada torneo llama a sus fases de forma distinta.
--
-- Seguro de correr más de una vez / sobre una base ya al día:
-- "add column if not exists" no falla si la columna ya está.
-- No cambia ninguna policy RLS -- hereda las que ya existen sobre toda la fila.
-- =============================================================================

alter table public.matches
  add column if not exists comments text;
