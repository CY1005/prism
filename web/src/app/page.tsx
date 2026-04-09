import Link from "next/link";
import { getProjects } from "@/actions/projects";

export default async function Home() {
  const projectList = await getProjects();

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-14 items-center border-b px-6">
        <span className="text-lg font-semibold">Prism</span>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-xl font-semibold mb-4">我的项目</h1>

        <div className="grid grid-cols-2 gap-4">
          {projectList.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <div className="rounded-lg border p-5 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
                <h3 className="font-semibold">{project.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {project.description}
                </p>
                <div className="mt-3 text-sm text-muted-foreground">
                  {project.nodeCount} 个节点
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
