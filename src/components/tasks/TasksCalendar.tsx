"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { buildMonthGrid, toDateKey, MONTH_LABELS, WEEKDAY_LABELS } from "@/lib/calendar";
import { setTaskStatus } from "@/app/(app)/tasks/actions";
import type { Task } from "@/types/database";

const STATUS_DOT: Record<Task["status"], string> = {
  todo: "bg-neutral-400",
  in_progress: "bg-amber-500",
  done: "bg-emerald-500",
};

const PRIORITY_BORDER: Record<Task["priority"], string> = {
  low: "border-transparent",
  medium: "border-amber-400",
  high: "border-red-500",
};

export function TasksCalendar({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const todayKey = toDateKey(today);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.deadline) continue;
      const key = task.deadline;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    }
    return map;
  }, [tasks]);

  function goPrevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function goToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }

  async function handleToggleDone(task: Task) {
    const nextStatus = task.status === "done" ? "todo" : "done";
    const previous = tasks;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));
    const result = await setTaskStatus(task.id, nextStatus);
    if ("error" in result) {
      setTasks(previous);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={goPrevMonth}
            className="rounded-lg border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-600 transition hover:border-brand-300 hover:bg-brand-50"
          >
            ←
          </button>
          <h2 className="w-40 text-center text-base font-semibold text-neutral-900 sm:w-48">
            {MONTH_LABELS[viewMonth]} {viewYear}
          </h2>
          <button
            onClick={goNextMonth}
            className="rounded-lg border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-600 transition hover:border-brand-300 hover:bg-brand-50"
          >
            →
          </button>
        </div>
        <button
          onClick={goToday}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 transition hover:border-brand-300 hover:bg-brand-50"
        >
          Сегодня
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-neutral-500">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="py-1">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.weeks.flat().map((date) => {
              const key = toDateKey(date);
              const inMonth = date.getMonth() === viewMonth;
              const isToday = key === todayKey;
              const dayTasks = tasksByDay.get(key) ?? [];

              return (
                <div
                  key={key}
                  className={`min-h-[92px] rounded-xl border p-1.5 ${
                    inMonth ? "border-neutral-200 bg-white" : "border-neutral-100 bg-neutral-50"
                  }`}
                >
                  <p
                    className={`mb-1 text-xs ${
                      isToday
                        ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-700 font-semibold text-white"
                        : inMonth
                          ? "text-neutral-500"
                          : "text-neutral-300"
                    }`}
                  >
                    {date.getDate()}
                  </p>
                  <div className="space-y-1">
                    {dayTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => handleToggleDone(task)}
                        title={task.assignee ? `${task.title} · ${task.assignee}` : task.title}
                        className={`flex w-full items-center gap-1 truncate rounded-md border-l-2 px-1 py-0.5 text-left text-[11px] transition hover:bg-brand-50 ${
                          PRIORITY_BORDER[task.priority]
                        } ${task.status === "done" ? "text-neutral-400 line-through" : "text-neutral-700"}`}
                      >
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[task.status]}`} />
                        <span className="truncate">{task.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-xs text-neutral-400">
        Клик по задаче отмечает её готовой/неготовой. Добавить или отредактировать задачу можно на{" "}
        <Link href="/tasks" className="text-brand-700 underline">
          странице «Задачи»
        </Link>
        .
      </p>
    </div>
  );
}
