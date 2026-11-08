-- ACC: Behind the Scenes collaborative filming planner
-- Run this before 002_seed.sql in the Supabase SQL editor.
-- Never put a Supabase service-role key in the web app.

create table if not exists public.app_members (
  email text primary key check (email = lower(email)),
  display_name text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- SECURITY DEFINER is used only for the read-only membership check.
-- No browser role can add itself to app_members.
create or replace function public.is_acc_member()
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.app_members m
    where m.email = lower(coalesce((select auth.jwt()->>'email'), ''))
      and m.active = true
  );
$$;
revoke all on function public.is_acc_member() from public;
grant execute on function public.is_acc_member() to authenticated;

create table if not exists public.shots (
  id text primary key,
  category text not null default 'Custom',
  priority text not null default 'Useful',
  title text not null,
  technique text not null default '',
  instructions text not null default '',
  purpose text not null default '',
  opportunity text not null default 'Any rehearsal',
  people text not null default '',
  thread text not null default 'General',
  status text not null default 'Not shot',
  captured_at date,
  camera text not null default '',
  file_ref text not null default '',
  notes text not null default '',
  review_notes text not null default '',
  version integer not null default 1 check (version > 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.story_beats (
  id text primary key,
  thread text not null,
  beat text not null,
  evidence text not null default '',
  opportunity text not null default '',
  shot_ids text not null default '',
  approach text not null default '',
  priority text not null default 'Useful',
  status text not null default 'Not planned',
  notes text not null default '',
  version integer not null default 1 check (version > 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id text primary key,
  date date not null,
  venue text not null default '',
  goal text not null default '',
  capture text not null default '',
  shot_ids text not null default '',
  approach text not null default '',
  pickup text not null default '',
  status text not null default 'Not planned',
  notes text not null default '',
  version integer not null default 1 check (version > 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.footage (
  id text primary key,
  shot_id text references public.shots(id) on delete set null,
  title text not null,
  camera text not null default '',
  taken_on date,
  file_ref text not null default '',
  review_status text not null default 'Needs review',
  notes text not null default '',
  version integer not null default 1 check (version > 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id text primary key,
  target_type text not null check (target_type in ('shots','story_beats','sessions','footage')),
  target_id text not null,
  body text not null,
  author_email text not null default '',
  created_at timestamptz not null default now(),
  version integer not null default 1 check (version > 0),
  updated_at timestamptz not null default now()
);

create or replace function public.acc_stamp_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  new.updated_by = coalesce((select auth.jwt()->>'email'), new.updated_by, '');
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['shots','story_beats','sessions','footage','comments'] loop
    execute format('alter table public.%I add column if not exists updated_by text not null default ''''', t);
    execute format('drop trigger if exists acc_touch on public.%I', t);
    execute format('create trigger acc_touch before insert or update on public.%I for each row execute function public.acc_stamp_updated_at()',t);
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated',t);
    execute format('grant select, insert, update, delete on public.%I to authenticated',t);
    execute format('drop policy if exists acc_team_all on public.%I',t);
    execute format('create policy acc_team_all on public.%I for all to authenticated using (public.is_acc_member()) with check (public.is_acc_member())',t);
  end loop;
end $$;

alter table public.app_members enable row level security;
revoke all on public.app_members from public, anon, authenticated;
grant select on public.app_members to authenticated;
drop policy if exists acc_member_self on public.app_members;
create policy acc_member_self on public.app_members for select to authenticated
  using (email = lower(coalesce((select auth.jwt()->>'email'),'')));

-- Realtime: refreshing the client on any change is enough for two collaborators.
do $$
declare t text;
begin
  foreach t in array array['shots','story_beats','sessions','footage','comments'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname='supabase_realtime' and schemaname='public' and tablename=t
    ) then
      execute format('alter publication supabase_realtime add table public.%I',t);
    end if;
  end loop;
end $$;

-- Add allowed members via the SQL editor after running this file:
-- insert into public.app_members(email, display_name) values
--   ('you@example.com', 'Jeremy'), ('courtney@example.com', 'Courtney')
-- on conflict (email) do update set display_name=excluded.display_name, active=true;

create or replace function public.acc_stamp_comment_author()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.author_email = coalesce((select auth.jwt()->>'email'), new.author_email, '');
  return new;
end;
$$;
drop trigger if exists acc_comment_author on public.comments;
create trigger acc_comment_author before insert on public.comments
  for each row execute function public.acc_stamp_comment_author();
