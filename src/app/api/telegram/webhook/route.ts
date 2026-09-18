import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { answerCallbackQuery, markMessageDone, sendPlainMessage } from "@/lib/telegram";

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
  };
  callback_query?: {
    id: string;
    data?: string;
    message?: {
      chat: { id: number };
      message_id: number;
      text?: string;
    };
  };
}

export async function POST(request: Request) {
  const update = (await request.json().catch(() => null)) as TelegramUpdate | null;
  if (!update) return NextResponse.json({ ok: true });

  const supabase = createServiceRoleClient();

  if (update.callback_query) {
    const cb = update.callback_query;
    const data = cb.data ?? "";

    if (data.startsWith("done:") && cb.message) {
      const taskId = data.slice("done:".length);
      const { error } = await supabase.from("tasks").update({ status: "done" }).eq("id", taskId);

      await answerCallbackQuery(cb.id, error ? "Не удалось отметить" : "Отмечено как сделано!");

      if (!error) {
        await markMessageDone(
          String(cb.message.chat.id),
          cb.message.message_id,
          cb.message.text ?? ""
        );
      }
    } else {
      await answerCallbackQuery(cb.id, "");
    }

    return NextResponse.json({ ok: true });
  }

  if (update.message?.text) {
    const chatId = String(update.message.chat.id);
    const text = update.message.text.trim();

    if (text.startsWith("/start")) {
      await sendPlainMessage(
        chatId,
        "Привет! Напишите сюда своё имя точно так, как оно указано в приложении (раздел «Сотрудники»), и я подключу уведомления о задачах."
      );
      return NextResponse.json({ ok: true });
    }

    const { data: already } = await supabase
      .from("team_members")
      .select("id, name")
      .eq("telegram_chat_id", chatId)
      .maybeSingle();

    if (already) {
      await sendPlainMessage(chatId, `Вы уже подключены как ${already.name}.`);
      return NextResponse.json({ ok: true });
    }

    const { data: match } = await supabase
      .from("team_members")
      .select("id, name")
      .is("telegram_chat_id", null)
      .ilike("name", text)
      .maybeSingle();

    if (match) {
      await supabase.from("team_members").update({ telegram_chat_id: chatId }).eq("id", match.id);
      await sendPlainMessage(
        chatId,
        `Готово, ${match.name}! Теперь сюда будут приходить ваши задачи.`
      );
    } else {
      await sendPlainMessage(
        chatId,
        `Не нашёл сотрудника с именем «${text}». Попросите добавить это имя в приложении (раздел «Сотрудники»), затем напишите его сюда ещё раз.`
      );
    }
  }

  return NextResponse.json({ ok: true });
}
