import { google } from "googleapis";
import { ACCOUNT_LABELS } from "@/lib/accounts";
import type { AccountId } from "@/types/database";

export interface ExpenseSheetRow {
  date: string;
  projectName: string;
  categoryName: string;
  subcategoryName: string;
  materialName: string;
  quantity: number | null;
  unit: string | null;
  unitPrice: number | null;
  totalPrice: number;
  note: string | null;
  account?: AccountId | null;
  bonusAmount?: number | null;
}

function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!email || !privateKey || !sheetId) {
    throw new Error("Google Sheets credentials are not configured");
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return { sheets: google.sheets({ version: "v4", auth }), sheetId };
}

export async function appendExpenseRow(row: ExpenseSheetRow) {
  const { sheets, sheetId } = getSheetsClient();

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "A:L",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [
        [
          row.date,
          row.projectName,
          row.categoryName,
          row.subcategoryName,
          row.materialName,
          row.quantity ?? "",
          row.unit ?? "",
          row.unitPrice ?? "",
          row.totalPrice,
          row.note ?? "",
          row.account ? ACCOUNT_LABELS[row.account] : "",
          row.bonusAmount ?? "",
        ],
      ],
    },
  });
}
