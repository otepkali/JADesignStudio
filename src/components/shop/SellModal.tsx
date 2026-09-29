"use client";

import { SellForm } from "@/components/shop/SellForm";
import type { SaleFormValues } from "@/lib/schemas";
import type { Product } from "@/types/database";

export function SellModal({
  product,
  onClose,
  onSubmit,
}: {
  product: Product | null;
  onClose: () => void;
  onSubmit: (productId: string, values: SaleFormValues) => Promise<{ error?: string }>;
}) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">Продать</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            ×
          </button>
        </div>
        <SellForm
          product={product}
          onCancel={onClose}
          onSubmit={(values) => onSubmit(product.id, values)}
        />
      </div>
    </div>
  );
}
