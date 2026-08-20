import Link from "next/link";
import { redirect } from "next/navigation";

import FirstProjectMigrationForm from "@/components/site/FirstProjectMigrationForm";
import SiteRegistryManager from "@/components/site/SiteRegistryManager";
import { createSupabaseServerClient } from "@/lib/database/server";
import { createProjectRepository } from "@/lib/repositories/index.server";

export const dynamic = "force-dynamic";

interface ProjectsPageProps {
  searchParams: Promise<{
    migration?: string;
  }>;
}

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const repository = createProjectRepository();
  const [projects, workspace] = await Promise.all([
    repository.listProjects(),
    repository.getWorkspaceSelection(),
  ]);

  const parameters = await searchParams;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">
              Projects and sites
            </h1>
            <p className="mt-2 text-slate-600">
              Database-backed AgriTwin project and independent-site registry.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/scenarios"
              className="rounded-xl bg-blue-600 px-4 py-2 font-medium text-white"
            >
              Scenario Lab
            </Link>

            <Link
              href="/"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-800"
            >
              Return to dashboard
            </Link>
          </div>
        </div>

        {parameters.migration === "complete" ? (
          <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-800">
            The Phase 8A land site has been preserved successfully.
          </p>
        ) : null}

        <section className="mt-8">
          {projects.length === 0 ? (
            <>
              <h2 className="text-xl font-semibold text-slate-900">
                Database projects
              </h2>
              <p className="mt-3 text-slate-600">
                No database project exists yet.
              </p>
              <div className="mt-8">
                <FirstProjectMigrationForm />
              </div>
            </>
          ) : (
            <SiteRegistryManager projects={projects} workspace={workspace} />
          )}
        </section>
      </div>
    </main>
  );
}
