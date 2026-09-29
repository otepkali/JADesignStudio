import { getSales, summarizeSales } from "@/lib/data";
import { SalesReport } from "@/components/shop/SalesReport";

export const dynamic = "force-dynamic";

export default async function ShopSalesPage() {
  const sales = await getSales();
  const summary = summarizeSales(sales);
  return <SalesReport sales={sales} summary={summary} />;
}
