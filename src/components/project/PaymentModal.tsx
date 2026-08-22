"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { paymentSchema, type PaymentFormInput, type PaymentFormValues } from "@/lib/schemas";
import { ACCOUNTS } from "@/lib/accounts";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function PaymentModal({
  open,
  onClose,
  onSubmit: onSubmitValues,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: PaymentFormValues) => Promise<{ error?: string }>;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormInput, unknown, PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { payment_type: "additional", paid_at: todayISO(), account: "ip_account" },
  });

  if (!open) return null;

  async function onSubmit(values: PaymentFormValues) {
    setServerError(null);
    const result = await onSubmitValues(values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    reset({
      payment_type: "additional",
      paid_at: todayISO(),
      account: values.account,
      amount: undefined,
      note: "",
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">Добавить оплату</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Сумма, ₸</label>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              autoFocus
              {...register("amount")}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Тип оплаты</label>
            <select
              {...register("payment_type")}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="additional">Доплата</option>
              <option value="final">Финальный расчёт</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Счёт</label>
            <select
              {...register("account")}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              {ACCOUNTS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Дата</label>
            <input
              type="date"
              {...register("paid_at")}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Примечание
            </label>
            <input
              {...register("note")}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          {serverError && <p className="text-sm text-red-600">{serverError}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-brand-700 px-4 py-3 text-base font-medium text-white transition hover:bg-brand-800 disabled:opacity-50"
          >
            {isSubmitting ? "Сохранение..." : "Сохранить оплату"}
          </button>
        </form>
      </div>
    </div>
  );
}
