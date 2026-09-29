import { getProducts } from "@/lib/data";
import { ShopWorkspace } from "@/components/shop/ShopWorkspace";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const products = await getProducts();
  return <ShopWorkspace initialProducts={products} />;
}
