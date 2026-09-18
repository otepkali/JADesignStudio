function apiUrl(method: string): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  return `https://api.telegram.org/bot${token}/${method}`;
}

export interface TaskNotificationInput {
  taskId: string;
  chatId: string;
  title: string;
  deadline: string | null;
  priority: "low" | "medium" | "high";
  reminder?: boolean;
}

const PRIORITY_LABELS: Record<string, string> = {
  low: "Низкая",
  medium: "Средняя",
  high: "Высокая",
};

function formatDeadline(deadline: string | null): string {
  if (!deadline) return "не указан";
  return new Date(deadline).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export async function sendTaskNotification(input: TaskNotificationInput): Promise<void> {
  const heading = input.reminder ? "⏰ Напоминание о задаче" : "🆕 Новая задача";
  const text = [
    `${heading}`,
    "",
    input.title,
    `Срок: ${formatDeadline(input.deadline)}`,
    `Важность: ${PRIORITY_LABELS[input.priority] ?? input.priority}`,
  ].join("\n");

  const res = await fetch(apiUrl("sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: input.chatId,
      text,
      reply_markup: {
        inline_keyboard: [[{ text: "✅ Сделано", callback_data: `done:${input.taskId}` }]],
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Telegram sendMessage failed: ${res.status} ${body}`);
  }
}

export async function sendPlainMessage(chatId: string, text: string): Promise<void> {
  const res = await fetch(apiUrl("sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Telegram sendMessage failed: ${res.status} ${body}`);
  }
}

export async function answerCallbackQuery(callbackQueryId: string, text: string): Promise<void> {
  await fetch(apiUrl("answerCallbackQuery"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

export async function markMessageDone(chatId: string, messageId: number, originalText: string): Promise<void> {
  await fetch(apiUrl("editMessageText"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text: `${originalText}\n\n✅ Выполнено`,
    }),
  });
}

export async function setWebhook(url: string): Promise<unknown> {
  const res = await fetch(apiUrl("setWebhook"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  return res.json();
}
