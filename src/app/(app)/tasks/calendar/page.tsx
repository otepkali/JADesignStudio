import Link from "next/link";
import { getTasks } from "@/lib/data";
import { TasksCalendar } from "@/components/tasks/TasksCalendar";

export const dynamic = "force-dynamic";

export default async function TasksCalendarPage() {
  const tasks = await getTasks();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Задачи · Календарь</h1>
        <p className="text-sm text-neutral-500">Задачи по датам дедлайна.</p>
      </div>

      <div className="flex gap-2 text-sm">
        <Link
          href="/tasks"
          className="rounded-xl border border-neutral-300 px-3 py-1.5 text-neutral-600 transition hover:border-brand-300 hover:bg-brand-50"
        >
          Список
        </Link>
        <span className="rounded-xl bg-brand-700 px-3 py-1.5 font-medium text-white">
          Календарь
        </span>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
        <TasksCalendar initialTasks={tasks} />
      </div>
    </div>
  );
}
