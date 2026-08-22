import type { Payment, Expense } from "@/types/database";

export interface ProjectTotals {
  received: number;
  spent: number;
  remaining: number;
}

export function calculateProjectTotals(
  payments: Pick<Payment, "amount">[],
  expenses: Pick<Expense, "total_price">[]
): ProjectTotals {
  const received = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const spent = expenses.reduce((sum, e) => sum + Number(e.total_price), 0);
  return { received, spent, remaining: received - spent };
}
