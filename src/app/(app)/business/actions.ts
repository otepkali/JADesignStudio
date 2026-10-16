"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { bonusIncomeSchema, type BonusIncomeFormValues } from "@/lib/schemas";
import type { BonusIncome } from "@/lib/data";

export async function addBonusIncome(
  values: BonusIncomeFormValues
): Promise<{ error: string } | { bonus: BonusIncome }> {
  const parsed = bonusIncomeSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Неверные данные" };
  }
  const v = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bonus_incomes")
    .insert({
      title: v.title,
      amount: v.amount,
      account: v.account,
      income_date: v.income_date,
      note: v.note || null,
    })
    .select("id, title, amount, account, income_date")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Не удалось сохранить бонус" };
  }

  revalidatePath("/business");
  revalidatePath("/dashboard");

  return {
    bonus: {
      id: data.id,
      source: "manual",
      title: data.title,
      amount: Number(data.amount),
      percent: null,
      account: data.account,
      date: data.income_date,
      projectName: null,
    },
  };
}

export async function deleteBonusIncome(id: string): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const { error } = await supabase.from("bonus_incomes").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/business");
  revalidatePath("/dashboard");
  return { success: true };
}
