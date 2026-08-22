import Link from "next/link";
import { formatDate, formatTenge, daysUntil } from "@/lib/format";
import type { ProjectWithTotals } from "@/lib/data";

export function ProjectCard({ project, totals }: ProjectWithTotals) {
  const progress = totals.received > 0 ? Math.min(100, (totals.spent / totals.received) * 100) : 0;
  const isOverBudget = totals.remaining < 0;
  const days = daysUntil(project.deadline);

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 transition hover:ring-neutral-300"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-neutral-900">{project.name}</h3>
          <p className="text-sm text-neutral-500">{formatTenge(project.total_amount)}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
            project.status === "completed"
              ? "bg-neutral-100 text-neutral-500"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {project.status === "completed" ? "Завершён" : "В работе"}
        </span>
      </div>

      <div className="mt-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className={`h-full rounded-full ${isOverBudget ? "bg-red-500" : "bg-neutral-900"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-neutral-500">
          <span>Потрачено {formatTenge(totals.spent)}</span>
          <span>Получено {formatTenge(totals.received)}</span>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-xs text-neutral-500">Остаток</p>
          <p className={`text-2xl font-bold ${isOverBudget ? "text-red-600" : "text-neutral-900"}`}>
            {formatTenge(totals.remaining)}
          </p>
        </div>
        {project.deadline && (
          <div className="text-right">
            <p className="text-xs text-neutral-500">Дедлайн</p>
            <p className="text-sm font-medium text-neutral-700">{formatDate(project.deadline)}</p>
            {days !== null && project.status !== "completed" && (
              <p className={`text-xs ${days < 3 ? "text-red-500" : "text-neutral-400"}`}>
                {days > 0 ? `через ${days} дн.` : days === 0 ? "сегодня" : `просрочен на ${-days} дн.`}
              </p>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
