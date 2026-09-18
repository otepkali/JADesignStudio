import { getTeamMembers } from "@/lib/data";
import { TeamManager } from "@/components/team/TeamManager";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const members = await getTeamMembers();
  return <TeamManager initialMembers={members} />;
}
