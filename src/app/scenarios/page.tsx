import Link from "next/link";
import { redirect } from "next/navigation";

import ScenarioManager from "@/components/scenarios/ScenarioManager";
import ScenarioSummary from "@/components/scenarios/ScenarioSummary";

import {
  createSupabaseServerClient,
} from "@/lib/database/server";

import {
  createProjectRepository,
  createScenarioRepository,
} from "@/lib/repositories/index.server";

export const dynamic =
  "force-dynamic";

interface ScenariosPageProps {
  searchParams: Promise<{
    projectId?: string;
    siteId?: string;
    includeArchived?: string;
  }>;
}

export default async function ScenariosPage({
  searchParams,
}: ScenariosPageProps) {
  const supabase =
    await createSupabaseServerClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const projectRepository =
    createProjectRepository();

  const scenarioRepository =
    createScenarioRepository();

  const [projects, workspace] =
    await Promise.all([
      projectRepository.listProjects(),

      projectRepository
        .getWorkspaceSelection(),
    ]);

  if (projects.length === 0) {
    redirect("/projects");
  }

  const parameters =
    await searchParams;

  const requestedProject =
    parameters.projectId
      ? projects.find(
          (project) =>
            project.id ===
            parameters.projectId,
        )
      : null;

  const workspaceProject =
    workspace.activeProjectId
      ? projects.find(
          (project) =>
            project.id ===
            workspace.activeProjectId,
        )
      : null;

  const selectedProject =
    requestedProject ??
    workspaceProject ??
    projects[0];

  const activeSites =
    selectedProject.sites.filter(
      (site) =>
        site.status !==
        "archived",
    );

  const requestedSite =
    parameters.siteId
      ? activeSites.find(
          (site) =>
            site.id ===
            parameters.siteId,
        )
      : null;

  const workspaceSite =
    workspace.activeSiteId
      ? activeSites.find(
          (site) =>
            site.id ===
            workspace.activeSiteId,
        )
      : null;

  const selectedSite =
    requestedSite ??
    workspaceSite ??
    activeSites[0] ??
    null;

  const includeArchived =
    parameters.includeArchived ===
    "true";

  const scenarios =
    selectedSite
      ? await scenarioRepository
          .listScenarios({
            projectId:
              selectedProject.id,

            siteId:
              selectedSite.id,

            includeArchived,
          })
      : [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-blue-700">
              AgriTwin Policy Test Bench
            </p>

            <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">
              Scenario Lab
            </h1>

            <p className="mt-3 max-w-3xl text-slate-600">
              Build reproducible agrivoltaic
              baselines and alternatives for
              future simulation, analytics,
              MCDA and policy evaluation.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/projects"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm"
            >
              Projects & sites
            </Link>

            <Link
              href="/"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Digital Twin
            </Link>
          </div>
        </header>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Project
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {projects.map(
                  (project) => (
                    <Link
                      key={
                        project.id
                      }
                      href={`/scenarios?projectId=${encodeURIComponent(
                        project.id,
                      )}`}
                      className={[
                        "rounded-xl border px-3 py-2 text-sm font-medium",
                        project.id ===
                        selectedProject.id
                          ? "border-blue-600 bg-blue-50 text-blue-800"
                          : "border-slate-200 bg-white text-slate-700",
                      ].join(" ")}
                    >
                      {project.name}
                    </Link>
                  ),
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Site
              </p>

              {activeSites.length >
              0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {activeSites.map(
                    (site) => (
                      <Link
                        key={
                          site.id
                        }
                        href={`/scenarios?projectId=${encodeURIComponent(
                          selectedProject.id,
                        )}&siteId=${encodeURIComponent(
                          site.id,
                        )}`}
                        className={[
                          "rounded-xl border px-3 py-2 text-sm font-medium",
                          site.id ===
                          selectedSite?.id
                            ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                            : "border-slate-200 bg-white text-slate-700",
                        ].join(" ")}
                      >
                        {site.name}
                      </Link>
                    ),
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-amber-700">
                  No active sites.
                </p>
              )}
            </div>
          </div>
        </section>

        {selectedSite ? (
          <>
            <section className="mt-6">
              <ScenarioSummary
                scenarios={
                  scenarios
                }
              />
            </section>

            <section className="mt-8">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-600">
                  {
                    selectedProject.name
                  }{" "}
                  · {selectedSite.name}
                </p>

                <Link
                  href={
                    includeArchived
                      ? `/scenarios?projectId=${encodeURIComponent(
                          selectedProject.id,
                        )}&siteId=${encodeURIComponent(
                          selectedSite.id,
                        )}`
                      : `/scenarios?projectId=${encodeURIComponent(
                          selectedProject.id,
                        )}&siteId=${encodeURIComponent(
                          selectedSite.id,
                        )}&includeArchived=true`
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                >
                  {includeArchived
                    ? "Hide archived"
                    : "Show archived"}
                </Link>
              </div>

              <ScenarioManager
                projectId={
                  selectedProject.id
                }
                siteId={
                  selectedSite.id
                }
                scenarios={
                  scenarios
                }
              />
            </section>

            <section className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <h2 className="font-semibold text-blue-950">
                Policy-test-bench workflow
              </h2>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
                {[
                  "1. Define scenario",
                  "2. Attach weather",
                  "3. Run digital twin",
                  "4. Evaluate policy KPIs",
                  "5. Compare alternatives",
                ].map(
                  (step) => (
                    <div
                      key={step}
                      className="rounded-xl bg-white px-3 py-3 font-medium text-slate-700"
                    >
                      {step}
                    </div>
                  ),
                )}
              </div>
            </section>
          </>
        ) : (
          <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            No active site is
            available for scenario
            creation.
          </section>
        )}
      </div>
    </main>
  );
}
