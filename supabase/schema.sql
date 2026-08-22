-- Renovation cost tracker schema
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query)

create extension if not exists "pgcrypto";

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  name text not null,
  slug text,
  project_type text not null default 'turnkey' check (project_type in ('turnkey', 'design')),
  total_amount numeric not null,
  deadline date,
  prepayment_percent numeric not null default 50,
  status text not null default 'in_progress', -- in_progress | completed
  created_at timestamptz default now()
);

create unique index if not exists projects_slug_unique on projects (slug);

-- Accounts money actually sits in / moves through — used to tag every
-- payment and expense so the business balance can be split by account.
create table if not exists accounts (
  id text primary key,
  name text not null
);

insert into accounts (id, name) values
  ('cash', 'Наличка'),
  ('ip_account', 'Счёт ИП'),
  ('personal_account', 'Счёт физ. лица')
on conflict do nothing;

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  amount numeric not null,
  payment_type text not null, -- 'prepayment' | 'additional' | 'final'
  account text references accounts(id),
  paid_at date not null default current_date,
  note text,
  created_at timestamptz default now()
);

create table if not exists expense_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  name text not null,
  -- 'turnkey' | 'design' scope a category to that project type; 'admin' is
  -- for business/overhead expenses not tied to any project.
  project_type text not null default 'turnkey' check (project_type in ('turnkey', 'design', 'admin'))
);

create unique index if not exists expense_categories_name_unique
  on expense_categories (name);

insert into expense_categories (name, project_type) values
  ('Электрика', 'turnkey'), ('Сантехника', 'turnkey'), ('Отделочные материалы', 'turnkey'),
  ('Черновые материалы', 'turnkey'), ('Мебель и декор', 'turnkey'), ('Монтажные работы', 'turnkey'), ('Прочее', 'turnkey'),
  ('Оплата сотрудникам', 'design'), ('Распечатка бумаг', 'design'),
  ('Аренда офиса', 'admin'), ('Обучение', 'admin'), ('Командировки сотрудников', 'admin'), ('Прочее (бизнес)', 'admin')
on conflict do nothing;

create table if not exists expense_subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references expense_categories(id) on delete cascade,
  name text not null,
  unique (category_id, name)
);

insert into expense_subcategories (category_id, name)
select ec.id, sub.name
from expense_categories ec
join (values
  ('Отделочные материалы', 'Керамогранит'),
  ('Отделочные материалы', 'Ламинат'),
  ('Отделочные материалы', 'Ванна'),
  ('Отделочные материалы', 'Обои'),
  ('Отделочные материалы', 'Краска'),
  ('Отделочные материалы', 'Молдинги'),
  ('Отделочные материалы', 'Гипсовые элементы'),
  ('Отделочные материалы', 'Плинтус'),
  ('Отделочные материалы', 'Зеркала'),
  ('Электрика', 'Черновая электрика'),
  ('Электрика', 'Люстры/бра'),
  ('Электрика', 'Софиты'),
  ('Электрика', 'Треки'),
  ('Мебель и декор', 'Встроенная мебель'),
  ('Мебель и декор', 'Кровать'),
  ('Мебель и декор', 'Диван'),
  ('Мебель и декор', 'Тумбы прикроватные'),
  ('Мебель и декор', 'Консоль'),
  ('Мебель и декор', 'Стол'),
  ('Мебель и декор', 'Стулья'),
  ('Мебель и декор', 'Журнальные столики'),
  ('Оплата сотрудникам', 'Дизайнер/комплектатор'),
  ('Оплата сотрудникам', 'Визуализатор'),
  ('Оплата сотрудникам', 'Архитектор')
) as sub(category_name, name) on ec.name = sub.category_name
on conflict do nothing;

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  -- null project_id = a business/admin expense, not tied to any project.
  project_id uuid references projects(id) on delete cascade,
  category_id uuid references expense_categories(id),
  subcategory_id uuid references expense_subcategories(id),
  material_name text not null,
  quantity numeric,
  unit text,
  unit_price numeric,
  total_price numeric not null,
  account text references accounts(id),
  -- Supplier bonus/cashback earned on this purchase (e.g. "10% back on
  -- payments over 1M"), tracked as income to the business, separate from
  -- the project's own cost/margin numbers.
  bonus_percent numeric,
  bonus_amount numeric,
  expense_date date not null default current_date,
  note text,
  synced_to_sheets boolean default false,
  created_at timestamptz default now()
);

create table if not exists project_budget_lines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  category_id uuid references expense_categories(id) on delete cascade,
  planned_amount numeric not null default 0,
  created_at timestamptz default now(),
  unique (project_id, category_id)
);

create index if not exists expenses_project_id_idx on expenses(project_id);
create index if not exists payments_project_id_idx on payments(project_id);
create index if not exists expenses_category_id_idx on expenses(category_id);
create index if not exists expenses_subcategory_id_idx on expenses(subcategory_id);
create index if not exists expense_subcategories_category_id_idx on expense_subcategories(category_id);
create index if not exists project_budget_lines_project_id_idx on project_budget_lines(project_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Shared team workspace: every signed-in user can read and write every row.
-- user_id columns stay only for attribution (who created a project/category),
-- they are not an access boundary.
-- ---------------------------------------------------------------------------

alter table projects enable row level security;
alter table payments enable row level security;
alter table expense_categories enable row level security;
alter table expense_subcategories enable row level security;
alter table expenses enable row level security;
alter table project_budget_lines enable row level security;
alter table accounts enable row level security;

create policy "accounts_authenticated_all" on accounts
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

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

create policy "expense_subcategories_authenticated_all" on expense_subcategories
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "project_budget_lines_authenticated_all" on project_budget_lines
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
