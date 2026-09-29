"use client";

import { useState } from "react";
import Image from "next/image";
import { formatTenge } from "@/lib/format";
import type { ProductGroup } from "@/lib/shop";

export function CatalogProductCard({ group }: { group: ProductGroup }) {
  const [selectedId, setSelectedId] = useState(group.items[0].id);
  const [open, setOpen] = useState(false);
  const selected = group.items.find((p) => p.id === selectedId) ?? group.items[0];
  const hasSizes = group.items.length > 1;

  return (
    <>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative block aspect-square w-full bg-neutral-100"
        >
          <Image src={`/products/${group.image}`} alt={group.key} fill className="object-cover" />
        </button>
        <div className="p-3">
          <p className="text-sm font-medium text-neutral-900">{group.key}</p>
          <p className="mt-0.5 text-xs text-neutral-400">
            {selected.sku} · {selected.size}
          </p>

          {hasSizes && (
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="mt-2 w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-xs transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              {group.items.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.size}
                </option>
              ))}
            </select>
          )}

          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-brand-700">
              {formatTenge(selected.list_price_kzt)}
            </span>
            {selected.available_on_order ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                Под заказ
              </span>
            ) : (
              <span className="text-xs text-neutral-400">{selected.stock_qty} шт.</span>
            )}
          </div>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-20 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
              <h2 className="text-base font-semibold text-neutral-900">{group.key}</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="relative aspect-square bg-neutral-100">
                <Image
                  src={`/products/${group.image}`}
                  alt={group.key}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <p className="text-xs text-neutral-400">Артикул</p>
                  <p className="text-sm text-neutral-900">{selected.sku}</p>
                </div>

                {hasSizes ? (
                  <div>
                    <p className="mb-1 text-xs text-neutral-400">Размер</p>
                    <select
                      value={selectedId}
                      onChange={(e) => setSelectedId(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    >
                      {group.items.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.size}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-neutral-400">Размер</p>
                    <p className="text-sm text-neutral-900">{selected.size}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-neutral-400">Цена</p>
                  <p className="text-lg font-semibold text-brand-700">
                    {formatTenge(selected.list_price_kzt)}
                  </p>
                </div>

                <div>
                  {selected.available_on_order ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      Под заказ
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      В наличии · {selected.stock_qty} шт.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
