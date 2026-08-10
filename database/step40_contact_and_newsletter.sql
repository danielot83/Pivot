-- =============================================================================
-- Pivot Cloud — Étape 40 : contacter l'admin de la plateforme + liste
-- d'inscription à une newsletter (l'envoi lui-même se fait ailleurs)
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Le système de messages (étape 28) autorise déjà n'importe qui à
-- écrire à un is_platform_controller -- rien à changer côté base de
-- données pour ça, juste un bouton visible côté interface.
--
-- Pour la newsletter : cette étape ajoute seulement la case à cocher
-- (qui veut recevoir des nouvelles occasionnelles) et une manière pour
-- toi de récupérer la liste. Pivot Cloud n'envoie aucun email tout
-- seul -- il n'y a pas de service d'envoi connecté (Resend, SMTP,
-- etc.) -- donc l'envoi lui-même se fait de ton côté, avec la liste
-- récupérée ici.
-- =============================================================================

alter table public.profiles add column if not exists newsletter_opt_in boolean not null default false;

comment on column public.profiles.newsletter_opt_in is
  'Coché par la personne elle-même : veut recevoir des nouvelles occasionnelles sur les nouveautés de Pivot (jamais coché par défaut, jamais automatique).';

-- -----------------------------------------------------------------------------
-- Trouver qui contacter -- une personne normale ne peut voir AUCUN
-- profil sauf le sien (règle "see own profile, or all if controller"),
-- donc une simple requête sur profiles ne trouverait jamais Daniel.
-- Cette fonction expose UNIQUEMENT id/nom des contrôleurs de
-- plateforme, rien de plus -- pas une porte dérobée vers le reste des
-- profils.
-- -----------------------------------------------------------------------------
create or replace function public.get_platform_admin_contact()
returns table (id uuid, full_name text)
security definer
set search_path = public
language sql stable as $$
  select p.id, p.full_name from public.profiles p where p.is_platform_controller = true;
$$;

grant execute on function public.get_platform_admin_contact() to authenticated;
