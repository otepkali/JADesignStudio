"use client";

import { useMemo, useState } from "react";
import { formatTenge } from "@/lib/format";
import type { ExpenseCategory, ExpenseWithCategory, Project, ProjectBudgetLine } from "@/types/database";
import type { BudgetLinesFormValues } from "@/lib/schemas";

function buildAmountsMap(
  categories: ExpenseCategory[],
  budgetLines: ProjectBudgetLine[]
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const category of categories) {
    const existing = budgetLines.find((l) => l.category_id === category.id);
    map[category.id] = existing && existing.planned_amount > 0 ? String(existing.planned_amount) : "";
  }
  return map;
}

export function ProjectBudget({
  project,
  categories,
  initialBudgetLines,
  expenses,
  onSave,
}: {
  project: Project;
  categories: ExpenseCategory[];
  initialBudgetLines: ProjectBudgetLine[];
  expenses: ExpenseWithCategory[];
  onSave: (values: BudgetLinesFormValues) => Promise<{ error?: string }>;
}) {
  const initialAmounts = useMemo(
    () => buildAmountsMap(categories, initialBudgetLines),
    [categories, initialBudgetLines]
  );
  const hasSavedBudget = useMemo(
    () => initialBudgetLines.some((l) => l.planned_amount > 0),
    [initialBudgetLines]
  );

  const [savedAmounts, setSavedAmounts] = useState(initialAmounts);
  const [amounts, setAmounts] = useState<Record<string, string>>(initialAmounts);
  const [locked, setLocked] = useState(hasSavedBudget);
  const [hasBudget, setHasBudget] = useState(hasSavedBudget);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  const actualByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const expense of expenses) {
      if (!expense.category_id) continue;
      map[expense.category_id] = (map[expense.category_id] ?? 0) + Number(expense.total_price);
    }
    return map;
  }, [expenses]);

  const plannedTotal = categories.reduce((sum, c) => sum + (Number(amounts[c.id]) || 0), 0);
  const actualTotal = Object.values(actualByCategory).reduce((sum, v) => sum + v, 0);
  const plannedMargin = project.total_amount - plannedTotal;
  const actualMargin = project.total_amount - actualTotal;

  function handleEdit() {
    setError(null);
    setLocked(false);
  }

  function handleCancel() {
    setAmounts(savedAmounts);
    setError(null);
    setLocked(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSavedNotice(false);
    const result = await onSave({
      lines: categories.map((c) => ({
        category_id: c.id,
        planned_amount: Number(amounts[c.id]) || 0,
      })),
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSavedAmounts(amounts);
    setLocked(true);
    setHasBudget(true);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-xs text-neutral-500">
              <th className="pb-2 font-medium">Статья расходов</th>
              <th className="pb-2 font-medium">План, ₸</th>
              <th className="pb-2 font-medium">% плана</th>
              <th className="pb-2 font-medium">Факт, ₸</th>
              <th className="pb-2 font-medium">Разница</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => {
              const planned = Number(amounts[category.id]) || 0;
              const actual = actualByCategory[category.id] ?? 0;
              const diff = planned - actual;
              const percent = plannedTotal > 0 ? Math.round((planned / plannedTotal) * 100) : 0;
              return (
                <tr key={category.id} className="border-t border-neutral-100">
                  <td className="py-2 pr-2 text-neutral-700">{category.name}</td>
                  <td className="py-2 pr-2">
                    {locked ? (
                      <span className="text-neutral-900">{planned > 0 ? formatTenge(planned) : "—"}</span>
                    ) : (
                      <input
                        type="number"
                        inputMode="numeric"
                        step="any"
                        value={amounts[category.id] ?? ""}
                        onChange={(e) =>
                          setAmounts((prev) => ({ ...prev, [category.id]: e.target.value }))
                        }
                        placeholder="0"
                        className="w-28 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
                      />
                    )}
                  </td>
                  <td className="py-2 pr-2 text-neutral-500">{plannedTotal > 0 ? `${percent}%` : "—"}</td>
                  <td className="py-2 pr-2 text-neutral-700">{formatTenge(actual)}</td>
                  <td
                    className={`py-2 pr-2 font-medium ${
                      diff < 0 ? "text-red-600" : "text-neutral-500"
                    }`}
                  >
                    {planned === 0 && actual === 0 ? "—" : formatTenge(diff)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-neutral-200 font-semibold text-neutral-900">
              <td className="py-2 pr-2">Итого себестоимость</td>
              <td className="py-2 pr-2">{formatTenge(plannedTotal)}</td>
              <td className="py-2 pr-2 text-neutral-500 font-normal">100%</td>
              <td className="py-2 pr-2">{formatTenge(actualTotal)}</td>
              <td className={`py-2 pr-2 ${plannedTotal - actualTotal < 0 ? "text-red-600" : ""}`}>
                {formatTenge(plannedTotal - actualTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <p className="text-xs text-neutral-500">Общая сумма объекта</p>
          <p className="mt-1 text-base font-bold text-neutral-900">{formatTenge(project.total_amount)}</p>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <p className="text-xs text-neutral-500">Плановая маржа</p>
          <p className={`mt-1 text-base font-bold ${plannedMargin < 0 ? "text-red-600" : "text-emerald-700"}`}>
            {formatTenge(plannedMargin)}
          </p>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <p className="text-xs text-neutral-500">Фактическая маржа</p>
          <p className={`mt-1 text-base font-bold ${actualMargin < 0 ? "text-red-600" : "text-emerald-700"}`}>
            {formatTenge(actualMargin)}
          </p>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex items-center gap-3">
        {locked ? (
          <button
            onClick={handleEdit}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-brand-300 hover:bg-brand-50"
          >
            Изменить
          </button>
        ) : (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-50"
            >
              {saving ? "Сохранение..." : "Сохранить план"}
            </button>
            {hasBudget && (
              <button
                onClick={handleCancel}
                disabled={saving}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
              >
                Отмена
              </button>
            )}
          </>
        )}
        {savedNotice && <span className="text-sm text-emerald-700">Сохранено</span>}
      </div>
    </div>
  );
}
