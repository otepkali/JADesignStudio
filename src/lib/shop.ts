import type { Product } from "@/types/database";

export interface ProductGroup {
  key: string;
  category: Product["category"];
  image: string;
  items: Product[];
}

// Group product variants (same model, different sizes) so the catalog can
// show one card per model with a size selector instead of one card per SKU.
export function groupProducts(products: Product[]): ProductGroup[] {
  const groups = new Map<string, ProductGroup>();

  for (const p of products) {
    const existing = groups.get(p.product_group);
    if (existing) {
      existing.items.push(p);
    } else {
      groups.set(p.product_group, {
        key: p.product_group,
        category: p.category,
        image: p.image,
        items: [p],
      });
    }
  }

  for (const group of groups.values()) {
    group.items.sort((a, b) => a.list_price_kzt - b.list_price_kzt);
  }

  return [...groups.values()].sort((a, b) =>
    a.items[0].name.localeCompare(b.items[0].name, "ru")
  );
}

// ИП simplified-tax deduction subtracted from the sale price before cost.
const IP_TAX_RATE = 0.03;

export interface SaleCalculation {
  actualMarginKzt: number;
  marginDiffKzt: number;
  actualMarginPercent: number;
  marginPercentDiff: number;
}

// cost_price_kzt never changes at sale time, even with a discount — only
// the sale price (and thus margin) changes.
export function calculateSale(
  unitPriceKzt: number,
  costPriceKzt: number,
  fullMarginAmountKzt: number,
  fullMarginPercent: number
): SaleCalculation {
  const actualMarginKzt = unitPriceKzt * (1 - IP_TAX_RATE) - costPriceKzt;
  const marginDiffKzt = fullMarginAmountKzt - actualMarginKzt;
  const actualMarginPercent = unitPriceKzt > 0 ? (actualMarginKzt / unitPriceKzt) * 100 : 0;
  const marginPercentDiff = fullMarginPercent - actualMarginPercent;

  return { actualMarginKzt, marginDiffKzt, actualMarginPercent, marginPercentDiff };
}
