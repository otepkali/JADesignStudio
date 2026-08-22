"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, type ExpenseFormInput, type ExpenseFormValues } from "@/lib/schemas";
import { addCategory } from "@/app/(app)/projects/[id]/actions";
import type { ExpenseCategory, ExpenseSubcategory, ProjectType } from "@/types/database";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function ExpenseForm({
  categories,
  subcategories,
  projectType,
  onCategoriesChange,
  onSubmit: onSubmitValues,
  defaultValues,
  submitLabel = "Добавить расход",
  onCancel,
}: {
  categories: ExpenseCategory[];
  subcategories: ExpenseSubcategory[];
  projectType: ProjectType;
  onCategoriesChange: (categories: ExpenseCategory[]) => void;
  onSubmit: (values: ExpenseFormValues) => Promise<{ error?: string }>;
  defaultValues?: Partial<ExpenseFormInput>;
  submitLabel?: string;
  onCancel?: () => void;
}) {
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormInput, unknown, ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      entry_mode: "total",
      expense_date: todayISO(),
      category_id: categories[0]?.id ?? "",
      ...defaultValues,
    },
  });

  const entryMode = watch("entry_mode");
  const categoryId = watch("category_id");
  const subcategoryOptions = subcategories.filter((s) => s.category_id === categoryId);

  async function handleAddCategory() {
    const result = await addCategory(newCategoryName, projectType);
    if ("error" in result) {
      setServerError(result.error);
      return;
    }
    const updated = [...categories, result.category].sort((a, b) => a.name.localeCompare(b.name));
    onCategoriesChange(updated);
    setValue("category_id", result.category.id);
    setNewCategoryName("");
    setAddingCategory(false);
  }

  async function onSubmit(values: ExpenseFormValues) {
    setServerError(null);
    const result = await onSubmitValues(values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    if (onCancel) {
      onCancel();
      return;
    }
    reset({
      entry_mode: values.entry_mode,
      expense_date: todayISO(),
      category_id: values.category_id,
      subcategory_id: values.subcategory_id ?? "",
      material_name: "",
      quantity: undefined,
      unit: "",
      unit_price: undefined,
      total_price: undefined,
      note: "",
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Статья расходов
          </label>
          {!addingCategory ? (
            <div className="flex gap-2">
              <select
                {...register("category_id", { onChange: () => setValue("subcategory_id", "") })}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setAddingCategory(true)}
                className="shrink-0 rounded-xl border border-neutral-300 px-3 text-sm text-neutral-600 transition hover:border-brand-300 hover:bg-brand-50"
              >
                + своя
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                autoFocus
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Название категории"
                className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="shrink-0 rounded-xl bg-brand-700 px-3 text-sm text-white transition hover:bg-brand-800"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => setAddingCategory(false)}
                className="shrink-0 rounded-xl border border-neutral-300 px-3 text-sm text-neutral-600 transition hover:bg-neutral-50"
              >
                ×
              </button>
            </div>
          )}
          {errors.category_id && (
            <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>
          )}
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block text-sm font-medium text-neutral-700">Дата</label>
          <input
            type="date"
            {...register("expense_date")}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      {subcategoryOptions.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Подкатегория</label>
          <select
            {...register("subcategory_id")}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="">— не указана —</option>
            {subcategoryOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Название материала / работы
        </label>
        <input
          {...register("material_name")}
          placeholder="Например: Ламинат"
          className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        {errors.material_name && (
          <p className="mt-1 text-sm text-red-600">{errors.material_name.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-neutral-500">Способ ввода суммы:</span>
        <button
          type="button"
          onClick={() => setValue("entry_mode", "total")}
          className={`rounded-full px-3 py-1 ${
            entryMode === "total" ? "bg-brand-700 text-white" : "bg-neutral-100 text-neutral-600"
          }`}
        >
          Сумма целиком
        </button>
        <button
          type="button"
          onClick={() => setValue("entry_mode", "unit_price")}
          className={`rounded-full px-3 py-1 ${
            entryMode === "unit_price"
              ? "bg-brand-700 text-white"
              : "bg-neutral-100 text-neutral-600"
          }`}
        >
          Кол-во × цена
        </button>
      </div>

      {entryMode === "total" ? (
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Сумма, ₸</label>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            {...register("total_price")}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Кол-во</label>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              {...register("quantity")}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Ед. изм.</label>
            <input
              {...register("unit")}
              placeholder="шт, м²"
              className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Цена за ед.
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              {...register("unit_price")}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>
      )}
      {errors.total_price && (
        <p className="text-sm text-red-600">{errors.total_price.message}</p>
      )}

      <details className="text-sm">
        <summary className="cursor-pointer text-neutral-500">Примечание (необязательно)</summary>
        <input
          {...register("note")}
          className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </details>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-brand-700 px-4 py-3 text-base font-medium text-white transition hover:bg-brand-800 disabled:opacity-50"
        >
          {isSubmitting ? "Сохранение..." : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 rounded-xl border border-neutral-300 px-4 py-3 text-base text-neutral-600 transition hover:border-brand-300 hover:bg-brand-50"
          >
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}
