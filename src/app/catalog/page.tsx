import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/data";
import { groupProducts, type ProductGroup } from "@/lib/shop";
import { CatalogProductCard } from "@/components/shop/CatalogProductCard";
import { CartProvider } from "@/components/shop/CartContext";
import { CartDrawer } from "@/components/shop/CartDrawer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Каталог — JA Design Studio",
};

export default async function CatalogPage() {
  const products = await getProducts();
  const groups = groupProducts(products);
  const inStock = groups.filter((g) => g.category === "Ассортимент");
  const onOrder = groups.filter((g) => g.category === "Под заказ");

  return (
    <CartProvider>
      <div className="min-h-screen bg-neutral-50">
        <header className="border-b border-brand-100 bg-white/90 backdrop-blur">
          <div className="mx-auto max-w-5xl px-4 py-4">
            <Image
              src="/logo.png"
              alt="Janerke Abat Design"
              width={486}
              height={92}
              priority
              className="h-8 w-auto sm:h-9"
            />
          </div>
        </header>

        <main className="mx-auto max-w-5xl space-y-10 px-4 py-8 pb-24">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Магазин фурнитуры</h1>
              <p className="mt-1 text-sm text-neutral-500">
                Фурнитура для гардеробных: штанги, полки, корзины, ручки и двери.
              </p>
            </div>
            <Link
              href="/catalog/builder"
              className="shrink-0 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-800"
            >
              Собрать гардеробную в 3D →
            </Link>
          </div>

          <ProductSection title="Ассортимент" subtitle="В наличии" groups={inStock} />
          <ProductSection title="Под заказ" subtitle="Привозим под заказ клиента" groups={onOrder} />
        </main>

        <CartDrawer />
      </div>
    </CartProvider>
  );
}

function ProductSection({
  title,
  subtitle,
  groups,
}: {
  title: string;
  subtitle: string;
  groups: ProductGroup[];
}) {
  if (groups.length === 0) return null;

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
        <p className="text-sm text-neutral-500">{subtitle}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {groups.map((group) => (
          <CatalogProductCard key={group.key} group={group} />
        ))}
      </div>
    </section>
  );
}
