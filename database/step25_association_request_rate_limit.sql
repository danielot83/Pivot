-- =============================================================================
-- Pivot Cloud — Étape 25 : limite anti-spam sur les demandes d'association
-- (avec un message d'erreur clair, pas juste un refus silencieux de RLS)
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Rien n'empêchait aujourd'hui un club de créer des centaines de
-- demandes d'association (nouvelles ou pour rejoindre) d'affilée --
-- gênant pour le contrôleur/validateur qui doit les trier, et une porte
-- ouverte à un abus simple (un script qui boucle sur l'insertion).
--
-- Limite choisie : un club ne peut pas avoir plus de 5 demandes
-- "pending" en même temps (tous types confondus) ; une même personne ne
-- peut pas non plus avoir plus de 5 nouvelles associations "pending" en
-- attente. Large pour un usage normal, mais bloque un abus basique --
-- avec un message clair au lieu du refus muet et confus de RLS.
-- =============================================================================

create or replace function public.check_association_member_rate_limit()
returns trigger as $$
declare
  pending_count int;
begin
  select count(*) into pending_count
  from public.club_association_members
  where organization_id = new.organization_id and status = 'pending';

  if pending_count >= 5 then
    raise exception 'Your club already has 5 pending association requests. Wait for one to be approved or rejected before sending another.';
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_association_member_rate_limit on public.club_association_members;
create trigger trg_association_member_rate_limit
  before insert on public.club_association_members
  for each row execute function public.check_association_member_rate_limit();

create or replace function public.check_association_proposal_rate_limit()
returns trigger as $$
declare
  pending_count int;
begin
  select count(*) into pending_count
  from public.club_associations
  where requested_by = auth.uid() and status = 'pending';

  if pending_count >= 5 then
    raise exception 'You already have 5 pending association proposals waiting for approval. Wait for one to be approved or rejected before proposing another.';
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_association_proposal_rate_limit on public.club_associations;
create trigger trg_association_proposal_rate_limit
  before insert on public.club_associations
  for each row execute function public.check_association_proposal_rate_limit();
