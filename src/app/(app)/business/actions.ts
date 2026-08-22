"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AccountId } from "@/types/database";

export async function setOpeningBalance(
  account: AccountId,
  amount: number
): Promise<{ error: string } | { success: true }> {
  if (!Number.isFinite(amount) || amount < 0) {
    return { error: "Некорректная сумма" };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("payments")
    .select("id")
    .eq("payment_type", "opening_balance")
    .eq("account", account)
    .is("project_id", null)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("payments").update({ amount }).eq("id", existing.id)
    : await supabase.from("payments").insert({
        project_id: null,
        amount,
        payment_type: "opening_balance",
        account,
        paid_at: new Date().toISOString().slice(0, 10),
        note: "Начальный остаток",
      });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/business");
  return { success: true };
}
