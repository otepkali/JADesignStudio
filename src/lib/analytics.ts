import type { ExpenseWithCategory } from "@/types/database";

export interface CategoryBreakdown {
  name: string;
  value: number;
}

const MAX_SLICES = 8;

function groupExpensesByName(
  expenses: ExpenseWithCategory[],
  getName: (expense: ExpenseWithCategory) => string,
  otherLabel: string
): CategoryBreakdown[] {
  const totals = new Map<string, number>();

  for (const expense of expenses) {
    const name = getName(expense);
    totals.set(name, (totals.get(name) ?? 0) + Number(expense.total_price));
  }

  const sorted = [...totals.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (sorted.length <= MAX_SLICES) return sorted;

  const head = sorted.slice(0, MAX_SLICES - 1);
  const tailSum = sorted.slice(MAX_SLICES - 1).reduce((sum, item) => sum + item.value, 0);
  return [...head, { name: otherLabel, value: tailSum }];
}

export function groupExpensesByCategory(expenses: ExpenseWithCategory[]): CategoryBreakdown[] {
  return groupExpensesByName(
    expenses,
    (expense) => expense.expense_categories?.name ?? "Без категории",
    "Другое"
  );
}

export function groupExpensesBySubcategory(expenses: ExpenseWithCategory[]): CategoryBreakdown[] {
  return groupExpensesByName(
    expenses,
    (expense) => expense.expense_subcategories?.name ?? "Без подкатегории",
    "Другое"
  );
}

export interface WeeklyBreakdown {
  weekLabel: string;
  weekStart: string;
  total: number;
}

function getISOWeekStart(dateStr: string): Date {
  const date = new Date(dateStr);
  const day = (date.getUTCDay() + 6) % 7; // Monday = 0
  date.setUTCDate(date.getUTCDate() - day);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export function groupExpensesByWeek(expenses: ExpenseWithCategory[]): WeeklyBreakdown[] {
  const totals = new Map<string, number>();

  for (const expense of expenses) {
    const weekStart = getISOWeekStart(expense.expense_date);
    const key = weekStart.toISOString().slice(0, 10);
    totals.set(key, (totals.get(key) ?? 0) + Number(expense.total_price));
  }

  return [...totals.entries()]
    .map(([weekStart, total]) => ({
      weekStart,
      total,
      weekLabel: new Date(weekStart).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
      }),
    }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}
