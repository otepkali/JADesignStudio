-- Renovation cost tracker schema
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query)

create extension if not exists "pgcrypto";

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
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
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  name text not null
);

create unique index if not exists expense_categories_name_user_unique
  on expense_categories (user_id, name);

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
-- Single-tenant-per-row-owner model: every project/category row is tagged with
-- the auth.uid() of the user who created it; payments/expenses inherit access
-- through their parent project.
-- ---------------------------------------------------------------------------

alter table projects enable row level security;
alter table payments enable row level security;
alter table expense_categories enable row level security;
alter table expenses enable row level security;

create policy "projects_owner_all" on projects
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "payments_owner_all" on payments
  for all
  using (exists (select 1 from projects p where p.id = payments.project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = payments.project_id and p.user_id = auth.uid()));

create policy "expense_categories_owner_all" on expense_categories
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "expenses_owner_all" on expenses
  for all
  using (exists (select 1 from projects p where p.id = expenses.project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = expenses.project_id and p.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- Seed default expense categories for every new user automatically.
-- ---------------------------------------------------------------------------

create or replace function public.seed_default_expense_categories()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.expense_categories (user_id, name) values
    (new.id, 'Электрика'),
    (new.id, 'Сантехника'),
    (new.id, 'Отделочные материалы'),
    (new.id, 'Черновые материалы'),
    (new.id, 'Мебель и декор'),
    (new.id, 'Монтажные работы'),
    (new.id, 'Прочее')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_seed_categories on auth.users;
create trigger on_auth_user_created_seed_categories
  after insert on auth.users
  for each row execute function public.seed_default_expense_categories();
