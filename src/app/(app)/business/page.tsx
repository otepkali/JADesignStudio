import { getAdminExpenseDetail, getBusinessBalance, getOpeningBalances } from "@/lib/data";
import { BusinessWorkspace } from "@/components/business/BusinessWorkspace";

export const dynamic = "force-dynamic";

export default async function BusinessPage() {
  const [balance, adminExpenses, openingBalances] = await Promise.all([
    getBusinessBalance(),
    getAdminExpenseDetail(),
    getOpeningBalances(),
  ]);

  return (
    <BusinessWorkspace
      initialBalance={balance}
      initialCategories={adminExpenses.categories}
      initialExpenses={adminExpenses.expenses}
      initialOpeningBalances={openingBalances}
    />
  );
}
