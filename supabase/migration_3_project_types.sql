-- Migration 3: project types (turnkey renovation vs. design project).
-- Run once in the Supabase SQL editor. Safe to re-run (idempotent).

alter table projects add column if not exists project_type text not null default 'turnkey';
alter table projects drop constraint if exists projects_project_type_check;
alter table projects add constraint projects_project_type_check
  check (project_type in ('turnkey', 'design'));

alter table expense_categories add column if not exists project_type text not null default 'turnkey';
alter table expense_categories drop constraint if exists expense_categories_project_type_check;
alter table expense_categories add constraint expense_categories_project_type_check
  check (project_type in ('turnkey', 'design'));

-- Design-project categories: staff payments (per role) + document printing.
insert into expense_categories (name, project_type) values
  ('Оплата сотрудникам', 'design'),
  ('Распечатка бумаг', 'design')
on conflict do nothing;

insert into expense_subcategories (category_id, name)
select ec.id, sub.name
from expense_categories ec
join (values
  ('Оплата сотрудникам', 'Дизайнер/комплектатор'),
  ('Оплата сотрудникам', 'Визуализатор'),
  ('Оплата сотрудникам', 'Архитектор')
) as sub(category_name, name) on ec.name = sub.category_name
on conflict do nothing;
