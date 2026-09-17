import { getTasks } from "@/lib/data";
import { TasksWorkspace } from "@/components/tasks/TasksWorkspace";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const tasks = await getTasks();
  return <TasksWorkspace initialTasks={tasks} />;
}
