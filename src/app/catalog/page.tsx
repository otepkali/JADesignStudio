import Image from "next/image";
import { getProducts } from "@/lib/data";
import { formatTenge } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Каталог — JA Design Studio",
};

export default async function CatalogPage() {
  const products = await getProducts();
  const inStock = products.filter((p) => !p.available_on_order);
  const onOrder = products.filter((p) => p.available_on_order);

  return (
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

      <main className="mx-auto max-w-5xl space-y-10 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Магазин фурнитуры</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Фурнитура для гардеробных: штанги, полки, корзины, ручки и двери.
          </p>
        </div>

        <ProductSection title="Ассортимент" subtitle="В наличии" products={inStock} />
        <ProductSection title="Под заказ" subtitle="Привозим под заказ клиента" products={onOrder} />
      </main>
    </div>
  );
}

function ProductSection({
  title,
  subtitle,
  products,
}: {
  title: string;
  subtitle: string;
  products: Awaited<ReturnType<typeof getProducts>>;
}) {
  if (products.length === 0) return null;

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
        <p className="text-sm text-neutral-500">{subtitle}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {products.map((p) => (
          <div
            key={p.id}
            className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200"
          >
            <div className="relative aspect-square bg-neutral-100">
              <Image src={`/products/${p.image}`} alt={p.name} fill className="object-cover" />
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-neutral-900">{p.name}</p>
              <p className="mt-0.5 text-xs text-neutral-400">
                {p.sku} · {p.size}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-brand-700">
                  {formatTenge(p.list_price_kzt)}
                </span>
                {p.available_on_order ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    Под заказ
                  </span>
                ) : (
                  <span className="text-xs text-neutral-400">{p.stock_qty} шт.</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
