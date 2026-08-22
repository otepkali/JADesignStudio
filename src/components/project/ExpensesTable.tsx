"use client";

import { useMemo, useState } from "react";
import { formatDate, formatTenge } from "@/lib/format";
import { ExpenseForm } from "@/components/project/ExpenseForm";
import type {
  ExpenseCategory,
  ExpenseSubcategory,
  ExpenseWithCategory,
  ProjectType,
} from "@/types/database";
import type { ExpenseFormValues } from "@/lib/schemas";

export function ExpensesTable({
  expenses,
  categories,
  subcategories,
  projectType,
  onCategoriesChange,
  onUpdate,
  onDelete,
  onRetrySync,
}: {
  expenses: ExpenseWithCategory[];
  categories: ExpenseCategory[];
  subcategories: ExpenseSubcategory[];
  projectType: ProjectType;
  onCategoriesChange: (categories: ExpenseCategory[]) => void;
  onUpdate: (expenseId: string, values: ExpenseFormValues) => Promise<{ error?: string }>;
  onDelete: (expenseId: string) => Promise<void>;
  onRetrySync: (expenseId: string) => Promise<void>;
}) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      categoryFilter === "all"
        ? expenses
        : expenses.filter((e) => e.category_id === categoryFilter),
    [expenses, categoryFilter]
  );

  const editingExpense = expenses.find((e) => e.id === editingId) ?? null;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <label className="text-sm text-neutral-500">Фильтр:</label>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-neutral-300 px-2 py-1.5 text-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          <option value="all">Все статьи</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-400">Расходов пока нет</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((expense) =>
            editingExpense?.id === expense.id ? (
              <div key={expense.id} className="rounded-xl border border-neutral-300 bg-neutral-50 p-4">
                <ExpenseForm
                  categories={categories}
                  subcategories={subcategories}
                  projectType={projectType}
                  onCategoriesChange={onCategoriesChange}
                  submitLabel="Сохранить"
                  onCancel={() => setEditingId(null)}
                  defaultValues={{
                    category_id: expense.category_id ?? categories[0]?.id ?? "",
                    subcategory_id: expense.subcategory_id ?? "",
                    material_name: expense.material_name,
                    quantity: expense.quantity ?? undefined,
                    unit: expense.unit ?? "",
                    entry_mode: expense.unit_price ? "unit_price" : "total",
                    unit_price: expense.unit_price ?? undefined,
                    total_price: expense.total_price,
                    expense_date: expense.expense_date,
                    note: expense.note ?? "",
                  }}
                  onSubmit={(values) => onUpdate(expense.id, values)}
                />
              </div>
            ) : (
              <div
                key={expense.id}
                className="flex items-start justify-between gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-neutral-200"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-neutral-900">{expense.material_name}</p>
                  <p className="text-xs text-neutral-500">
                    {expense.expense_categories?.name ?? "Без категории"}
                    {expense.expense_subcategories ? ` / ${expense.expense_subcategories.name}` : ""}
                    {" · "}
                    {formatDate(expense.expense_date)}
                    {expense.quantity ? ` · ${expense.quantity} ${expense.unit ?? ""}` : ""}
                  </p>
                  {expense.note && <p className="mt-1 text-xs text-neutral-400">{expense.note}</p>}
                  {!expense.synced_to_sheets && (
                    <button
                      onClick={() => onRetrySync(expense.id)}
                      className="mt-1 text-xs text-amber-600 underline"
                    >
                      Не синхронизировано с Google Sheets · повторить
                    </button>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-semibold text-neutral-900">
                    {formatTenge(expense.total_price)}
                  </span>
                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={() => setEditingId(expense.id)}
                      className="text-neutral-500 hover:text-brand-700"
                    >
                      Изменить
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Удалить расход?")) onDelete(expense.id);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
