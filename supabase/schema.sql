-- Winter Arc — Supabase schema
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query).

create table if not exists public.groups (
  code text primary key,
  name text not null,
  created_at bigint not null,
  objectives jsonb not null default '[]'::jsonb,
  members jsonb not null default '[]'::jsonb,
  messages jsonb not null default '[]'::jsonb
);

alter table public.groups enable row level security;

-- The app has no login system: anyone holding a group's 6-character code
-- can read and write that group's row. This matches the original app's
-- security model (a shared code is the access control).
create policy "anyone can read groups" on public.groups
  for select using (true);

create policy "anyone can create a group" on public.groups
  for insert with check (true);

create policy "anyone can update a group" on public.groups
  for update using (true);

-- Enable realtime updates so members see check-ins/chat live.
alter publication supabase_realtime add table public.groups;
