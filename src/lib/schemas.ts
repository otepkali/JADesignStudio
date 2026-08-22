import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(1, "Укажите название объекта"),
  total_amount: z.coerce.number().positive("Сумма должна быть больше нуля"),
  deadline: z.string().optional().or(z.literal("")),
  prepayment_percent: z.coerce.number().min(0).max(100),
});

export type ProjectFormValues = z.output<typeof projectSchema>;
export type ProjectFormInput = z.input<typeof projectSchema>;

export const projectUpdateSchema = projectSchema.extend({
  status: z.enum(["in_progress", "completed"]),
});

export type ProjectUpdateFormValues = z.output<typeof projectUpdateSchema>;
export type ProjectUpdateFormInput = z.input<typeof projectUpdateSchema>;

export const paymentSchema = z.object({
  amount: z.coerce.number().positive("Сумма должна быть больше нуля"),
  payment_type: z.enum(["prepayment", "additional", "final"]),
  paid_at: z.string().min(1),
  note: z.string().optional().or(z.literal("")),
});

export type PaymentFormValues = z.output<typeof paymentSchema>;
export type PaymentFormInput = z.input<typeof paymentSchema>;

export const expenseSchema = z
  .object({
    category_id: z.string().min(1, "Выберите статью расходов"),
    subcategory_id: z.string().optional().or(z.literal("")),
    material_name: z.string().min(1, "Укажите название материала"),
    quantity: z.coerce.number().optional().nullable(),
    unit: z.string().optional().or(z.literal("")),
    entry_mode: z.enum(["unit_price", "total"]),
    unit_price: z.coerce.number().optional().nullable(),
    total_price: z.coerce.number().optional().nullable(),
    expense_date: z.string().min(1),
    note: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) =>
      data.entry_mode === "total"
        ? typeof data.total_price === "number" && data.total_price > 0
        : typeof data.unit_price === "number" && data.unit_price > 0,
    {
      message: "Укажите сумму",
      path: ["total_price"],
    }
  );

export type ExpenseFormValues = z.output<typeof expenseSchema>;
export type ExpenseFormInput = z.input<typeof expenseSchema>;

export const budgetLinesSchema = z.object({
  lines: z.array(
    z.object({
      category_id: z.string().min(1),
      planned_amount: z.coerce.number().min(0),
    })
  ),
});

export type BudgetLinesFormValues = z.output<typeof budgetLinesSchema>;
export type BudgetLinesFormInput = z.input<typeof budgetLinesSchema>;
