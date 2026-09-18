"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendTaskNotification } from "@/lib/telegram";
import { taskSchema, type TaskFormValues } from "@/lib/schemas";
import type { Task } from "@/types/database";

async function resolveAssignee(
  supabase: Awaited<ReturnType<typeof createClient>>,
  assigneeId: string | undefined
): Promise<{ assignee: string | null; assignee_id: string | null; chatId: string | null }> {
  if (!assigneeId) return { assignee: null, assignee_id: null, chatId: null };

  const { data: member } = await supabase
    .from("team_members")
    .select("id, name, telegram_chat_id")
    .eq("id", assigneeId)
    .single();

  if (!member) return { assignee: null, assignee_id: null, chatId: null };

  return { assignee: member.name, assignee_id: member.id, chatId: member.telegram_chat_id };
}

async function notifyAssignee(task: Task, chatId: string | null) {
  if (!chatId) return;
  try {
    await sendTaskNotification({
      taskId: task.id,
      chatId,
      title: task.title,
      deadline: task.deadline,
      priority: task.priority,
    });
  } catch (err) {
    console.error("Telegram notify failed", err);
  }
}

export async function addTask(
  values: TaskFormValues
): Promise<{ error: string } | { task: Task }> {
  const parsed = taskSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Неверные данные" };
  }
  const v = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Не авторизовано" };

  const { assignee, assignee_id, chatId } = await resolveAssignee(supabase, v.assignee_id);

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title: v.title,
      assignee,
      assignee_id,
      deadline: v.deadline || null,
      status: v.status,
      priority: v.priority,
      note: v.note || null,
    })
    .select()
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Не удалось создать задачу" };
  }

  if (v.status !== "done") {
    await notifyAssignee(data, chatId);
  }

  revalidatePath("/tasks");
  return { task: data };
}

export async function updateTask(
  taskId: string,
  values: TaskFormValues
): Promise<{ error: string } | { task: Task }> {
  const parsed = taskSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Неверные данные" };
  }
  const v = parsed.data;

  const supabase = await createClient();
  const { assignee, assignee_id } = await resolveAssignee(supabase, v.assignee_id);

  const { data, error } = await supabase
    .from("tasks")
    .update({
      title: v.title,
      assignee,
      assignee_id,
      deadline: v.deadline || null,
      status: v.status,
      priority: v.priority,
      note: v.note || null,
    })
    .eq("id", taskId)
    .select()
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Не удалось обновить задачу" };
  }

  revalidatePath("/tasks");
  return { task: data };
}

export async function setTaskStatus(
  taskId: string,
  status: Task["status"]
): Promise<{ error: string } | { task: Task }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId)
    .select()
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Не удалось обновить статус" };
  }

  revalidatePath("/tasks");
  return { task: data };
}

export async function deleteTask(taskId: string): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/tasks");
  return { success: true };
}
