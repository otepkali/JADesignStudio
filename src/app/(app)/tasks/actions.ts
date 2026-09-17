"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { taskSchema, type TaskFormValues } from "@/lib/schemas";
import type { Task } from "@/types/database";

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

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title: v.title,
      assignee: v.assignee || null,
      deadline: v.deadline || null,
      status: v.status,
      note: v.note || null,
    })
    .select()
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Не удалось создать задачу" };
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
  const { data, error } = await supabase
    .from("tasks")
    .update({
      title: v.title,
      assignee: v.assignee || null,
      deadline: v.deadline || null,
      status: v.status,
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
