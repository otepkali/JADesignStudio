import type { RoleInfo } from "@/lib/roles";

export function RoleCard({ role, defaultOpen }: { role: RoleInfo; defaultOpen?: boolean }) {
  return (
    <details
      className="group rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 open:ring-brand-200"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">{role.name}</h2>
          <p className="mt-0.5 text-xs text-neutral-500">{role.subordination}</p>
        </div>
        <span className="shrink-0 text-neutral-400 transition group-open:rotate-180">⌄</span>
      </summary>

      <div className="space-y-5 border-t border-neutral-100 p-5 pt-4">
        <section>
          <h3 className="text-sm font-semibold text-neutral-700">Цель должности</h3>
          <p className="mt-1 text-sm text-neutral-600">{role.goal}</p>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-neutral-700">Обязанности</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-neutral-600">
            {role.duties.map((duty) => (
              <li key={duty} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-700" />
                <span>{duty}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-neutral-700">Полномочия и границы</h3>
          <p className="mt-1 text-sm text-neutral-600">{role.authority}</p>
          <p className="mt-2 text-sm text-neutral-600">{role.responsibility}</p>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-neutral-700">KPI</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-neutral-600">
            {role.kpi.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-700" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-neutral-700">Приёмка работы</h3>
          <p className="mt-1 text-sm text-neutral-600">{role.acceptance}</p>
        </section>
      </div>
    </details>
  );
}
