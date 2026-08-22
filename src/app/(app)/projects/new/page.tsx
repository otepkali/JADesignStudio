import { ProjectForm } from "@/components/project/ProjectForm";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-lg font-semibold text-neutral-900">Новый объект</h1>
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
        <ProjectForm />
      </div>
    </div>
  );
}
