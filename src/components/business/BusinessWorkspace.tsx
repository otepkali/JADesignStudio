"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatTenge } from "@/lib/format";
import { groupExpensesByCategory } from "@/lib/analytics";
import { ExpenseForm } from "@/components/project/ExpenseForm";
import { ExpensesTable } from "@/components/project/ExpensesTable";
import { CategoryPieChart } from "@/components/project/CategoryPieChart";
import { OpeningBalances } from "@/components/business/OpeningBalances";
import {
  addExpense,
  deleteExpense,
  resyncExpense,
  updateExpense,
} from "@/app/(app)/projects/[id]/actions";
import type { BusinessBalance } from "@/lib/data";
import type { AccountId, ExpenseCategory, ExpenseWithCategory } from "@/types/database";
import type { ExpenseFormValues } from "@/lib/schemas";

export function BusinessWorkspace({
  initialBalance,
  initialCategories,
  initialExpenses,
  initialOpeningBalances,
}: {
  initialBalance: BusinessBalance;
  initialCategories: ExpenseCategory[];
  initialExpenses: ExpenseWithCategory[];
  initialOpeningBalances: Record<AccountId, number>;
}) {
  const router = useRouter();
  const [balance, setBalance] = useState(initialBalance);
  const [categories, setCategories] = useState(initialCategories);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const categoryData = useMemo(() => groupExpensesByCategory(expenses), [expenses]);
  const isNegative = balance.totalBalance < 0;

  function showSyncNotice(message: string) {
    setSyncNotice(message);
    setTimeout(() => setSyncNotice(null), 5000);
  }

  function adjustBalance(deltaSpent: number, deltaBonus: number) {
    setBalance((prev) => ({
      ...prev,
      totalSpent: prev.totalSpent + deltaSpent,
      totalBonuses: prev.totalBonuses + deltaBonus,
      totalBalance: prev.totalBalance - deltaSpent + deltaBonus,
    }));
  }

  async function handleAddExpense(values: ExpenseFormValues) {
    const result = await addExpense(null, values);
    if ("error" in result && result.error) {
      return { error: result.error };
    }
    if ("expense" in result) {
      setExpenses((prev) => [result.expense, ...prev]);
      adjustBalance(result.expense.total_price, result.expense.bonus_amount ?? 0);
      if (result.syncFailed) {
        showSyncNotice("Расход сохранён, но не удалось синхронизировать с Google Sheets.");
      }
      router.refresh();
    }
    return {};
  }

  async function handleUpdateExpense(expenseId: string, values: ExpenseFormValues) {
    const previous = expenses.find((e) => e.id === expenseId);
    const result = await updateExpense(expenseId, null, values);
    if ("error" in result && result.error) {
      return { error: result.error };
    }
    if ("expense" in result) {
      setExpenses((prev) => prev.map((e) => (e.id === expenseId ? result.expense : e)));
      adjustBalance(
        result.expense.total_price - (previous?.total_price ?? 0),
        (result.expense.bonus_amount ?? 0) - (previous?.bonus_amount ?? 0)
      );
      if (result.syncFailed) {
        showSyncNotice("Изменения сохранены, но синхронизация с Google Sheets не удалась.");
      }
      router.refresh();
    }
    return {};
  }

  async function handleDeleteExpense(expenseId: string) {
    const previous = expenses;
    const removed = expenses.find((e) => e.id === expenseId);
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    const result = await deleteExpense(expenseId, null);
    if ("error" in result && result.error) {
      setExpenses(previous);
      showSyncNotice("Не удалось удалить расход");
      return;
    }
    if (removed) {
      adjustBalance(-removed.total_price, -(removed.bonus_amount ?? 0));
    }
    router.refresh();
  }

  async function handleRetrySync(expenseId: string) {
    const result = await resyncExpense(expenseId, null);
    if (result.synced) {
      setExpenses((prev) =>
        prev.map((e) => (e.id === expenseId ? { ...e, synced_to_sheets: true } : e))
      );
    } else {
      showSyncNotice("Синхронизация снова не удалась. Проверьте настройки Google Sheets.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Бизнес · JA Design Studio</h1>
        <p className="text-sm text-neutral-500">
          Общее сальдо по всем счетам. Оплаты и расходы по проектам, а также
          административные расходы ниже — учитываются автоматически.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-neutral-200">
        <p className="text-xs text-neutral-500">Общее сальдо бизнеса</p>
        <p className={`mt-1 text-3xl font-bold ${isNegative ? "text-red-600" : "text-neutral-900"}`}>
          {formatTenge(balance.totalBalance)}
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          Получено {formatTenge(balance.totalReceived)} · Потрачено{" "}
          {formatTenge(balance.totalSpent)}
          {balance.totalBonuses > 0 && <> · Бонусы {formatTenge(balance.totalBonuses)}</>}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {balance.byAccount.map((acc) => (
          <div key={acc.account} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
            <p className="text-xs text-neutral-500">{acc.name}</p>
            <p
              className={`mt-1 text-xl font-bold ${
                acc.balance < 0 ? "text-red-600" : "text-neutral-900"
              }`}
            >
              {formatTenge(acc.balance)}
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              Получено {formatTenge(acc.received)} · Потрачено {formatTenge(acc.spent)}
            </p>
          </div>
        ))}
      </div>

      {(balance.unassigned.received > 0 ||
        balance.unassigned.spent > 0 ||
        balance.unassigned.bonuses > 0) && (
        <div className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-500 ring-1 ring-neutral-200">
          Без указания счёта: получено {formatTenge(balance.unassigned.received)}, потрачено{" "}
          {formatTenge(balance.unassigned.spent)}. Обычно это старые записи, внесённые до
          добавления счетов.
        </div>
      )}

      <OpeningBalances initial={initialOpeningBalances} />

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
        <h2 className="mb-1 text-base font-semibold text-neutral-900">
          Административные расходы по категориям
        </h2>
        <CategoryPieChart data={categoryData} />
      </div>

      {syncNotice && (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          {syncNotice}
        </div>
      )}

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
        <h2 className="mb-3 text-base font-semibold text-neutral-900">
          Добавить административный расход
        </h2>
        <ExpenseForm
          categories={categories}
          subcategories={[]}
          projectType="admin"
          onCategoriesChange={setCategories}
          onSubmit={handleAddExpense}
        />
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
        <h2 className="mb-3 text-base font-semibold text-neutral-900">
          Все административные расходы
        </h2>
        <ExpensesTable
          expenses={expenses}
          categories={categories}
          subcategories={[]}
          projectType="admin"
          onCategoriesChange={setCategories}
          onUpdate={handleUpdateExpense}
          onDelete={handleDeleteExpense}
          onRetrySync={handleRetrySync}
        />
      </div>
    </div>
  );
}
