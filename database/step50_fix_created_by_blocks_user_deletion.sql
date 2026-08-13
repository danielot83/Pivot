-- =============================================================================
-- Pivot Cloud — Étape 50 : ne plus bloquer la suppression d'un compte
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Plusieurs colonnes "created_by"/"requested_by"/"decided_by" pointent
-- vers auth.users SANS dire quoi faire si ce compte est supprimé.
-- Par défaut, Postgres BLOQUE la suppression dans ce cas (erreur de
-- contrainte de clé étrangère) -- ce que le tableau de bord Supabase
-- affiche parfois, à tort, comme "User not found" au lieu du vrai
-- message d'erreur.
--
-- Le contenu créé par quelqu'un (un exercice, une jugada, une
-- évaluation...) appartient au club, pas à son compte -- donc la bonne
-- réponse n'est ni de tout bloquer, ni de supprimer ce contenu avec la
-- personne. On garde le contenu et on vide juste la référence
-- (ON DELETE SET NULL).
--
-- Cherche le VRAI nom de chaque contrainte au lieu de le deviner --
-- plus sûr que de supposer la convention de nommage par défaut de
-- Postgres, qui peut varier si la contrainte a été créée autrement.
-- =============================================================================

do $$
declare
  found_conname text;
  target_cols text[][] := array[
    array['exercises', 'created_by'],
    array['plays', 'created_by'],
    array['matches', 'created_by'],
    array['trainings', 'created_by'],
    array['player_assessments', 'created_by'],
    array['players', 'created_by'],
    array['notebooks', 'created_by'],
    array['teams', 'created_by'],
    array['club_associations', 'requested_by'],
    array['club_associations', 'decided_by'],
    array['club_association_members', 'requested_by'],
    array['club_association_members', 'decided_by']
  ];
  pair text[];
begin
  foreach pair slice 1 in array target_cols loop
    -- trouve la vraie contrainte de clé étrangère sur cette colonne (s'il y en a une)
    select con.conname into found_conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any(con.conkey)
    where con.contype = 'f'
      and rel.relnamespace = 'public'::regnamespace
      and rel.relname = pair[1]
      and att.attname = pair[2]
    limit 1;

    if found_conname is not null then
      execute format('alter table public.%I drop constraint %I', pair[1], found_conname);
    end if;

    execute format(
      'alter table public.%I add constraint %I foreign key (%I) references auth.users(id) on delete set null',
      pair[1], pair[1] || '_' || pair[2] || '_fkey', pair[2]
    );
    found_conname := null;
  end loop;
end $$;

-- "requested_by" était "not null" à l'origine (step18) -- on assouplit
-- ça aussi, sinon SET NULL romprait cette contrainte le jour où
-- quelqu'un qui a demandé une adhésion supprime son compte.
alter table public.club_associations alter column requested_by drop not null;
alter table public.club_association_members alter column requested_by drop not null;
