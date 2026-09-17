-- Migration 6: shared task list (assignee + deadline + status).
-- Run once in the Supabase SQL editor. Safe to re-run (idempotent).

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  title text not null,
  assignee text,
  deadline date,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  note text,
  created_at timestamptz default now()
);

create index if not exists tasks_deadline_idx on tasks(deadline);

alter table tasks enable row level security;

drop policy if exists "tasks_authenticated_all" on tasks;
create policy "tasks_authenticated_all" on tasks
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
