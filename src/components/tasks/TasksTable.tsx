"use client";

import { useState } from "react";
import { formatDate, daysUntil } from "@/lib/format";
import { TaskForm } from "@/components/tasks/TaskForm";
import type { Task, TaskPriority, TaskStatus } from "@/types/database";
import type { TaskFormValues } from "@/lib/schemas";

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Не начато",
  in_progress: "В процессе",
  done: "Готово",
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: "bg-neutral-100 text-neutral-600",
  in_progress: "bg-amber-50 text-amber-700",
  done: "bg-emerald-50 text-emerald-700",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Низкая",
  medium: "Средняя",
  high: "Высокая",
};

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: "text-neutral-400",
  medium: "text-neutral-600",
  high: "text-red-600 font-medium",
};

const PRIORITY_DOT: Record<TaskPriority, string> = {
  low: "bg-neutral-300",
  medium: "bg-amber-400",
  high: "bg-red-500",
};

export function TasksTable({
  tasks,
  onUpdate,
  onSetStatus,
  onDelete,
}: {
  tasks: Task[];
  onUpdate: (taskId: string, values: TaskFormValues) => Promise<{ error?: string }>;
  onSetStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingTask = tasks.find((t) => t.id === editingId) ?? null;

  if (tasks.length === 0) {
    return <p className="py-6 text-center text-sm text-neutral-400">Задач пока нет</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="text-left text-xs text-neutral-500">
            <th className="pb-2 font-medium">Задача</th>
            <th className="pb-2 font-medium">Ответственный</th>
            <th className="pb-2 font-medium">Дедлайн</th>
            <th className="pb-2 font-medium">Важность</th>
            <th className="pb-2 font-medium">Статус</th>
            <th className="pb-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            if (editingTask?.id === task.id) {
              return (
                <tr key={task.id}>
                  <td colSpan={6} className="py-3">
                    <div className="rounded-xl border border-neutral-300 bg-neutral-50 p-4">
                      <TaskForm
                        submitLabel="Сохранить"
                        onCancel={() => setEditingId(null)}
                        defaultValues={{
                          title: task.title,
                          assignee: task.assignee ?? "",
                          deadline: task.deadline ?? "",
                          status: task.status,
                          priority: task.priority,
                          note: task.note ?? "",
                        }}
                        onSubmit={(values) => onUpdate(task.id, values)}
                      />
                    </div>
                  </td>
                </tr>
              );
            }

            const days = daysUntil(task.deadline);
            const isOverdue = task.status !== "done" && days !== null && days < 0;

            return (
              <tr key={task.id} className="border-t border-neutral-100">
                <td className="py-2 pr-2">
                  <p
                    className={`font-medium ${
                      task.status === "done" ? "text-neutral-400 line-through" : "text-neutral-900"
                    }`}
                  >
                    {task.title}
                  </p>
                  {task.note && <p className="text-xs text-neutral-400">{task.note}</p>}
                </td>
                <td className="py-2 pr-2 text-neutral-700">{task.assignee || "—"}</td>
                <td className={`py-2 pr-2 ${isOverdue ? "font-medium text-red-600" : "text-neutral-700"}`}>
                  {formatDate(task.deadline)}
                </td>
                <td className={`py-2 pr-2 ${PRIORITY_STYLES[task.priority]}`}>
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                </td>
                <td className="py-2 pr-2">
                  <select
                    value={task.status}
                    onChange={(e) => onSetStatus(task.id, e.target.value as TaskStatus)}
                    className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[task.status]}`}
                  >
                    {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2 pr-2">
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      onClick={() => setEditingId(task.id)}
                      className="text-neutral-500 hover:text-brand-700"
                    >
                      Изменить
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Удалить задачу?")) onDelete(task.id);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
