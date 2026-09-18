"use client";

import { TaskForm } from "@/components/tasks/TaskForm";
import type { TaskFormValues } from "@/lib/schemas";
import type { TeamMember } from "@/types/database";

export function AddTaskModal({
  open,
  teamMembers,
  onClose,
  onSubmit,
}: {
  open: boolean;
  teamMembers: TeamMember[];
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => Promise<{ error?: string }>;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">Добавить задачу</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            ×
          </button>
        </div>
        <TaskForm
          teamMembers={teamMembers}
          submitLabel="Добавить задачу"
          onCancel={onClose}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
