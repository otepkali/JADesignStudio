"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskSchema, type TaskFormInput, type TaskFormValues } from "@/lib/schemas";

export function TaskForm({
  onSubmit: onSubmitValues,
  defaultValues,
  submitLabel = "Добавить задачу",
  onCancel,
}: {
  onSubmit: (values: TaskFormValues) => Promise<{ error?: string }>;
  defaultValues?: Partial<TaskFormInput>;
  submitLabel?: string;
  onCancel?: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormInput, unknown, TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      status: "todo",
      priority: "medium",
      ...defaultValues,
    },
  });

  async function onSubmit(values: TaskFormValues) {
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
    reset({ title: "", assignee: "", deadline: "", status: "todo", priority: "medium", note: "" });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">Задача</label>
        <input
          {...register("title")}
          placeholder="Например: Заказать плитку для санузла"
          className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Ответственный</label>
          <input
            {...register("assignee")}
            placeholder="Имя"
            className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Дедлайн</label>
          <input
            type="date"
            {...register("deadline")}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Статус</label>
          <select
            {...register("status")}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="todo">Не начато</option>
            <option value="in_progress">В процессе</option>
            <option value="done">Готово</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Важность</label>
          <select
            {...register("priority")}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="low">Низкая</option>
            <option value="medium">Средняя</option>
            <option value="high">Высокая</option>
          </select>
        </div>
      </div>

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
