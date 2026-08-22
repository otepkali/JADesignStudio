import { getAdminExpenseDetail, getBusinessBalance } from "@/lib/data";
import { BusinessWorkspace } from "@/components/business/BusinessWorkspace";

export const dynamic = "force-dynamic";

export default async function BusinessPage() {
  const [balance, adminExpenses] = await Promise.all([
    getBusinessBalance(),
    getAdminExpenseDetail(),
  ]);

  return (
    <BusinessWorkspace
      initialBalance={balance}
      initialCategories={adminExpenses.categories}
      initialExpenses={adminExpenses.expenses}
    />
  );
}
