"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema, type ProjectFormInput, type ProjectFormValues } from "@/lib/schemas";
import { createProject } from "@/app/(app)/projects/new/actions";

export function ProjectForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormInput, unknown, ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { prepayment_percent: 50 },
  });

  async function onSubmit(values: ProjectFormValues) {
    setServerError(null);
    const result = await createProject(values);
    if ("error" in result) {
      setServerError(result.error);
      return;
    }
    router.push(`/projects/${result.id}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Название объекта
        </label>
        <input
          {...register("name")}
          placeholder="Например: Квартира на Абая 15"
          className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
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
          className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
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
            className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
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
            className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-brand-700 px-4 py-3 text-base font-medium text-white transition hover:bg-brand-800 disabled:opacity-50"
      >
        {isSubmitting ? "Создание..." : "Создать проект"}
      </button>
    </form>
  );
}
