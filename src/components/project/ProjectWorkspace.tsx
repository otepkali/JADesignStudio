"use client";

import { useMemo, useState } from "react";
import { formatDate, formatTenge } from "@/lib/format";
import { calculateProjectTotals } from "@/lib/calculations";
import { groupExpensesByCategory, groupExpensesByWeek } from "@/lib/analytics";
import { ExpenseForm } from "@/components/project/ExpenseForm";
import { ExpensesTable } from "@/components/project/ExpensesTable";
import { PaymentModal } from "@/components/project/PaymentModal";
import { EditProjectModal } from "@/components/project/EditProjectModal";
import { CategoryPieChart } from "@/components/project/CategoryPieChart";
import { WeeklyBarChart } from "@/components/project/WeeklyBarChart";
import { ProjectBudget } from "@/components/project/ProjectBudget";
import {
  addExpense,
  addPayment,
  deleteExpense,
  resyncExpense,
  saveBudgetLines,
  updateExpense,
  updateProject,
} from "@/app/(app)/projects/[id]/actions";
import type {
  Project,
  ExpenseCategory,
  ExpenseSubcategory,
  ExpenseWithCategory,
  Payment,
  ProjectBudgetLine,
} from "@/types/database";
import type {
  BudgetLinesFormValues,
  ExpenseFormValues,
  PaymentFormValues,
  ProjectUpdateFormValues,
} from "@/lib/schemas";

export function ProjectWorkspace({
  project: initialProject,
  initialPayments,
  initialExpenses,
  initialCategories,
  initialSubcategories,
  initialBudgetLines,
}: {
  project: Project;
  initialPayments: Payment[];
  initialExpenses: ExpenseWithCategory[];
  initialCategories: ExpenseCategory[];
  initialSubcategories: ExpenseSubcategory[];
  initialBudgetLines: ProjectBudgetLine[];
}) {
  const [project, setProject] = useState(initialProject);
  const [payments, setPayments] = useState(initialPayments);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [categories, setCategories] = useState(initialCategories);
  const [subcategories] = useState(initialSubcategories);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editProjectModalOpen, setEditProjectModalOpen] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const totals = useMemo(() => calculateProjectTotals(payments, expenses), [payments, expenses]);
  const categoryData = useMemo(() => groupExpensesByCategory(expenses), [expenses]);
  const weeklyData = useMemo(() => groupExpensesByWeek(expenses), [expenses]);

  function showSyncNotice(message: string) {
    setSyncNotice(message);
    setTimeout(() => setSyncNotice(null), 5000);
  }

  async function handleAddExpense(values: ExpenseFormValues) {
    const result = await addExpense(project.id, values);
    if ("error" in result && result.error) {
      return { error: result.error };
    }
    if ("expense" in result) {
      setExpenses((prev) => [result.expense, ...prev]);
      if (result.syncFailed) {
        showSyncNotice("Расход сохранён, но не удалось синхронизировать с Google Sheets. Можно повторить позже.");
      }
    }
    return {};
  }

  async function handleUpdateExpense(expenseId: string, values: ExpenseFormValues) {
    const result = await updateExpense(expenseId, project.id, values);
    if ("error" in result && result.error) {
      return { error: result.error };
    }
    if ("expense" in result) {
      setExpenses((prev) => prev.map((e) => (e.id === expenseId ? result.expense : e)));
      if (result.syncFailed) {
        showSyncNotice("Изменения сохранены, но синхронизация с Google Sheets не удалась.");
      }
    }
    return {};
  }

  async function handleDeleteExpense(expenseId: string) {
    const previous = expenses;
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    const result = await deleteExpense(expenseId, project.id);
    if ("error" in result && result.error) {
      setExpenses(previous);
      showSyncNotice("Не удалось удалить расход");
    }
  }

  async function handleRetrySync(expenseId: string) {
    const result = await resyncExpense(expenseId, project.id);
    if (result.synced) {
      setExpenses((prev) =>
        prev.map((e) => (e.id === expenseId ? { ...e, synced_to_sheets: true } : e))
      );
    } else {
      showSyncNotice("Синхронизация снова не удалась. Проверьте настройки Google Sheets.");
    }
  }

  async function handleUpdateProject(values: ProjectUpdateFormValues) {
    const result = await updateProject(project.id, values);
    if ("error" in result && result.error) {
      return { error: result.error };
    }
    if ("project" in result) {
      setProject(result.project);
    }
    return {};
  }

  async function handleSaveBudget(values: BudgetLinesFormValues) {
    const result = await saveBudgetLines(project.id, values);
    if ("error" in result && result.error) {
      return { error: result.error };
    }
    return {};
  }

  async function handleAddPayment(values: PaymentFormValues) {
    const result = await addPayment(project.id, values);
    if ("error" in result && result.error) {
      return { error: result.error };
    }
    if ("payment" in result) {
      setPayments((prev) => [result.payment, ...prev]);
    }
    return {};
  }

  const isOverBudget = totals.remaining < 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">{project.name}</h1>
            <p className="text-sm text-neutral-500">
              {project.project_type === "design" ? "Дизайн проект" : "Ремонт под ключ"} · Дедлайн:{" "}
              {formatDate(project.deadline)} · {project.status === "completed" ? "Завершён" : "В работе"}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => setEditProjectModalOpen(true)}
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-brand-300 hover:bg-brand-50"
            >
              Изменить
            </button>
            <button
              onClick={() => setPaymentModalOpen(true)}
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-brand-300 hover:bg-brand-50"
            >
              + Добавить оплату
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-neutral-200">
            <p className="text-xs text-neutral-500">Получено</p>
            <p className="mt-1 text-lg font-bold text-neutral-900 sm:text-xl">
              {formatTenge(totals.received)}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-neutral-200">
            <p className="text-xs text-neutral-500">Потрачено</p>
            <p className="mt-1 text-lg font-bold text-neutral-900 sm:text-xl">
              {formatTenge(totals.spent)}
            </p>
          </div>
          <div
            className={`rounded-2xl p-4 text-center shadow-sm ring-1 ${
              isOverBudget ? "bg-red-50 ring-red-200" : "bg-white ring-neutral-200"
            }`}
          >
            <p className="text-xs text-neutral-500">Остаток</p>
            <p className={`mt-1 text-lg font-bold sm:text-xl ${isOverBudget ? "text-red-600" : "text-neutral-900"}`}>
              {formatTenge(totals.remaining)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
        <h2 className="mb-3 text-base font-semibold text-neutral-900">
          Плановая себестоимость и маржа
        </h2>
        <ProjectBudget
          project={project}
          categories={categories}
          initialBudgetLines={initialBudgetLines}
          expenses={expenses}
          onSave={handleSaveBudget}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
          <h2 className="mb-1 text-base font-semibold text-neutral-900">По статьям расходов</h2>
          <CategoryPieChart data={categoryData} />
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
          <h2 className="mb-1 text-base font-semibold text-neutral-900">Расходы по неделям</h2>
          <WeeklyBarChart data={weeklyData} />
        </div>
      </div>

      {syncNotice && (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          {syncNotice}
        </div>
      )}

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
        <h2 className="mb-3 text-base font-semibold text-neutral-900">Добавить расход</h2>
        <ExpenseForm
          categories={categories}
          subcategories={subcategories}
          projectType={project.project_type}
          onCategoriesChange={setCategories}
          onSubmit={handleAddExpense}
        />
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
        <h2 className="mb-3 text-base font-semibold text-neutral-900">Все расходы</h2>
        <ExpensesTable
          expenses={expenses}
          categories={categories}
          subcategories={subcategories}
          projectType={project.project_type}
          onCategoriesChange={setCategories}
          onUpdate={handleUpdateExpense}
          onDelete={handleDeleteExpense}
          onRetrySync={handleRetrySync}
        />
      </div>

      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSubmit={handleAddPayment}
      />

      <EditProjectModal
        open={editProjectModalOpen}
        project={project}
        onClose={() => setEditProjectModalOpen(false)}
        onSubmit={handleUpdateProject}
      />
    </div>
  );
}
