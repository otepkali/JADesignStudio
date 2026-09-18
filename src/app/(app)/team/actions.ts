"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { teamMemberSchema, type TeamMemberFormValues } from "@/lib/schemas";
import type { TeamMember } from "@/types/database";

export async function addTeamMember(
  values: TeamMemberFormValues
): Promise<{ error: string } | { member: TeamMember }> {
  const parsed = teamMemberSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Неверные данные" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_members")
    .insert({ name: parsed.data.name.trim() })
    .select()
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Не удалось добавить сотрудника" };
  }

  revalidatePath("/team");
  return { member: data };
}

export async function deleteTeamMember(
  memberId: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const { error } = await supabase.from("team_members").delete().eq("id", memberId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/team");
  revalidatePath("/tasks");
  return { success: true };
}
