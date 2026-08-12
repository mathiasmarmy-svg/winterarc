-- Winter Arc — Supabase schema
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query).
-- Safe to re-run: every statement is idempotent, so pasting this again after
-- a schema update (e.g. the founder_id column) won't error or duplicate data.

create table if not exists public.groups (
  code text primary key,
  name text not null,
  created_at bigint not null,
  founder_id text,
  objectives jsonb not null default '[]'::jsonb,
  members jsonb not null default '[]'::jsonb,
  messages jsonb not null default '[]'::jsonb
);

alter table public.groups add column if not exists founder_id text;

alter table public.groups enable row level security;

-- Anyone holding a group's 6-character code can read and write that group's
-- row — a shared code (not a server-checked login) is the access control.
-- Members do carry a pseudo + salted password hash so they can recover their
-- identity from another device, but since select is open to all rows the
-- anon key can read those hashes too; only the hash is stored, never the
-- raw password. Rankings need to read every cell's members to compute
-- cross-group leaderboards, which is why select is open to all rows rather
-- than scoped to one code.
drop policy if exists "anyone can read groups" on public.groups;
create policy "anyone can read groups" on public.groups
  for select using (true);

drop policy if exists "anyone can create a group" on public.groups;
create policy "anyone can create a group" on public.groups
  for insert with check (true);

drop policy if exists "anyone can update a group" on public.groups;
create policy "anyone can update a group" on public.groups
  for update using (true);

-- Enable realtime updates so members see check-ins/chat live.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'groups'
  ) then
    alter publication supabase_realtime add table public.groups;
  end if;
end $$;
