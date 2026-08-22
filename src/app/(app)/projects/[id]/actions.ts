"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { appendExpenseRow } from "@/lib/googleSheets";
import { expenseSchema, paymentSchema, type ExpenseFormValues, type PaymentFormValues } from "@/lib/schemas";
import type { ExpenseCategory, ExpenseWithCategory, Payment } from "@/types/database";

export async function addPayment(
  projectId: string,
  values: PaymentFormValues
): Promise<{ error: string } | { payment: Payment }> {
  const parsed = paymentSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Неверные данные" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .insert({
      project_id: projectId,
      amount: parsed.data.amount,
      payment_type: parsed.data.payment_type,
      paid_at: parsed.data.paid_at,
      note: parsed.data.note || null,
    })
    .select()
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Не удалось сохранить оплату" };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
  return { payment: data };
}

function resolveTotalPrice(values: ExpenseFormValues): number {
  if (values.entry_mode === "total") {
    return Number(values.total_price);
  }
  return Number(values.unit_price) * Number(values.quantity ?? 1);
}

async function syncExpenseToSheets(supabase: Awaited<ReturnType<typeof createClient>>, expenseId: string) {
  const { data: expense } = await supabase
    .from("expenses")
    .select("*, projects(name), expense_categories(name)")
    .eq("id", expenseId)
    .single();

  if (!expense) return false;

  try {
    await appendExpenseRow({
      date: expense.expense_date,
      projectName: (expense.projects as unknown as { name: string } | null)?.name ?? "",
      categoryName: (expense.expense_categories as unknown as { name: string } | null)?.name ?? "",
      materialName: expense.material_name,
      quantity: expense.quantity,
      unit: expense.unit,
      unitPrice: expense.unit_price,
      totalPrice: expense.total_price,
      note: expense.note,
    });
    await supabase.from("expenses").update({ synced_to_sheets: true }).eq("id", expenseId);
    return true;
  } catch (err) {
    console.error("Google Sheets sync failed", err);
    return false;
  }
}

export async function addExpense(
  projectId: string,
  values: ExpenseFormValues
): Promise<{ error: string } | { expense: ExpenseWithCategory; syncFailed: boolean }> {
  const parsed = expenseSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Неверные данные" };
  }
  const v = parsed.data;
  const totalPrice = resolveTotalPrice(v);

  const supabase = await createClient();
  const { data: inserted, error } = await supabase
    .from("expenses")
    .insert({
      project_id: projectId,
      category_id: v.category_id,
      material_name: v.material_name,
      quantity: v.quantity ?? null,
      unit: v.unit || null,
      unit_price: v.entry_mode === "unit_price" ? v.unit_price ?? null : null,
      total_price: totalPrice,
      expense_date: v.expense_date,
      note: v.note || null,
    })
    .select("*, expense_categories(*)")
    .single();

  if (error || !inserted) {
    return { error: error?.message ?? "Не удалось сохранить расход" };
  }

  const synced = await syncExpenseToSheets(supabase, inserted.id);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
  revalidatePath("/analytics");

  return {
    expense: { ...inserted, synced_to_sheets: synced } as unknown as ExpenseWithCategory,
    syncFailed: !synced,
  };
}

export async function updateExpense(
  expenseId: string,
  projectId: string,
  values: ExpenseFormValues
): Promise<{ error: string } | { expense: ExpenseWithCategory; syncFailed: boolean }> {
  const parsed = expenseSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Неверные данные" };
  }
  const v = parsed.data;
  const totalPrice = resolveTotalPrice(v);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .update({
      category_id: v.category_id,
      material_name: v.material_name,
      quantity: v.quantity ?? null,
      unit: v.unit || null,
      unit_price: v.entry_mode === "unit_price" ? v.unit_price ?? null : null,
      total_price: totalPrice,
      expense_date: v.expense_date,
      note: v.note || null,
      synced_to_sheets: false,
    })
    .eq("id", expenseId)
    .select("*, expense_categories(*)")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Не удалось обновить расход" };
  }

  const synced = await syncExpenseToSheets(supabase, expenseId);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
  revalidatePath("/analytics");

  return {
    expense: { ...data, synced_to_sheets: synced } as unknown as ExpenseWithCategory,
    syncFailed: !synced,
  };
}

export async function deleteExpense(
  expenseId: string,
  projectId: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
  revalidatePath("/analytics");
  return { success: true };
}

export async function resyncExpense(
  expenseId: string,
  projectId: string
): Promise<{ synced: boolean }> {
  const supabase = await createClient();
  const synced = await syncExpenseToSheets(supabase, expenseId);
  revalidatePath(`/projects/${projectId}`);
  return { synced };
}

export async function addCategory(
  name: string
): Promise<{ error: string } | { category: ExpenseCategory }> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Введите название категории" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизовано" };

  const { data, error } = await supabase
    .from("expense_categories")
    .insert({ user_id: user.id, name: trimmed })
    .select()
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Не удалось создать категорию" };
  }

  return { category: data };
}
