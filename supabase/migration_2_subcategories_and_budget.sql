-- Migration 2: subcategories per expense category + planned budget per project.
-- Run once in the Supabase SQL editor. Safe to re-run (idempotent).

-- 1. Subcategories (e.g. "Отделочные материалы" -> "Ламинат", "Керамогранит", ...)
create table if not exists expense_subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references expense_categories(id) on delete cascade,
  name text not null,
  unique (category_id, name)
);

alter table expense_subcategories enable row level security;

drop policy if exists "expense_subcategories_authenticated_all" on expense_subcategories;
create policy "expense_subcategories_authenticated_all" on expense_subcategories
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

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
  ('Мебель и декор', 'Журнальные столики')
) as sub(category_name, name) on ec.name = sub.category_name
on conflict do nothing;

alter table expenses add column if not exists subcategory_id uuid references expense_subcategories(id);
create index if not exists expenses_subcategory_id_idx on expenses(subcategory_id);
create index if not exists expense_subcategories_category_id_idx on expense_subcategories(category_id);

-- 2. Planned budget per project/category, to compare against actual spend and
--    show planned margin (client price - planned cost) vs actual.
create table if not exists project_budget_lines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  category_id uuid references expense_categories(id) on delete cascade,
  planned_amount numeric not null default 0,
  created_at timestamptz default now(),
  unique (project_id, category_id)
);

create index if not exists project_budget_lines_project_id_idx on project_budget_lines(project_id);

alter table project_budget_lines enable row level security;

drop policy if exists "project_budget_lines_authenticated_all" on project_budget_lines;
create policy "project_budget_lines_authenticated_all" on project_budget_lines
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
