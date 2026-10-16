import { getAdminExpenseDetail, getBusinessBalance, getManualBonusIncome, getProjectBonusIncome } from "@/lib/data";
import { BusinessWorkspace } from "@/components/business/BusinessWorkspace";

export const dynamic = "force-dynamic";

export default async function BusinessPage() {
  const [balance, adminExpenses, projectBonuses, manualBonuses] = await Promise.all([
    getBusinessBalance(),
    getAdminExpenseDetail(),
    getProjectBonusIncome(),
    getManualBonusIncome(),
  ]);

  return (
    <BusinessWorkspace
      initialBalance={balance}
      initialCategories={adminExpenses.categories}
      initialExpenses={adminExpenses.expenses}
      projectBonuses={projectBonuses}
      initialManualBonuses={manualBonuses}
    />
  );
}
