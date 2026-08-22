export type ProjectStatus = "in_progress" | "completed";
export type PaymentType = "prepayment" | "additional" | "final" | "opening_balance";
export type ProjectType = "turnkey" | "design";
// Scope of an expense category: 'turnkey'/'design' tie it to that project
// type, 'admin' is for business/overhead expenses not tied to any project.
export type CategoryScope = "turnkey" | "design" | "admin";
export type AccountId = "cash" | "ip_account" | "personal_account";

export interface Project {
  id: string;
  user_id: string | null;
  name: string;
  slug: string | null;
  project_type: ProjectType;
  total_amount: number;
  deadline: string | null;
  prepayment_percent: number;
  status: ProjectStatus;
  created_at: string;
}

export interface Account {
  id: AccountId;
  name: string;
}

export interface Payment {
  id: string;
  project_id: string | null;
  amount: number;
  payment_type: PaymentType;
  account: AccountId | null;
  paid_at: string;
  note: string | null;
  created_at: string;
}

export interface ExpenseCategory {
  id: string;
  user_id: string | null;
  name: string;
  project_type: CategoryScope;
}

export interface ExpenseSubcategory {
  id: string;
  category_id: string;
  name: string;
}

export interface Expense {
  id: string;
  project_id: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  material_name: string;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  total_price: number;
  account: AccountId | null;
  bonus_percent: number | null;
  bonus_amount: number | null;
  expense_date: string;
  note: string | null;
  synced_to_sheets: boolean;
  created_at: string;
}

export interface ExpenseWithCategory extends Expense {
  expense_categories: ExpenseCategory | null;
  expense_subcategories: ExpenseSubcategory | null;
}

export interface ProjectBudgetLine {
  id: string;
  project_id: string;
  category_id: string;
  planned_amount: number;
  created_at: string;
}

export interface ProjectBudgetLineWithCategory extends ProjectBudgetLine {
  expense_categories: ExpenseCategory | null;
}
