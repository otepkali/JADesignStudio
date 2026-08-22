-- Renovation cost tracker schema
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query)

create extension if not exists "pgcrypto";

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  name text not null,
  total_amount numeric not null,
  deadline date,
  prepayment_percent numeric not null default 50,
  status text not null default 'in_progress', -- in_progress | completed
  created_at timestamptz default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  amount numeric not null,
  payment_type text not null, -- 'prepayment' | 'additional' | 'final'
  paid_at date not null default current_date,
  note text,
  created_at timestamptz default now()
);

create table if not exists expense_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  name text not null
);

create unique index if not exists expense_categories_name_unique
  on expense_categories (name);

insert into expense_categories (name) values
  ('Электрика'), ('Сантехника'), ('Отделочные материалы'),
  ('Черновые материалы'), ('Мебель и декор'), ('Монтажные работы'), ('Прочее')
on conflict do nothing;

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  category_id uuid references expense_categories(id),
  material_name text not null,
  quantity numeric,
  unit text,
  unit_price numeric,
  total_price numeric not null,
  expense_date date not null default current_date,
  note text,
  synced_to_sheets boolean default false,
  created_at timestamptz default now()
);

create index if not exists expenses_project_id_idx on expenses(project_id);
create index if not exists payments_project_id_idx on payments(project_id);
create index if not exists expenses_category_id_idx on expenses(category_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Shared team workspace: every signed-in user can read and write every row.
-- user_id columns stay only for attribution (who created a project/category),
-- they are not an access boundary.
-- ---------------------------------------------------------------------------

alter table projects enable row level security;
alter table payments enable row level security;
alter table expense_categories enable row level security;
alter table expenses enable row level security;

create policy "projects_authenticated_all" on projects
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "payments_authenticated_all" on payments
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "expense_categories_authenticated_all" on expense_categories
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "expenses_authenticated_all" on expenses
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
