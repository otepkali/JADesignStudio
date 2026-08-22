"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  projectUpdateSchema,
  type ProjectUpdateFormInput,
  type ProjectUpdateFormValues,
} from "@/lib/schemas";
import type { Project } from "@/types/database";

export function EditProjectModal({
  open,
  project,
  onClose,
  onSubmit: onSubmitValues,
}: {
  open: boolean;
  project: Project;
  onClose: () => void;
  onSubmit: (values: ProjectUpdateFormValues) => Promise<{ error?: string }>;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectUpdateFormInput, unknown, ProjectUpdateFormValues>({
    resolver: zodResolver(projectUpdateSchema),
    defaultValues: {
      name: project.name,
      total_amount: project.total_amount,
      deadline: project.deadline ?? "",
      prepayment_percent: project.prepayment_percent,
      status: project.status,
    },
  });

  if (!open) return null;

  async function onSubmit(values: ProjectUpdateFormValues) {
    setServerError(null);
    const result = await onSubmitValues(values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">Изменить проект</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Название объекта
            </label>
            <input
              {...register("name")}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Сумма объекта, ₸
            </label>
            <input
              type="number"
              inputMode="numeric"
              step="1"
              {...register("total_amount")}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
            />
            {errors.total_amount && (
              <p className="mt-1 text-sm text-red-600">{errors.total_amount.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Дедлайн</label>
              <input
                type="date"
                {...register("deadline")}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                % предоплаты
              </label>
              <input
                type="number"
                inputMode="numeric"
                {...register("prepayment_percent")}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Статус</label>
            <select
              {...register("status")}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
            >
              <option value="in_progress">В работе</option>
              <option value="completed">Завершён</option>
            </select>
          </div>

          {serverError && <p className="text-sm text-red-600">{serverError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-neutral-900 px-4 py-3 text-base font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {isSubmitting ? "Сохранение..." : "Сохранить изменения"}
          </button>
        </form>
      </div>
    </div>
  );
}
