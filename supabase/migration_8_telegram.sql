-- Migration 8: Telegram task notifications — team members + assignee link.
-- Run once in the Supabase SQL editor. Safe to re-run (idempotent).

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  telegram_chat_id text,
  created_at timestamptz default now()
);

create unique index if not exists team_members_name_unique on team_members (name);

alter table team_members enable row level security;
drop policy if exists "team_members_authenticated_all" on team_members;
create policy "team_members_authenticated_all" on team_members
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

alter table tasks add column if not exists assignee_id uuid references team_members(id) on delete set null;
alter table tasks add column if not exists last_reminded_on date;

create index if not exists tasks_assignee_id_idx on tasks(assignee_id);

-- Backfill: if a task's free-text assignee already matches a team member's
-- name (once you've added them), link it automatically. Safe no-op until
-- you've added team members with matching names.
update tasks t
set assignee_id = m.id
from team_members m
where t.assignee_id is null
  and t.assignee is not null
  and lower(trim(t.assignee)) = lower(trim(m.name));
