import "server-only";
import { createClient } from "@/lib/supabase/server";
import { calculateProjectTotals, type ProjectTotals } from "@/lib/calculations";
import { UUID_RE } from "@/lib/slug";
import { ACCOUNTS } from "@/lib/accounts";
import type {
  Project,
  ExpenseWithCategory,
  Payment,
  ExpenseCategory,
  ExpenseSubcategory,
  ProjectBudgetLine,
  AccountId,
} from "@/types/database";

export interface ProjectWithTotals {
  project: Project;
  totals: ProjectTotals;
}

export async function getProjectsWithTotals(): Promise<ProjectWithTotals[]> {
  const supabase = await createClient();

  const { data: projectsData, error: projectsError } = await supabase
    .from("projects")
    .select("*");

  if (projectsError || !projectsData) return [];
  if (projectsData.length === 0) return [];

  const projects = [...projectsData].sort((a, b) => {
    if (a.status !== b.status) return a.status === "in_progress" ? -1 : 1;
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return a.deadline.localeCompare(b.deadline);
  });

  const projectIds = projects.map((p) => p.id);

  const [{ data: payments }, { data: expenses }] = await Promise.all([
    supabase.from("payments").select("project_id, amount").in("project_id", projectIds),
    supabase.from("expenses").select("project_id, total_price").in("project_id", projectIds),
  ]);

  return projects.map((project) => {
    const projectPayments = (payments ?? []).filter((p) => p.project_id === project.id);
    const projectExpenses = (expenses ?? []).filter((e) => e.project_id === project.id);
    return {
      project,
      totals: calculateProjectTotals(projectPayments, projectExpenses),
    };
  });
}

export interface DashboardSummary {
  activeCount: number;
  activeTotalAmount: number;
  currentMonthExpenses: number;
}

export async function getDashboardSummary(
  projectsWithTotals: ProjectWithTotals[]
): Promise<DashboardSummary> {
  const supabase = await createClient();

  const active = projectsWithTotals.filter((p) => p.project.status === "in_progress");
  const activeTotalAmount = active.reduce((sum, p) => sum + Number(p.project.total_amount), 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const { data: monthExpenses } = await supabase
    .from("expenses")
    .select("total_price")
    .not("project_id", "is", null)
    .gte("expense_date", monthStart);

  const currentMonthExpenses = (monthExpenses ?? []).reduce(
    (sum, e) => sum + Number(e.total_price),
    0
  );

  return {
    activeCount: active.length,
    activeTotalAmount,
    currentMonthExpenses,
  };
}

export interface ProjectDetail {
  project: Project;
  payments: Payment[];
  expenses: ExpenseWithCategory[];
  categories: ExpenseCategory[];
  subcategories: ExpenseSubcategory[];
  budgetLines: ProjectBudgetLine[];
  totals: ProjectTotals;
}

export async function getProjectDetail(idOrSlug: string): Promise<ProjectDetail | null> {
  const supabase = await createClient();

  const { data: project } = UUID_RE.test(idOrSlug)
    ? await supabase.from("projects").select("*").eq("id", idOrSlug).maybeSingle()
    : await supabase.from("projects").select("*").eq("slug", idOrSlug).maybeSingle();
  if (!project) return null;

  const id = project.id;

  const [
    { data: payments },
    { data: expenses },
    { data: categories },
    { data: subcategories },
    { data: budgetLines },
  ] = await Promise.all([
    supabase
      .from("payments")
      .select("*")
      .eq("project_id", id)
      .order("paid_at", { ascending: false }),
    supabase
      .from("expenses")
      .select("*, expense_categories(*), expense_subcategories(*)")
      .eq("project_id", id)
      .order("expense_date", { ascending: false }),
    supabase
      .from("expense_categories")
      .select("*")
      .eq("project_type", project.project_type)
      .order("name"),
    supabase.from("expense_subcategories").select("*").order("name"),
    supabase.from("project_budget_lines").select("*").eq("project_id", id),
  ]);

  return {
    project,
    payments: payments ?? [],
    expenses: (expenses ?? []) as unknown as ExpenseWithCategory[],
    categories: categories ?? [],
    subcategories: subcategories ?? [],
    budgetLines: budgetLines ?? [],
    totals: calculateProjectTotals(payments ?? [], expenses ?? []),
  };
}

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("expense_categories")
    .select("*")
    .neq("project_type", "admin")
    .order("name");
  return data ?? [];
}

export async function getAdminExpenseCategories(): Promise<ExpenseCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("expense_categories")
    .select("*")
    .eq("project_type", "admin")
    .order("name");
  return data ?? [];
}

export interface AnalyticsFilters {
  projectId?: string;
  categoryId?: string;
  from?: string;
  to?: string;
}

export async function getProjectsForFilter(): Promise<Pick<Project, "id" | "name">[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("id, name").order("name");
  return data ?? [];
}

export async function getFilteredExpenses(
  filters: AnalyticsFilters
): Promise<ExpenseWithCategory[]> {
  const supabase = await createClient();
  let query = supabase
    .from("expenses")
    .select("*, expense_categories(*), expense_subcategories(*)")
    .not("project_id", "is", null);

  if (filters.projectId) query = query.eq("project_id", filters.projectId);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.from) query = query.gte("expense_date", filters.from);
  if (filters.to) query = query.lte("expense_date", filters.to);

  const { data } = await query.order("expense_date", { ascending: false });
  return (data ?? []) as unknown as ExpenseWithCategory[];
}

export interface AdminExpenseDetail {
  categories: ExpenseCategory[];
  expenses: ExpenseWithCategory[];
}

export async function getAdminExpenseDetail(): Promise<AdminExpenseDetail> {
  const supabase = await createClient();

  const [{ data: categories }, { data: expenses }] = await Promise.all([
    supabase.from("expense_categories").select("*").eq("project_type", "admin").order("name"),
    supabase
      .from("expenses")
      .select("*, expense_categories(*), expense_subcategories(*)")
      .is("project_id", null)
      .order("expense_date", { ascending: false }),
  ]);

  return {
    categories: categories ?? [],
    expenses: (expenses ?? []) as unknown as ExpenseWithCategory[],
  };
}

export interface AccountBalance {
  account: AccountId;
  name: string;
  received: number;
  spent: number;
  bonuses: number;
  balance: number;
}

export interface BusinessBalance {
  totalReceived: number;
  totalSpent: number;
  totalBonuses: number;
  totalBalance: number;
  byAccount: AccountBalance[];
  unassigned: { received: number; spent: number; bonuses: number };
}

export async function getBusinessBalance(): Promise<BusinessBalance> {
  const supabase = await createClient();

  const [{ data: payments }, { data: expenses }] = await Promise.all([
    supabase.from("payments").select("amount, account"),
    supabase.from("expenses").select("total_price, account, bonus_amount"),
  ]);

  const buckets = new Map<AccountId, { received: number; spent: number; bonuses: number }>();
  for (const acc of ACCOUNTS) buckets.set(acc.id, { received: 0, spent: 0, bonuses: 0 });
  const unassigned = { received: 0, spent: 0, bonuses: 0 };

  for (const p of payments ?? []) {
    const bucket = p.account && buckets.has(p.account) ? buckets.get(p.account)! : unassigned;
    bucket.received += Number(p.amount);
  }
  for (const e of expenses ?? []) {
    const bucket = e.account && buckets.has(e.account) ? buckets.get(e.account)! : unassigned;
    bucket.spent += Number(e.total_price);
    if (e.bonus_amount) bucket.bonuses += Number(e.bonus_amount);
  }

  const byAccount: AccountBalance[] = ACCOUNTS.map((acc) => {
    const b = buckets.get(acc.id)!;
    return {
      account: acc.id,
      name: acc.name,
      received: b.received,
      spent: b.spent,
      bonuses: b.bonuses,
      balance: b.received - b.spent + b.bonuses,
    };
  });

  const totalReceived = byAccount.reduce((s, a) => s + a.received, 0) + unassigned.received;
  const totalSpent = byAccount.reduce((s, a) => s + a.spent, 0) + unassigned.spent;
  const totalBonuses = byAccount.reduce((s, a) => s + a.bonuses, 0) + unassigned.bonuses;

  return {
    totalReceived,
    totalSpent,
    totalBonuses,
    totalBalance: totalReceived - totalSpent + totalBonuses,
    byAccount,
    unassigned,
  };
}
