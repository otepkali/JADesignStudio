const currencyFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 0,
});

export function formatTenge(amount: number): string {
  return `${currencyFormatter.format(Math.round(amount))} ₸`;
}

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatDate(date: string | null): string {
  if (!date) return "—";
  return dateFormatter.format(new Date(date));
}

export function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const diff = new Date(date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.round(diff / (1000 * 60 * 60 * 24));
}
