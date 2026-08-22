import "server-only";
import { createClient } from "@/lib/supabase/server";
import { calculateProjectTotals, type ProjectTotals } from "@/lib/calculations";
import type {
  Project,
  ExpenseWithCategory,
  Payment,
  ExpenseCategory,
  ExpenseSubcategory,
  ProjectBudgetLine,
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

export async function getProjectDetail(id: string): Promise<ProjectDetail | null> {
  const supabase = await createClient();

  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single();
  if (!project) return null;

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
  const { data } = await supabase.from("expense_categories").select("*").order("name");
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
  let query = supabase.from("expenses").select("*, expense_categories(*), expense_subcategories(*)");

  if (filters.projectId) query = query.eq("project_id", filters.projectId);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.from) query = query.gte("expense_date", filters.from);
  if (filters.to) query = query.lte("expense_date", filters.to);

  const { data } = await query.order("expense_date", { ascending: false });
  return (data ?? []) as unknown as ExpenseWithCategory[];
}
