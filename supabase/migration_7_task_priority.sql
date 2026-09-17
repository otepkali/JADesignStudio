-- Migration 7: task priority (low / medium / high).
-- Run once in the Supabase SQL editor. Safe to re-run (idempotent).

alter table tasks add column if not exists priority text not null default 'medium';
alter table tasks drop constraint if exists tasks_priority_check;
alter table tasks add constraint tasks_priority_check
  check (priority in ('low', 'medium', 'high'));
