import { notFound } from "next/navigation";
import { getProjectDetail } from "@/lib/data";
import { ProjectWorkspace } from "@/components/project/ProjectWorkspace";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getProjectDetail(id);

  if (!detail) notFound();

  return (
    <ProjectWorkspace
      project={detail.project}
      initialPayments={detail.payments}
      initialExpenses={detail.expenses}
      initialCategories={detail.categories}
      initialSubcategories={detail.subcategories}
      initialBudgetLines={detail.budgetLines}
    />
  );
}
