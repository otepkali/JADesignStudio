import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { appendExpenseRow } from "@/lib/googleSheets";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { expenseId } = body;

  if (!expenseId) {
    return NextResponse.json({ error: "expenseId is required" }, { status: 400 });
  }

  const { data: expense, error } = await supabase
    .from("expenses")
    .select("*, projects(name), expense_categories(name), expense_subcategories(name)")
    .eq("id", expenseId)
    .single();

  if (error || !expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  try {
    await appendExpenseRow({
      date: expense.expense_date,
      projectName:
        (expense.projects as unknown as { name: string } | null)?.name ??
        "Административные расходы",
      categoryName:
        (expense.expense_categories as unknown as { name: string } | null)?.name ?? "",
      subcategoryName:
        (expense.expense_subcategories as unknown as { name: string } | null)?.name ?? "",
      materialName: expense.material_name,
      quantity: expense.quantity,
      unit: expense.unit,
      unitPrice: expense.unit_price,
      totalPrice: expense.total_price,
      note: expense.note,
      account: expense.account,
      bonusAmount: expense.bonus_amount,
    });

    await supabase.from("expenses").update({ synced_to_sheets: true }).eq("id", expenseId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Google Sheets sync failed", err);
    return NextResponse.json(
      { success: false, error: "Sheets sync failed" },
      { status: 502 }
    );
  }
}
