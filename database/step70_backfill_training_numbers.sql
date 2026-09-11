-- =============================================================================
-- PlayPivot -- step70_backfill_training_numbers
-- =============================================================================
-- A petición de Dani: en Training builder, la columna "#" de la tabla de
-- sesiones ("Sessions") mostraba "—" en todas las sesiones ya existentes
-- (ver captura: "week 1".."week 4", todas con "—" en vez de 1, 2, 3, 4).
--
-- Esto NO es lo mismo que el caso de exercises.created_by / plays.created_by
-- (rondas 4 y 9) -- ahí el dato es imposible de recuperar porque nunca se
-- guardó quién hizo cada cosa. Aquí sí se puede reconstruir: el número de
-- sesión es simplemente el orden cronológico (por fecha) dentro de un mismo
-- equipo/temporada, y eso ya está guardado en la columna "date" de cada
-- sesión -- solo hace falta calcularlo una vez.
--
-- Qué hace exactamente: para cada sesión con number = null, la numera en
-- orden de fecha (la más antigua = 1, la siguiente = 2, etc.) dentro de su
-- propio grupo (mismo club + temporada + equipo + categoría + género),
-- continuando después del número más alto que ya exista en ese grupo si
-- alguna sesión ya tenía un número puesto a mano (no se pisa ni se salta).
--
-- Segura de correr más de una vez: solo toca filas con number IS NULL --
-- una vez numeradas, una segunda ejecución no encuentra nada que cambiar.
-- No cambia ninguna policy RLS.
-- =============================================================================

with existing_max as (
  select organization_id, season, team, team_category, team_gender, max(number) as max_number
  from public.trainings
  where number is not null
  group by organization_id, season, team, team_category, team_gender
),
to_number as (
  select
    t.id,
    t.organization_id, t.season, t.team, t.team_category, t.team_gender,
    row_number() over (
      partition by t.organization_id, t.season, t.team, t.team_category, t.team_gender
      order by t.date asc, t.id asc
    ) as rn
  from public.trainings t
  where t.number is null
)
update public.trainings t
set number = coalesce(em.max_number, 0) + tn.rn
from to_number tn
left join existing_max em
  on em.organization_id = tn.organization_id
  and em.season = tn.season
  and em.team = tn.team
  and em.team_category is not distinct from tn.team_category
  and em.team_gender is not distinct from tn.team_gender
where t.id = tn.id;
