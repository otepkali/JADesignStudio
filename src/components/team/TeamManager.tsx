"use client";

import { useState } from "react";
import Link from "next/link";
import { addTeamMember, deleteTeamMember } from "@/app/(app)/team/actions";
import type { TeamMember } from "@/types/database";

export function TeamManager({ initialMembers }: { initialMembers: TeamMember[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAdding(true);
    const result = await addTeamMember({ name });
    setAdding(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setMembers((prev) => [...prev, result.member].sort((a, b) => a.name.localeCompare(b.name)));
    setName("");
  }

  async function handleDelete(id: string) {
    if (!confirm("Убрать сотрудника? Его задачи останутся, но без ответственного.")) return;
    const previous = members;
    setMembers((prev) => prev.filter((m) => m.id !== id));
    const result = await deleteTeamMember(id);
    if ("error" in result) {
      setMembers(previous);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Сотрудники</h1>
        <p className="text-sm text-neutral-500">
          Кому можно назначать задачи. Чтобы подключить уведомления в Telegram, попросите
          сотрудника написать боту своё имя точно как здесь — бот сам привяжет чат.
        </p>
      </div>

      <div className="flex gap-2 text-sm">
        <Link
          href="/tasks"
          className="rounded-xl border border-neutral-300 px-3 py-1.5 text-neutral-600 transition hover:border-brand-300 hover:bg-brand-50"
        >
          Список
        </Link>
        <Link
          href="/tasks/calendar"
          className="rounded-xl border border-neutral-300 px-3 py-1.5 text-neutral-600 transition hover:border-brand-300 hover:bg-brand-50"
        >
          Календарь
        </Link>
        <span className="rounded-xl bg-brand-700 px-3 py-1.5 font-medium text-white">
          Сотрудники
        </span>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Имя сотрудника"
            className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          <button
            type="submit"
            disabled={adding || !name.trim()}
            className="shrink-0 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-800 disabled:opacity-50"
          >
            {adding ? "..." : "Добавить"}
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
        {members.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-400">Пока нет сотрудников</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {members.map((member) => (
              <li key={member.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-neutral-900">{member.name}</p>
                  <p className="text-xs">
                    {member.telegram_chat_id ? (
                      <span className="text-emerald-700">✓ Telegram подключён</span>
                    ) : (
                      <span className="text-neutral-400">Telegram не подключён</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(member.id)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Удалить
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
