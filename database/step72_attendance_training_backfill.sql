-- =============================================================================
-- PlayPivot -- step72_attendance_training_backfill
-- =============================================================================
-- A petición de Dani: el Training builder marcaba la asistencia en su propia
-- tabla "training_attendance" (solo presente/no presente), separada de la
-- tabla "attendance" que ya comparten Match day y el módulo Attendance
-- (present/absent/excused/late) -- por eso una misma sesión podía mostrar
-- cosas distintas en Attendance y en Training builder (ejemplo real: la
-- sesión del 14 de septiembre).
--
-- A partir de ahora Training builder lee y escribe directamente en
-- "attendance" (columna "training_id", igual que "match_id" para los
-- partidos) -- ver training.html, cycleAttendanceStatus(). Este script solo
-- traspasa una vez lo que ya hubiera en "training_attendance" antes del
-- cambio, para no perder el histórico.
--
-- CRITERIO DE DANI para los casos donde las dos tablas no estén de acuerdo
-- para el mismo jugador+sesión: gana Attendance. Por eso este script NUNCA
-- toca una fila de "attendance" que ya exista para ese training_id+player_id
-- -- solo rellena los huecos (jugador+sesión que training_attendance tenía
-- marcado pero que Attendance no tiene ningún registro todavía).
--
-- present = true  -> status = 'present'
-- present = false -> status = 'absent'   (training_attendance no distinguía
--                                          excused/late, así que lo más
--                                          parecido a "no presente" es "absent")
--
-- Seguro de correr más de una vez: el "where not exists" hace que una
-- segunda pasada no inserte nada nuevo. No borra "training_attendance" --
-- se queda ahí sin usar, por si hiciera falta consultarla o deshacer esto.
-- =============================================================================

insert into public.attendance (organization_id, player_id, training_id, status, created_by)
select
  t.organization_id,
  ta.player_id,
  ta.training_id,
  case when ta.present then 'present' else 'absent' end,
  null
from public.training_attendance ta
join public.trainings t on t.id = ta.training_id
where not exists (
  select 1 from public.attendance a
  where a.training_id = ta.training_id
    and a.player_id = ta.player_id
);
