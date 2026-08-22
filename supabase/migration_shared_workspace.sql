-- Migration: switch from per-user data isolation to a shared team workspace.
-- Run once in the Supabase SQL editor on your existing project.
-- Safe to re-run (idempotent).

-- 1. Stop auto-seeding a private category set for every new user — categories
--    are shared now, so a second login must not get its own duplicate copies.
drop trigger if exists on_auth_user_created_seed_categories on auth.users;
drop function if exists public.seed_default_expense_categories();

-- 2. De-duplicate expense_categories by name (keep the oldest row per name),
--    repointing any expenses that reference a duplicate onto the kept row.
with ranked as (
  select id, name, row_number() over (partition by name order by id) as rn
  from expense_categories
),
keep as (
  select name, id as keep_id from ranked where rn = 1
),
dupes as (
  select r.id as dupe_id, k.keep_id
  from ranked r
  join keep k on k.name = r.name
  where r.rn > 1
)
update expenses e
set category_id = d.keep_id
from dupes d
where e.category_id = d.dupe_id;

delete from expense_categories ec
using (
  select id, row_number() over (partition by name order by id) as rn
  from expense_categories
) r
where ec.id = r.id and r.rn > 1;

-- 3. Categories are shared: unique by name alone (drop the old per-user index
--    if it exists, add the new one).
drop index if exists expense_categories_name_user_unique;
create unique index if not exists expense_categories_name_unique
  on expense_categories (name);

-- 4. Loosen RLS: any authenticated user can see/edit everything.
drop policy if exists "projects_owner_all" on projects;
drop policy if exists "projects_authenticated_all" on projects;
create policy "projects_authenticated_all" on projects
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "payments_owner_all" on payments;
drop policy if exists "payments_authenticated_all" on payments;
create policy "payments_authenticated_all" on payments
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "expense_categories_owner_all" on expense_categories;
drop policy if exists "expense_categories_authenticated_all" on expense_categories;
create policy "expense_categories_authenticated_all" on expense_categories
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "expenses_owner_all" on expenses;
drop policy if exists "expenses_authenticated_all" on expenses;
create policy "expenses_authenticated_all" on expenses
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- 5. projects.user_id / expense_categories.user_id no longer gate access —
--    relax the FK so a deleted auth user doesn't cascade-delete their projects.
alter table projects drop constraint if exists projects_user_id_fkey;
alter table projects add constraint projects_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;
alter table projects alter column user_id drop not null;

alter table expense_categories drop constraint if exists expense_categories_user_id_fkey;
alter table expense_categories add constraint expense_categories_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;
