"use server";

import { createClient } from "@/lib/supabase/server";
import { projectSchema, type ProjectFormValues } from "@/lib/schemas";
import { slugify } from "@/lib/slug";

async function generateUniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  name: string
): Promise<string> {
  const base = slugify(name) || "proekt";

  const { data: existing } = await supabase
    .from("projects")
    .select("slug")
    .like("slug", `${base}%`);

  const taken = new Set((existing ?? []).map((r) => r.slug));
  if (!taken.has(base)) return base;

  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export async function createProject(
  values: ProjectFormValues
): Promise<{ id: string; slug: string } | { error: string }> {
  const parsed = projectSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Неверные данные" };
  }
  const { name, total_amount, deadline, prepayment_percent, project_type } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Не авторизовано" };
  }

  const slug = await generateUniqueSlug(supabase, name);

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name,
      slug,
      project_type,
      total_amount,
      deadline: deadline || null,
      prepayment_percent,
    })
    .select()
    .single();

  if (error || !project) {
    return { error: error?.message ?? "Не удалось создать проект" };
  }

  const prepaymentAmount = (total_amount * prepayment_percent) / 100;

  const { error: paymentError } = await supabase.from("payments").insert({
    project_id: project.id,
    amount: prepaymentAmount,
    payment_type: "prepayment",
    note: "Предоплата при создании проекта",
  });

  if (paymentError) {
    return { error: paymentError.message };
  }

  return { id: project.id, slug: project.slug };
}
