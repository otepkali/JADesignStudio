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
          {role.subordination && <p className="mt-0.5 text-xs text-neutral-500">{role.subordination}</p>}
        </div>
        <span className="shrink-0 text-neutral-400 transition group-open:rotate-180">⌄</span>
      </summary>

      <div className="space-y-5 border-t border-neutral-100 p-5 pt-4">
        <section>
          <h3 className="text-sm font-semibold text-neutral-700">Цель должности</h3>
          <p className="mt-1 text-sm text-neutral-600">{role.goal}</p>
        </section>

        {role.sections.map((section) => (
          <section key={section.heading}>
            <h3 className="text-sm font-semibold text-neutral-700">{section.heading}</h3>
            {section.intro && <p className="mt-1 text-sm text-neutral-600">{section.intro}</p>}
            {section.bullets && (
              <ul className="mt-2 space-y-1.5 text-sm text-neutral-600">
                {section.bullets.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-700" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
            {section.paragraphs?.map((p) => (
              <p key={p} className="mt-2 text-sm text-neutral-600">
                {p}
              </p>
            ))}
          </section>
        ))}

        {role.closing && (
          <section className="rounded-xl bg-brand-50 p-4">
            <h3 className="text-sm font-semibold text-brand-700">{role.closing.heading}</h3>
            <p className="mt-1 text-sm text-neutral-700">{role.closing.text}</p>
          </section>
        )}
      </div>
    </details>
  );
}
