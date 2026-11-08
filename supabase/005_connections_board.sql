-- v3: optional connections board. Run after 003_actor_cards.sql.
-- Story nodes are inferred from shots, story_beats and actor_cards; not duplicated.
create table if not exists public.board_links (
  id text primary key,
  source_key text not null,
  target_key text not null,
  relation text not null default 'Callback',
  description text not null default '',
  status text not null default 'Idea',
  version integer not null default 1 check (version > 0),
  updated_at timestamptz not null default now(),
  updated_by text not null default '',
  constraint board_no_self_connection check (source_key <> target_key),
  constraint board_valid_status check (status in ('Idea','Confirmed','Cut'))
);
create unique index if not exists board_links_pair_unique on public.board_links(least(source_key,target_key),greatest(source_key,target_key));
alter table public.board_links enable row level security;
revoke all on public.board_links from public,anon,authenticated;
grant select,insert,update,delete on public.board_links to authenticated;
drop policy if exists acc_team_all on public.board_links;
create policy acc_team_all on public.board_links for all to authenticated
 using (public.is_acc_member()) with check (public.is_acc_member());
drop trigger if exists acc_touch on public.board_links;
create trigger acc_touch before insert or update on public.board_links
 for each row execute function public.acc_stamp_updated_at();
-- Renaming a storyline is one database transaction; avoids partial record rewrites.
create or replace function public.acc_rename_storyline(old_name text,new_name text)
returns void language plpgsql security invoker set search_path = '' as $$
declare original text := btrim(old_name); replacement text := btrim(new_name);
begin
 if not public.is_acc_member() then raise exception 'Access denied'; end if;
 if original='' or replacement='' or replacement='General' or length(replacement)>160 then
   raise exception 'Invalid storyline name';
 end if;
 if original=replacement then return; end if;
 if exists(select 1 from public.story_beats where thread=replacement)
 or exists(select 1 from public.shots where thread=replacement)
 or exists(select 1 from public.actor_cards where thread=replacement) then
   raise exception 'Storyline name already exists';
 end if;
 if not (exists(select 1 from public.story_beats where thread=original)
 or exists(select 1 from public.shots where thread=original)
 or exists(select 1 from public.actor_cards where thread=original)) then
   raise exception 'Storyline no longer exists';
 end if;
 update public.story_beats set thread=replacement,version=version+1 where thread=original;
 update public.shots set thread=replacement,version=version+1 where thread=original;
 update public.actor_cards set thread=replacement,version=version+1 where thread=original;
 update public.board_links set
   source_key=case when source_key='story:'||original then 'story:'||replacement else source_key end,
   target_key=case when target_key='story:'||original then 'story:'||replacement else target_key end,
   version=version+1
 where source_key='story:'||original or target_key='story:'||original;
end;
$$;
revoke all on function public.acc_rename_storyline(text,text) from public,anon;
grant execute on function public.acc_rename_storyline(text,text) to authenticated;
do $$ begin
 if not exists(select 1 from pg_publication_tables
   where pubname='supabase_realtime' and schemaname='public' and tablename='board_links') then
   alter publication supabase_realtime add table public.board_links;
 end if;
end $$;
-- Seed only speculative plot connections. Re-running keeps existing edits.
insert into public.board_links(id,source_key,target_key,relation,description,status) values
 ('CL-001','story:Missing Turkey','story:Colonial Ghost','Red herring','Possible crossover: the missing prop is blamed on the rumored ghost. A creative idea, not an established scene.','Idea'),
 ('CL-002','story:The Legend of Jim S','story:Bryan vs Everybody','Callback','People invoke Jim S while Bryan is leading the actual construction. Proposed recurring callback.','Idea'),
 ('CL-003','story:Four Boxes One Choir','story:Bryan vs Everybody','Cross-over','Choir logistics could feed into the running joke about coordinating everyone.','Idea')
on conflict (id) do nothing;
-- Match the example card's storyline if it has never been edited.
update public.actor_cards set thread='The Legend of Jim S',version=version+1
 where id='AC-001' and thread='The Legend of Jim' and version=1;
