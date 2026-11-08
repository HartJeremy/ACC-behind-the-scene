-- v2: collaborative actor cards. Run after 001_schema.sql and 002_seed.sql.
-- Run this SQL once on an existing database; safe to re-run.
create table if not exists public.actor_cards (
  id text primary key,
  actor_name text not null,
  scene_title text not null,
  thread text not null default 'General',
  status text not null default 'Idea',
  session_date date,
  actor_brief text not null default '',
  actor_direction text not null default '',
  questions text not null default '',
  optional_action text not null default '',
  director_goal text not null default '',
  director_notes text not null default '',
  shot_ids text not null default '',
  version integer not null default 1 check (version > 0),
  updated_at timestamptz not null default now(),
  updated_by text not null default ''
);
create table if not exists public.card_history (
  id bigint generated always as identity primary key,
  card_id text not null,
  change_kind text not null,
  editor text not null default '',
  changed_at timestamptz not null default now(),
  before_state jsonb,
  after_state jsonb
);
alter table public.actor_cards enable row level security;
revoke all on public.actor_cards from public, anon, authenticated;
grant select, insert, update, delete on public.actor_cards to authenticated;
drop policy if exists acc_team_all on public.actor_cards;
create policy acc_team_all on public.actor_cards for all to authenticated
  using (public.is_acc_member()) with check (public.is_acc_member());
alter table public.card_history enable row level security;
revoke all on public.card_history from public, anon, authenticated;
grant select on public.card_history to authenticated;
drop policy if exists acc_team_read on public.card_history;
create policy acc_team_read on public.card_history for select to authenticated
  using (public.is_acc_member());
-- Editors cannot modify audit records directly. Trigger function runs on the server.
create or replace function public.acc_audit_actor_card()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.card_history (card_id,change_kind,editor,before_state,after_state)
    values (new.id, 'Created', coalesce((select auth.jwt()->>'email'),'system'), null, to_jsonb(new));
  elsif tg_op = 'UPDATE' then
    insert into public.card_history (card_id,change_kind,editor,before_state,after_state)
    values (new.id, 'Edited', coalesce((select auth.jwt()->>'email'),'system'), to_jsonb(old), to_jsonb(new));
  elsif tg_op = 'DELETE' then
    insert into public.card_history (card_id,change_kind,editor,before_state,after_state)
    values (old.id, 'Deleted', coalesce((select auth.jwt()->>'email'),'system'), to_jsonb(old), null);
  end if;
  return null; -- AFTER trigger: return value is ignored
end;
$$;
revoke all on function public.acc_audit_actor_card() from public, anon, authenticated;
drop trigger if exists acc_touch on public.actor_cards;
create trigger acc_touch before insert or update on public.actor_cards
  for each row execute function public.acc_stamp_updated_at();
drop trigger if exists acc_audit on public.actor_cards;
create trigger acc_audit after insert or update or delete on public.actor_cards
  for each row execute function public.acc_audit_actor_card();
-- Team notes can also be attached to actor cards.
alter table public.comments drop constraint if exists comments_target_type_check;
alter table public.comments add constraint comments_target_type_check
  check (target_type in ('shots','story_beats','sessions','footage','actor_cards'));
-- Subscribe new table to Supabase Realtime; publishing audit history is optional.
do $$ begin
  if not exists (select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='actor_cards') then
    alter publication supabase_realtime add table public.actor_cards;
  end if;
end $$;
-- Team membership requires explicit admin allowlisting. Never invent email addresses.
-- After inviting through Supabase Authentication, set each actual lowercase email:
-- insert into public.app_members(email, display_name) values
--   ('YOUR_EMAIL', 'Jeremy'),('COURTNEY_EMAIL','Courtney'),('ALEX_EMAIL','Alex')
-- on conflict (email) do update set display_name=excluded.display_name,active=true;
