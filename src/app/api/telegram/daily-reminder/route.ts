import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { sendTaskNotification } from "@/lib/telegram";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("id, title, deadline, priority, last_reminded_on, assignee_id, team_members(telegram_chat_id)")
    .neq("status", "done")
    .not("assignee_id", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;

  for (const task of tasks ?? []) {
    const chatId = (task.team_members as unknown as { telegram_chat_id: string | null } | null)
      ?.telegram_chat_id;

    if (!chatId || task.last_reminded_on === today) {
      skipped++;
      continue;
    }

    try {
      await sendTaskNotification({
        taskId: task.id,
        chatId,
        title: task.title,
        deadline: task.deadline,
        priority: task.priority,
        reminder: true,
      });
      await supabase.from("tasks").update({ last_reminded_on: today }).eq("id", task.id);
      sent++;
    } catch (err) {
      console.error("Reminder failed for task", task.id, err);
    }
  }

  return NextResponse.json({ sent, skipped, total: tasks?.length ?? 0 });
}
