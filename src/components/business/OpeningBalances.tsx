"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ACCOUNTS } from "@/lib/accounts";
import { formatTenge } from "@/lib/format";
import { setOpeningBalance } from "@/app/(app)/business/actions";
import type { AccountId } from "@/types/database";

function toValues(source: Record<AccountId, number>): Record<AccountId, string> {
  return Object.fromEntries(
    ACCOUNTS.map((a) => [a.id, source[a.id] ? String(source[a.id]) : ""])
  ) as Record<AccountId, string>;
}

export function OpeningBalances({ initial }: { initial: Record<AccountId, number> }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [values, setValues] = useState<Record<AccountId, string>>(() => toValues(initial));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);

    for (const acc of ACCOUNTS) {
      const amount = Number(values[acc.id]) || 0;
      const result = await setOpeningBalance(acc.id, amount);
      if ("error" in result) {
        setError(result.error);
        setSaving(false);
        return;
      }
    }

    const nextSaved = Object.fromEntries(
      ACCOUNTS.map((a) => [a.id, Number(values[a.id]) || 0])
    ) as Record<AccountId, number>;
    setSaved(nextSaved);
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  function handleCancel() {
    setValues(toValues(saved));
    setError(null);
    setEditing(false);
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-900">Начальные остатки</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="rounded-xl border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 transition hover:border-brand-300 hover:bg-brand-50"
          >
            Изменить
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {ACCOUNTS.map((acc) => (
          <div key={acc.id}>
            <label className="mb-1 block text-xs text-neutral-500">{acc.name}</label>
            {editing ? (
              <input
                type="number"
                inputMode="decimal"
                step="any"
                value={values[acc.id]}
                onChange={(e) => setValues((prev) => ({ ...prev, [acc.id]: e.target.value }))}
                placeholder="0"
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            ) : (
              <p className="text-lg font-semibold text-neutral-900">
                {formatTenge(saved[acc.id] ?? 0)}
              </p>
            )}
          </div>
        ))}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {editing && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800 disabled:opacity-50"
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm text-neutral-600 transition hover:bg-neutral-50"
          >
            Отмена
          </button>
        </div>
      )}
    </div>
  );
}
