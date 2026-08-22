"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate, formatTenge, daysUntil } from "@/lib/format";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { EditProjectModal } from "@/components/project/EditProjectModal";
import { deleteProject, updateProject } from "@/app/(app)/projects/[id]/actions";
import type { ProjectWithTotals } from "@/lib/data";
import type { ProjectUpdateFormValues } from "@/lib/schemas";

export function ProjectCard({ project: initialProject, totals }: ProjectWithTotals) {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hidden, setHidden] = useState(false);

  const progress = totals.received > 0 ? Math.min(100, (totals.spent / totals.received) * 100) : 0;
  const isOverBudget = totals.remaining < 0;
  const days = daysUntil(project.deadline);

  if (hidden) return null;

  async function handleUpdateProject(values: ProjectUpdateFormValues) {
    const result = await updateProject(project.id, values);
    if ("error" in result && result.error) {
      return { error: result.error };
    }
    if ("project" in result) {
      setProject(result.project);
      router.refresh();
    }
    return {};
  }

  async function handleDelete() {
    setMenuOpen(false);
    const confirmed = window.confirm(
      `Удалить проект «${project.name}»? Все его расходы и оплаты будут удалены безвозвратно.`
    );
    if (!confirmed) return;

    setDeleting(true);
    const result = await deleteProject(project.id);
    setDeleting(false);

    if ("error" in result) {
      alert(`Не удалось удалить проект: ${result.error}`);
      return;
    }

    setHidden(true);
    router.refresh();
  }

  return (
    <div className="relative">
      <Link
        href={`/projects/${project.slug ?? project.id}`}
        className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-200"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 pr-2">
            <h3 className="truncate font-semibold text-neutral-900">{project.name}</h3>
            <p className="text-sm text-neutral-500">
              {formatTenge(project.total_amount)}
              <span className="mx-1.5 text-neutral-300">·</span>
              <span className="text-brand-700">
                {project.project_type === "design" ? "Дизайн проект" : "Ремонт под ключ"}
              </span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                project.status === "completed"
                  ? "bg-neutral-100 text-neutral-500"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {project.status === "completed" ? "Завершён" : "В работе"}
            </span>
            <button
              type="button"
              aria-label="Действия с проектом"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
            >
              ⋮
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className={`animate-grow-bar h-full rounded-full ${isOverBudget ? "bg-red-500" : "bg-brand-700"}`}
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
              <AnimatedNumber value={totals.remaining} format="tenge" />
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

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-4 top-12 z-30 w-40 overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-neutral-200">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setEditOpen(true);
              }}
              className="block w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-brand-50"
            >
              Изменить
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? "Удаление..." : "Удалить"}
            </button>
          </div>
        </>
      )}

      <EditProjectModal
        open={editOpen}
        project={project}
        onClose={() => setEditOpen(false)}
        onSubmit={handleUpdateProject}
      />
    </div>
  );
}
