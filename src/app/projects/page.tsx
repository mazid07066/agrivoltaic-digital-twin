import Link from "next/link";
import { redirect } from "next/navigation";

import FirstProjectMigrationForm from "@/components/site/FirstProjectMigrationForm";
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
  const supabase =
    await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const repository =
    createProjectRepository();

  const projects =
    await repository.listProjects();

  const parameters =
    await searchParams;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">
              Projects and sites
            </h1>

            <p className="mt-2 text-slate-600">
              Database-backed AgriTwin project
              and site registry.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-800"
          >
            Return to dashboard
          </Link>
        </div>

        {parameters.migration === "complete" ? (
          <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-800">
            The Phase 8A land site has been
            preserved successfully.
          </p>
        ) : null}

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-slate-900">
            Database projects
          </h2>

          {projects.length === 0 ? (
            <p className="mt-3 text-slate-600">
              No database project exists yet.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {projects.map((project) => (
                <article
                  key={project.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {project.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Project ID: {project.id}
                      </p>
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                      {project.status}
                    </span>
                  </div>

                  {project.description ? (
                    <p className="mt-3 text-slate-600">
                      {project.description}
                    </p>
                  ) : null}

                  <div className="mt-5 space-y-3">
                    {project.sites.length === 0 ? (
                      <p className="text-slate-500">
                        This project has no sites.
                      </p>
                    ) : (
                      project.sites.map((site) => (
                        <div
                          key={site.id}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-slate-900">
                                {site.name}
                              </p>

                              <p className="text-sm text-slate-500">
                                {site.siteType.replaceAll(
                                  "_",
                                  " ",
                                )}
                                {" · "}
                                {site.dataMode}
                              </p>
                            </div>

                            <span className="text-sm text-slate-600">
                              {site.status}
                            </span>
                          </div>

                          <p className="mt-2 break-all text-xs text-slate-500">
                            Active version:{" "}
                            {site.activeVersionId ??
                              "Not assigned"}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {projects.length === 0 ? (
          <div className="mt-8">
            <FirstProjectMigrationForm />
          </div>
        ) : null}
      </div>
    </main>
  );
}
