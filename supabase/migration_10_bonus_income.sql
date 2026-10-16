-- Migration 10: standalone bonus income (bonuses not tied to a specific expense).
-- Run once in the Supabase SQL editor. Safe to re-run (idempotent).

create table if not exists bonus_incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  title text not null,
  amount numeric(14, 2) not null check (amount > 0),
  account text check (account in ('cash', 'ip_account', 'personal_account')),
  income_date date not null default current_date,
  note text,
  created_at timestamptz default now()
);

create index if not exists bonus_incomes_date_idx on bonus_incomes(income_date);

alter table bonus_incomes enable row level security;

drop policy if exists "bonus_incomes_authenticated_all" on bonus_incomes;
create policy "bonus_incomes_authenticated_all" on bonus_incomes
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
