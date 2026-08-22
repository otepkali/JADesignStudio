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

  const body = await request.json().catch(() => ({}));
  const { projectId } = body as { projectId?: string };

  let query = supabase
    .from("expenses")
    .select("*, projects(name), expense_categories(name)")
    .eq("synced_to_sheets", false);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data: expenses, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let synced = 0;
  let failed = 0;

  for (const expense of expenses ?? []) {
    try {
      await appendExpenseRow({
        date: expense.expense_date,
        projectName: (expense.projects as unknown as { name: string } | null)?.name ?? "",
        categoryName:
          (expense.expense_categories as unknown as { name: string } | null)?.name ?? "",
        materialName: expense.material_name,
        quantity: expense.quantity,
        unit: expense.unit,
        unitPrice: expense.unit_price,
        totalPrice: expense.total_price,
        note: expense.note,
      });
      await supabase.from("expenses").update({ synced_to_sheets: true }).eq("id", expense.id);
      synced += 1;
    } catch (err) {
      console.error("Resync failed for expense", expense.id, err);
      failed += 1;
    }
  }

  return NextResponse.json({ synced, failed, total: expenses?.length ?? 0 });
}
