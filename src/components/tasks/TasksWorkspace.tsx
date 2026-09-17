"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TaskForm } from "@/components/tasks/TaskForm";
import { TasksTable } from "@/components/tasks/TasksTable";
import { addTask, deleteTask, setTaskStatus, updateTask } from "@/app/(app)/tasks/actions";
import { sortTasks } from "@/lib/tasks";
import type { Task, TaskStatus } from "@/types/database";
import type { TaskFormValues } from "@/lib/schemas";

export function TasksWorkspace({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");

  const filtered = useMemo(
    () => (filter === "all" ? tasks : tasks.filter((t) => t.status === filter)),
    [tasks, filter]
  );

  async function handleAdd(values: TaskFormValues) {
    const result = await addTask(values);
    if ("error" in result && result.error) {
      return { error: result.error };
    }
    if ("task" in result) {
      setTasks((prev) => sortTasks([...prev, result.task]));
    }
    return {};
  }

  async function handleUpdate(taskId: string, values: TaskFormValues) {
    const result = await updateTask(taskId, values);
    if ("error" in result && result.error) {
      return { error: result.error };
    }
    if ("task" in result) {
      setTasks((prev) => sortTasks(prev.map((t) => (t.id === taskId ? result.task : t))));
    }
    return {};
  }

  async function handleSetStatus(taskId: string, status: TaskStatus) {
    const previous = tasks;
    setTasks((prev) => sortTasks(prev.map((t) => (t.id === taskId ? { ...t, status } : t))));
    const result = await setTaskStatus(taskId, status);
    if ("error" in result) {
      setTasks(previous);
    }
  }

  async function handleDelete(taskId: string) {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    const result = await deleteTask(taskId);
    if ("error" in result) {
      setTasks(previous);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Задачи</h1>
        <p className="text-sm text-neutral-500">
          Общий список ежедневных задач: что нужно сделать, кто отвечает и к какому сроку.
        </p>
      </div>

      <div className="flex gap-2 text-sm">
        <span className="rounded-xl bg-brand-700 px-3 py-1.5 font-medium text-white">Список</span>
        <Link
          href="/tasks/calendar"
          className="rounded-xl border border-neutral-300 px-3 py-1.5 text-neutral-600 transition hover:border-brand-300 hover:bg-brand-50"
        >
          Календарь
        </Link>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
        <h2 className="mb-3 text-base font-semibold text-neutral-900">Добавить задачу</h2>
        <TaskForm onSubmit={handleAdd} />
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-neutral-900">Все задачи</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | TaskStatus)}
            className="rounded-xl border border-neutral-300 px-2 py-1.5 text-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="all">Все статусы</option>
            <option value="todo">Не начато</option>
            <option value="in_progress">В процессе</option>
            <option value="done">Готово</option>
          </select>
        </div>
        <TasksTable
          tasks={filtered}
          onUpdate={handleUpdate}
          onSetStatus={handleSetStatus}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
