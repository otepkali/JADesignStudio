import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { sendPlainMessage } from "@/lib/telegram";
import { formatTenge } from "@/lib/format";

interface OrderItem {
  sku: string;
  group: string;
  size: string;
  unitPrice: number;
  qty: number;
}

interface OrderPayload {
  items: OrderItem[];
  customerName: string;
  customerPhone: string;
}

// The two people who should get a Telegram order request — matched by name
// against team_members, which already has their chat IDs linked via the bot.
const RECIPIENT_NAME_PATTERNS = ["Арман", "Жанерке"];

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as OrderPayload | null;

  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Пустая корзина" }, { status: 400 });
  }
  if (!body.customerName?.trim() || !body.customerPhone?.trim()) {
    return NextResponse.json({ error: "Укажите имя и телефон" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: members } = await supabase
    .from("team_members")
    .select("name, telegram_chat_id")
    .not("telegram_chat_id", "is", null);

  const recipients = (members ?? []).filter((m) =>
    RECIPIENT_NAME_PATTERNS.some((pattern) => m.name.includes(pattern))
  );

  if (recipients.length === 0) {
    return NextResponse.json({ error: "Получатели заявки не настроены" }, { status: 500 });
  }

  const total = body.items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
  const lines = body.items.map(
    (i) =>
      `• ${i.group} (${i.sku}, ${i.size}) — ${i.qty} шт. × ${formatTenge(i.unitPrice)} = ${formatTenge(
        i.unitPrice * i.qty
      )}`
  );

  const text = [
    "🛒 Новая заявка с сайта",
    "",
    `Имя: ${body.customerName.trim()}`,
    `Телефон: ${body.customerPhone.trim()}`,
    "",
    ...lines,
    "",
    `Итого: ${formatTenge(total)}`,
  ].join("\n");

  const results = await Promise.allSettled(
    recipients.map((r) => sendPlainMessage(r.telegram_chat_id!, text))
  );
  const sent = results.filter((r) => r.status === "fulfilled").length;

  if (sent === 0) {
    return NextResponse.json({ error: "Не удалось отправить заявку" }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
