"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate, formatTenge } from "@/lib/format";
import { ACCOUNTS, ACCOUNT_LABELS } from "@/lib/accounts";
import { groupExpensesByCategory } from "@/lib/analytics";
import { ExpenseForm } from "@/components/project/ExpenseForm";
import { ExpensesTable } from "@/components/project/ExpensesTable";
import { CategoryPieChart } from "@/components/project/CategoryPieChart";
import { addBonusIncome, deleteBonusIncome } from "@/app/(app)/business/actions";
import {
  addExpense,
  deleteExpense,
  resyncExpense,
  updateExpense,
} from "@/app/(app)/projects/[id]/actions";
import type { BonusIncome, BusinessBalance } from "@/lib/data";
import type { ExpenseCategory, ExpenseWithCategory } from "@/types/database";
import type { BonusIncomeFormValues, ExpenseFormValues } from "@/lib/schemas";

export function BusinessWorkspace({
  initialBalance,
  initialCategories,
  initialExpenses,
  projectBonuses,
  initialManualBonuses,
}: {
  initialBalance: BusinessBalance;
  initialCategories: ExpenseCategory[];
  initialExpenses: ExpenseWithCategory[];
  projectBonuses: BonusIncome[];
  initialManualBonuses: BonusIncome[];
}) {
  const router = useRouter();
  const [balance, setBalance] = useState(initialBalance);
  const [categories, setCategories] = useState(initialCategories);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const categoryData = useMemo(() => groupExpensesByCategory(expenses), [expenses]);
  const isNegative = balance.totalBalance < 0;

  const [manualBonuses, setManualBonuses] = useState(initialManualBonuses);
  const [bonusForm, setBonusForm] = useState({
    title: "",
    amount: "",
    account: ACCOUNTS[0].id as string,
    date: new Date().toISOString().slice(0, 10),
  });
  const [bonusError, setBonusError] = useState<string | null>(null);
  const [bonusSaving, setBonusSaving] = useState(false);

  const bonusRows = useMemo<BonusIncome[]>(() => {
    const adminRows: BonusIncome[] = expenses
      .filter((e) => (e.bonus_amount ?? 0) > 0)
      .map((e) => ({
        id: e.id,
        source: "expense",
        title: e.material_name,
        amount: Number(e.bonus_amount),
        percent: e.bonus_percent,
        account: e.account,
        date: e.expense_date,
        projectName: null,
      }));
    return [...projectBonuses, ...adminRows, ...manualBonuses].sort((a, b) =>
      b.date.localeCompare(a.date)
    );
  }, [expenses, projectBonuses, manualBonuses]);
  const bonusTotal = bonusRows.reduce((sum, r) => sum + r.amount, 0);

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

  async function handleAddBonus(e: React.FormEvent) {
    e.preventDefault();
    setBonusError(null);
    setBonusSaving(true);
    const result = await addBonusIncome({
      title: bonusForm.title.trim(),
      amount: Number(bonusForm.amount),
      account: bonusForm.account as BonusIncomeFormValues["account"],
      income_date: bonusForm.date,
      note: "",
    });
    setBonusSaving(false);
    if ("error" in result) {
      setBonusError(result.error);
      return;
    }
    setManualBonuses((prev) => [result.bonus, ...prev]);
    adjustBalance(0, result.bonus.amount);
    setBonusForm((f) => ({ ...f, title: "", amount: "" }));
    router.refresh();
  }

  async function handleDeleteBonus(row: BonusIncome) {
    const result = await deleteBonusIncome(row.id);
    if ("error" in result) {
      showSyncNotice("Не удалось удалить бонус");
      return;
    }
    setManualBonuses((prev) => prev.filter((b) => b.id !== row.id));
    adjustBalance(0, -row.amount);
    router.refresh();
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
          добавления счетов — в сальдо выше не учитываются.
        </div>
      )}

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-neutral-900">Доходы от бонусов</h2>
          <p className="text-sm text-neutral-500">
            Всего: <span className="font-semibold text-emerald-700">{formatTenge(bonusTotal)}</span>
          </p>
        </div>
        <form onSubmit={handleAddBonus} className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-6">
          <input
            required
            value={bonusForm.title}
            onChange={(e) => setBonusForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="За что бонус (поставщик, объём…)"
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            required
            type="number"
            min="1"
            step="any"
            inputMode="decimal"
            value={bonusForm.amount}
            onChange={(e) => setBonusForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="Сумма, ₸"
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
          <select
            value={bonusForm.account}
            onChange={(e) => setBonusForm((f) => ({ ...f, account: e.target.value }))}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          >
            {ACCOUNTS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <input
            required
            type="date"
            value={bonusForm.date}
            onChange={(e) => setBonusForm((f) => ({ ...f, date: e.target.value }))}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={bonusSaving}
            className="rounded-lg bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60"
          >
            {bonusSaving ? "..." : "Добавить"}
          </button>
          {bonusError && <p className="text-sm text-red-600 sm:col-span-6">{bonusError}</p>}
        </form>
        {bonusRows.length === 0 ? (
          <p className="text-sm text-neutral-400">
            Пока нет бонусов. Добавьте выше или включите «Бонус от поставщика» в расходе.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {bonusRows.map((row) => (
              <li key={row.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-neutral-900">{row.title}</p>
                  <p className="text-xs text-neutral-400">
                    {formatDate(row.date)} · {row.projectName ?? (row.source === "manual" ? "Бонус" : "Админ. расходы")}
                    {row.account ? ` · ${ACCOUNT_LABELS[row.account]}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <p className="font-semibold text-emerald-700">
                    +{formatTenge(row.amount)}
                    {row.percent ? (
                      <span className="ml-1 text-xs font-normal text-neutral-400">
                        ({row.percent}%)
                      </span>
                    ) : null}
                  </p>
                  {row.source === "manual" && (
                    <button
                      type="button"
                      aria-label="Удалить бонус"
                      onClick={() => handleDeleteBonus(row)}
                      className="rounded-md px-1.5 text-neutral-300 hover:bg-red-50 hover:text-red-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

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
