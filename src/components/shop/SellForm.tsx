"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { saleSchema, type SaleFormInput, type SaleFormValues } from "@/lib/schemas";
import { formatTenge } from "@/lib/format";
import { calculateSale } from "@/lib/shop";
import type { Product } from "@/types/database";

export function SellForm({
  product,
  onSubmit: onSubmitValues,
  onCancel,
}: {
  product: Product;
  onSubmit: (values: SaleFormValues) => Promise<{ error?: string }>;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SaleFormInput, unknown, SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      quantity: 1,
      unit_price_kzt: product.list_price_kzt,
      sold_at: new Date().toISOString().slice(0, 10),
    },
  });

  const unitPrice = Number(watch("unit_price_kzt")) || 0;
  const preview = calculateSale(
    unitPrice,
    product.cost_price_kzt,
    product.margin_amount_kzt,
    product.margin_percent
  );
  const hasDiscount = unitPrice < product.list_price_kzt;

  async function onSubmit(values: SaleFormValues) {
    setServerError(null);
    const result = await onSubmitValues(values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    onCancel();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <p className="font-medium text-neutral-900">{product.name}</p>
        <p className="text-xs text-neutral-500">
          {product.sku} · {product.size}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Количество</label>
          <input
            type="number"
            min={1}
            step={1}
            {...register("quantity")}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          {errors.quantity && (
            <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
          )}
          {!product.available_on_order && (
            <p className="mt-1 text-xs text-neutral-400">На складе: {product.stock_qty} шт.</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Дата</label>
          <input
            type="date"
            {...register("sold_at")}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Фактическая цена продажи, шт.
        </label>
        <input
          type="number"
          min={0}
          step={1}
          {...register("unit_price_kzt")}
          className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        {errors.unit_price_kzt && (
          <p className="mt-1 text-sm text-red-600">{errors.unit_price_kzt.message}</p>
        )}
        <p className="mt-1 text-xs text-neutral-400">
          Цена по прайсу: {formatTenge(product.list_price_kzt)}
        </p>
      </div>

      <div className="rounded-xl bg-neutral-50 p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-500">Маржа при этой цене</span>
          <span className="font-medium text-neutral-900">
            {formatTenge(preview.actualMarginKzt)} ({preview.actualMarginPercent.toFixed(1)}%)
          </span>
        </div>
        {hasDiscount && (
          <div className="mt-1 flex justify-between text-red-600">
            <span>Разница с полной маржой</span>
            <span className="font-medium">
              −{formatTenge(preview.marginDiffKzt)} (−{preview.marginPercentDiff.toFixed(1)} п.п.)
            </span>
          </div>
        )}
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-brand-700 px-4 py-3 text-base font-medium text-white transition hover:bg-brand-800 disabled:opacity-50"
        >
          {isSubmitting ? "Сохранение..." : "Записать продажу"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 rounded-xl border border-neutral-300 px-4 py-3 text-base text-neutral-600 transition hover:border-brand-300 hover:bg-brand-50"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
