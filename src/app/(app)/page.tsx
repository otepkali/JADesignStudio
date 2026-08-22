import Link from "next/link";
import { getProjectsWithTotals, getDashboardSummary } from "@/lib/data";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { formatTenge } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const projectsWithTotals = await getProjectsWithTotals();
  const summary = await getDashboardSummary(projectsWithTotals);

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
          <p className="text-xs text-neutral-500">Проектов в работе</p>
          <p className="mt-1 text-xl font-bold text-neutral-900">{summary.activeCount}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
          <p className="text-xs text-neutral-500">Сумма активных объектов</p>
          <p className="mt-1 text-xl font-bold text-neutral-900">
            {formatTenge(summary.activeTotalAmount)}
          </p>
        </div>
        <div className="col-span-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200 sm:col-span-1">
          <p className="text-xs text-neutral-500">Расходы за этот месяц</p>
          <p className="mt-1 text-xl font-bold text-neutral-900">
            {formatTenge(summary.currentMonthExpenses)}
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-900">Объекты</h1>
        <Link
          href="/projects/new"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          + Создать проект
        </Link>
      </div>

      {projectsWithTotals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 p-10 text-center text-neutral-500">
          Пока нет ни одного проекта. Создайте первый объект.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {projectsWithTotals.map(({ project, totals }) => (
            <ProjectCard key={project.id} project={project} totals={totals} />
          ))}
        </div>
      )}
    </div>
  );
}
