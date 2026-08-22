export type ProjectStatus = "in_progress" | "completed";
export type PaymentType = "prepayment" | "additional" | "final";

export interface Project {
  id: string;
  user_id: string | null;
  name: string;
  total_amount: number;
  deadline: string | null;
  prepayment_percent: number;
  status: ProjectStatus;
  created_at: string;
}

export interface Payment {
  id: string;
  project_id: string;
  amount: number;
  payment_type: PaymentType;
  paid_at: string;
  note: string | null;
  created_at: string;
}

export interface ExpenseCategory {
  id: string;
  user_id: string | null;
  name: string;
}

export interface ExpenseSubcategory {
  id: string;
  category_id: string;
  name: string;
}

export interface Expense {
  id: string;
  project_id: string;
  category_id: string | null;
  subcategory_id: string | null;
  material_name: string;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  total_price: number;
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
