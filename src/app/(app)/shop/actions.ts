"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calculateSale } from "@/lib/shop";
import { saleSchema, type SaleFormValues } from "@/lib/schemas";
import type { Product } from "@/types/database";

export async function recordSale(
  productId: string,
  values: SaleFormValues
): Promise<{ error: string } | { success: true }> {
  const parsed = saleSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Неверные данные" };
  }
  const v = parsed.data;

  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single<Product>();

  if (!product) return { error: "Товар не найден" };

  if (!product.available_on_order && v.quantity > product.stock_qty) {
    return { error: `На складе осталось только ${product.stock_qty} шт.` };
  }

  const { actualMarginKzt, marginDiffKzt } = calculateSale(
    v.unit_price_kzt,
    product.cost_price_kzt,
    product.margin_amount_kzt,
    product.margin_percent
  );

  const { error: saleError } = await supabase.from("sales").insert({
    product_id: product.id,
    quantity: v.quantity,
    unit_price_kzt: v.unit_price_kzt,
    cost_price_kzt: product.cost_price_kzt,
    full_margin_amount_kzt: product.margin_amount_kzt,
    actual_margin_kzt: actualMarginKzt,
    margin_diff_kzt: marginDiffKzt,
    sold_at: v.sold_at,
  });

  if (saleError) {
    return { error: saleError.message };
  }

  if (!product.available_on_order) {
    const { error: stockError } = await supabase
      .from("products")
      .update({ stock_qty: product.stock_qty - v.quantity })
      .eq("id", product.id);

    if (stockError) {
      return { error: stockError.message };
    }
  }

  revalidatePath("/shop");
  revalidatePath("/shop/sales");
  revalidatePath("/catalog");
  return { success: true };
}
