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
        "Привет! Напишите сюда своё имя — я подключу уведомления о задачах на это имя."
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
      return NextResponse.json({ ok: true });
    }

    // No existing (unlinked) team member with this name — register them
    // automatically instead of requiring an admin to add them first.
    const { data: created, error: createError } = await supabase
      .from("team_members")
      .insert({ name: text, telegram_chat_id: chatId })
      .select("id, name")
      .single();

    if (createError || !created) {
      await sendPlainMessage(
        chatId,
        `Не удалось подключить как «${text}» — похоже, это имя уже занято. Напишите имя с фамилией.`
      );
    } else {
      await sendPlainMessage(
        chatId,
        `Добро пожаловать, ${created.name}! Вы добавлены в сотрудники, теперь будете получать задачи и напоминания сюда.`
      );
    }
  }

  return NextResponse.json({ ok: true });
}
