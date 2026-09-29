import * as XLSX from "xlsx";
import type { CartItem } from "@/components/shop/CartContext";

export function exportCartToExcel(items: CartItem[]) {
  const rows = items.map((i) => ({
    Артикул: i.sku,
    Товар: i.group,
    Размер: i.size,
    "Кол-во": i.qty,
    "Цена за шт, тг": i.unitPrice,
    "Сумма, тг": i.unitPrice * i.qty,
  }));

  const total = items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
  rows.push({
    Артикул: "",
    Товар: "",
    Размер: "",
    "Кол-во": "" as unknown as number,
    "Цена за шт, тг": "Итого:" as unknown as number,
    "Сумма, тг": total,
  });

  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = [{ wch: 16 }, { wch: 40 }, { wch: 14 }, { wch: 8 }, { wch: 16 }, { wch: 16 }];

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Корзина");

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(book, `korzina-${date}.xlsx`);
}
