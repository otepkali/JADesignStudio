import Link from "next/link";
import { formatTenge, formatDate } from "@/lib/format";
import type { SaleWithProduct } from "@/types/database";
import type { SalesSummary } from "@/lib/data";

export function SalesReport({
  sales,
  summary,
}: {
  sales: SaleWithProduct[];
  summary: SalesSummary;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Магазин · Продажи</h1>
          <p className="text-sm text-neutral-500">История продаж и итоги по марже.</p>
        </div>
        <Link
          href="/shop"
          className="shrink-0 rounded-xl border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 transition hover:border-brand-300 hover:bg-brand-50"
        >
          Склад
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
          <p className="text-xs text-neutral-500">Общая выручка</p>
          <p className="mt-1 text-lg font-semibold text-neutral-900">
            {formatTenge(summary.totalRevenue)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
          <p className="text-xs text-neutral-500">Заработано (фактическая маржа)</p>
          <p className="mt-1 text-lg font-semibold text-emerald-700">
            {formatTenge(summary.totalActualMargin)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
          <p className="text-xs text-neutral-500">Недополучено из-за скидок</p>
          <p className="mt-1 text-lg font-semibold text-red-600">
            {formatTenge(summary.totalLostMargin)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-left text-neutral-500">
              <th className="px-4 py-3 font-medium">Дата</th>
              <th className="px-4 py-3 font-medium">Товар</th>
              <th className="px-4 py-3 text-right font-medium">Кол-во</th>
              <th className="px-4 py-3 text-right font-medium">Цена</th>
              <th className="px-4 py-3 text-right font-medium">Маржа</th>
              <th className="px-4 py-3 text-right font-medium">Разница</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {sales.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-400">
                  Продаж пока нет
                </td>
              </tr>
            ) : (
              sales.map((s) => {
                const discounted = s.margin_diff_kzt > 0;
                const fullPercent = s.products?.margin_percent ?? 0;
                const actualPercent =
                  s.unit_price_kzt > 0 ? (s.actual_margin_kzt / s.unit_price_kzt) * 100 : 0;
                return (
                  <tr key={s.id} className={discounted ? "bg-red-50/50" : undefined}>
                    <td className="px-4 py-3 text-neutral-500">{formatDate(s.sold_at)}</td>
                    <td className="px-4 py-3 text-neutral-900">
                      {s.products?.name ?? "—"}
                      <span className="ml-1 text-xs text-neutral-400">{s.products?.sku}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-700">{s.quantity}</td>
                    <td className="px-4 py-3 text-right text-neutral-700">
                      {formatTenge(s.unit_price_kzt)}
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-700">
                      {formatTenge(s.actual_margin_kzt * s.quantity)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {discounted ? (
                        <span className="font-medium text-red-600">
                          {fullPercent.toFixed(0)}% → {actualPercent.toFixed(0)}%, −
                          {(fullPercent - actualPercent).toFixed(0)} п.п.
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
