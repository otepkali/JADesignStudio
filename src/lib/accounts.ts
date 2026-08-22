import type { AccountId } from "@/types/database";

export const ACCOUNTS: { id: AccountId; name: string }[] = [
  { id: "cash", name: "Наличка" },
  { id: "ip_account", name: "Счёт ИП" },
  { id: "personal_account", name: "Счёт физ. лица" },
];

export const ACCOUNT_LABELS: Record<AccountId, string> = Object.fromEntries(
  ACCOUNTS.map((a) => [a.id, a.name])
) as Record<AccountId, string>;
