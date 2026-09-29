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
