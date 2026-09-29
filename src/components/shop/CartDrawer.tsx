"use client";

import { useState } from "react";
import { useCart } from "@/components/shop/CartContext";
import { exportCartToExcel } from "@/lib/cartExport";
import { formatTenge } from "@/lib/format";

export function CartDrawer() {
  const { items, updateQty, removeItem, clear, total, count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-20 flex items-center gap-2 rounded-full bg-brand-700 px-5 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-brand-800"
      >
        Корзина
        {count > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-semibold text-brand-700">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
              <h2 className="text-base font-semibold text-neutral-900">Корзина</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {items.length === 0 ? (
                <p className="py-8 text-center text-sm text-neutral-400">Корзина пуста</p>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {items.map((i) => (
                    <li key={i.productId} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-900">{i.group}</p>
                        <p className="text-xs text-neutral-400">
                          {i.sku} · {i.size} · {formatTenge(i.unitPrice)}
                        </p>
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={i.qty}
                        onChange={(e) => updateQty(i.productId, Number(e.target.value) || 0)}
                        className="w-16 shrink-0 rounded-lg border border-neutral-300 px-2 py-1.5 text-center text-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                      />
                      <span className="w-24 shrink-0 text-right text-sm font-medium text-neutral-900">
                        {formatTenge(i.unitPrice * i.qty)}
                      </span>
                      <button
                        onClick={() => removeItem(i.productId)}
                        className="shrink-0 text-neutral-400 hover:text-red-600"
                        aria-label="Убрать"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="space-y-3 border-t border-neutral-100 px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Итого</span>
                  <span className="text-base font-semibold text-neutral-900">
                    {formatTenge(total)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportCartToExcel(items)}
                    className="w-full rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-800"
                  >
                    Скачать Excel
                  </button>
                  <button
                    onClick={clear}
                    className="shrink-0 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm text-neutral-600 transition hover:border-brand-300 hover:bg-brand-50"
                  >
                    Очистить
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
