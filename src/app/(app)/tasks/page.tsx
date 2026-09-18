import { getTasks, getTeamMembers } from "@/lib/data";
import { TasksWorkspace } from "@/components/tasks/TasksWorkspace";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const [tasks, teamMembers] = await Promise.all([getTasks(), getTeamMembers()]);
  return <TasksWorkspace initialTasks={tasks} teamMembers={teamMembers} />;
}
