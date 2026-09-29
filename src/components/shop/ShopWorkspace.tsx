"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SellModal } from "@/components/shop/SellModal";
import { recordSale } from "@/app/(app)/shop/actions";
import { formatTenge } from "@/lib/format";
import type { Product } from "@/types/database";
import type { SaleFormValues } from "@/lib/schemas";

export function ShopWorkspace({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [selling, setSelling] = useState<Product | null>(null);

  async function handleSell(productId: string, values: SaleFormValues) {
    const result = await recordSale(productId, values);
    if ("error" in result) {
      return { error: result.error };
    }
    if (!products.find((p) => p.id === productId)?.available_on_order) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, stock_qty: p.stock_qty - values.quantity } : p
        )
      );
    }
    return {};
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Магазин · Склад</h1>
          <p className="text-sm text-neutral-500">
            Себестоимость, цены, маржа и остатки по всем товарам.
          </p>
        </div>
        <div className="flex shrink-0 gap-2 text-sm">
          <Link
            href="/catalog"
            target="_blank"
            className="rounded-xl border border-neutral-300 px-3 py-1.5 text-neutral-600 transition hover:border-brand-300 hover:bg-brand-50"
          >
            Каталог
          </Link>
          <Link
            href="/shop/sales"
            className="rounded-xl border border-neutral-300 px-3 py-1.5 text-neutral-600 transition hover:border-brand-300 hover:bg-brand-50"
          >
            Отчёт по продажам
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
        <table className="w-full min-w-[840px] text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-left text-neutral-500">
              <th className="px-4 py-3 font-medium">Товар</th>
              <th className="px-4 py-3 font-medium">Артикул</th>
              <th className="px-4 py-3 font-medium">Размер</th>
              <th className="px-4 py-3 text-right font-medium">Себестоимость</th>
              <th className="px-4 py-3 text-right font-medium">Цена продажи</th>
              <th className="px-4 py-3 text-right font-medium">Маржа</th>
              <th className="px-4 py-3 text-right font-medium">Остаток</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                      <Image
                        src={`/products/${p.image}`}
                        alt={p.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="font-medium text-neutral-900">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-500">{p.sku}</td>
                <td className="px-4 py-3 text-neutral-500">{p.size}</td>
                <td className="px-4 py-3 text-right text-neutral-700">
                  {formatTenge(p.cost_price_kzt)}
                </td>
                <td className="px-4 py-3 text-right text-neutral-700">
                  {formatTenge(p.list_price_kzt)}
                </td>
                <td className="px-4 py-3 text-right text-neutral-700">
                  {formatTenge(p.margin_amount_kzt)}
                  <span className="ml-1 text-xs text-neutral-400">
                    ({p.margin_percent.toFixed(1)}%)
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-neutral-700">
                  {p.available_on_order ? "—" : p.stock_qty}
                </td>
                <td className="px-4 py-3">
                  {p.available_on_order ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      Под заказ
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      В наличии
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setSelling(p)}
                    disabled={!p.available_on_order && p.stock_qty <= 0}
                    className="rounded-xl bg-brand-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-800 disabled:opacity-40"
                  >
                    Продать
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SellModal product={selling} onClose={() => setSelling(null)} onSubmit={handleSell} />
    </div>
  );
}
