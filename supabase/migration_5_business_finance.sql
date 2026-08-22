-- Migration 5: business-level finance — accounts (cash / IP account /
-- personal account), admin (non-project) expenses, and supplier bonuses.
-- Run once in the Supabase SQL editor. Safe to re-run (idempotent).

-- 1. Accounts money moves through.
create table if not exists accounts (
  id text primary key,
  name text not null
);

insert into accounts (id, name) values
  ('cash', 'Наличка'),
  ('ip_account', 'Счёт ИП'),
  ('personal_account', 'Счёт физ. лица')
on conflict do nothing;

alter table accounts enable row level security;
drop policy if exists "accounts_authenticated_all" on accounts;
create policy "accounts_authenticated_all" on accounts
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- 2. Tag payments with the account the money landed in.
alter table payments add column if not exists account text references accounts(id);

-- 3. Expenses: account paid from, plus supplier bonus/cashback on this
--    purchase (business income, separate from the project's own cost).
alter table expenses add column if not exists account text references accounts(id);
alter table expenses add column if not exists bonus_percent numeric;
alter table expenses add column if not exists bonus_amount numeric;

-- 4. expense_categories.project_type gains 'admin' for business/overhead
--    expenses that aren't tied to any project (expenses.project_id = null).
alter table expense_categories drop constraint if exists expense_categories_project_type_check;
alter table expense_categories add constraint expense_categories_project_type_check
  check (project_type in ('turnkey', 'design', 'admin'));

insert into expense_categories (name, project_type) values
  ('Аренда офиса', 'admin'),
  ('Обучение', 'admin'),
  ('Командировки сотрудников', 'admin'),
  ('Прочее (бизнес)', 'admin')
on conflict do nothing;
