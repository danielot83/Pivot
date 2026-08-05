-- =============================================================================
-- Pivot Cloud — Étape 28 : un message avec chaque demande, + messagerie
-- =============================================================================
-- Run in Supabase: SQL Editor → New query → paste → Run.
-- Requiere haber aplicado antes step18 (asociaciones) y step21 (validadores).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Un message optionnel accroché à chaque demande -- pas une nouvelle
--    conversation à part, juste un champ texte sur la demande elle-même.
--    Il apparaît là où la demande est déjà affichée (la cloche du
--    dashboard, la liste dans Settings).
-- -----------------------------------------------------------------------------
alter table public.memberships add column if not exists join_message text;
comment on column public.memberships.join_message is
  'Message optionnel écrit en demandant à rejoindre ce club (visible par l''admin qui doit approuver).';

alter table public.club_association_members add column if not exists message text;
comment on column public.club_association_members.message is
  'Message optionnel écrit en proposant/demandant cette association (visible par le contrôleur/validateur qui doit approuver).';

-- -----------------------------------------------------------------------------
-- 2. Messagerie directe entre deux personnes -- simple, un fil par paire
--    de personnes (pas de groupes pour l'instant).
-- -----------------------------------------------------------------------------
create table if not exists public.messages (
  id           uuid primary key default uuid_generate_v4(),
  sender_id    uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body         text not null,
  created_at   timestamptz not null default now(),
  read_at      timestamptz
);

comment on table public.messages is
  'Messagerie directe, un message à la fois, entre deux personnes.';

alter table public.messages enable row level security;

-- Qui peut écrire à qui, pour éviter que n'importe qui puisse
-- contacter n'importe qui sur toute la plateforme :
--   - le contrôleur peut écrire à tout le monde (pour répondre à tout)
--   - tout le monde peut écrire à un admin de plateforme ou un
--     validateur d'associations (c'est le cas d'usage principal :
--     contacter "l'admin" au sujet d'une demande)
--   - deux personnes du même club peuvent s'écrire
--   - si une conversation existe déjà entre les deux (dans un sens ou
--     l'autre), elle peut continuer (répondre)
create or replace function public.can_message(recipient uuid)
returns boolean as $$
  select
    public.is_platform_controller()
    or exists (
      select 1 from public.profiles p
      where p.id = recipient and (p.is_platform_controller or p.is_association_validator)
    )
    or exists (
      select 1 from public.memberships m1
      join public.memberships m2 on m1.organization_id = m2.organization_id
      where m1.user_id = auth.uid() and m2.user_id = recipient
        and m1.status = 'active' and m2.status = 'active'
    )
    or exists (
      select 1 from public.messages
      where (sender_id = recipient and recipient_id = auth.uid())
         or (sender_id = auth.uid() and recipient_id = recipient)
    );
$$ language sql security definer stable;

create policy "voir mes messages (envoyés ou reçus)"
  on public.messages for select to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid());

create policy "envoyer un message à quelqu'un d'autorisé"
  on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and sender_id <> recipient_id and public.can_message(recipient_id));

create policy "marquer comme lu un message qu'on a reçu"
  on public.messages for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

create index if not exists messages_recipient_unread_idx on public.messages (recipient_id) where read_at is null;
create index if not exists messages_thread_idx on public.messages (sender_id, recipient_id, created_at);

-- -----------------------------------------------------------------------------
-- 3. Pouvoir chercher quelqu'un par email pour lui écrire -- sans ça, un
--    membre normal ne pouvait voir AUCUN profil sauf le sien (seul le
--    contrôleur voyait tout le monde), donc impossible de trouver un
--    coéquipier pour lui envoyer un message.
-- -----------------------------------------------------------------------------
drop policy if exists "see own profile, or all if controller" on public.profiles;
create policy "voir son profil, celui d'un coéquipier, d'un admin/validateur, ou tout si contrôleur"
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or public.is_platform_controller()
    or is_platform_controller  -- un admin de plateforme est "trouvable" par tous, pour le contacter
    or is_association_validator -- pareil pour un validateur
    or exists (
      select 1 from public.memberships m1
      join public.memberships m2 on m1.organization_id = m2.organization_id
      where m1.user_id = auth.uid() and m2.user_id = profiles.id
        and m1.status = 'active' and m2.status = 'active'
    )
  );
