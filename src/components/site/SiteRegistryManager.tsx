"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type {
  ProjectSummary,
  SiteOperationResult,
  WorkspaceSelection,
} from "@/lib/projects/types";
import { isLandAgrivoltaicSiteProfile } from "@/lib/sites/migrations";
import { useSimulationStore } from "@/store/useSimulationStore";

interface SiteRegistryManagerProps {
  projects: ProjectSummary[];
  workspace: WorkspaceSelection;
}

interface ApiResponse {
  ok: boolean;
  error?: string;
  result?: SiteOperationResult;
}

export default function SiteRegistryManager({
  projects,
  workspace,
}: SiteRegistryManagerProps) {
  const router = useRouter();

  const activeSite = useSimulationStore(
    (state) => state.activeSite,
  );

  const replaceActiveSite = useSimulationStore(
    (state) => state.replaceActiveSite,
  );

  const [busyKey, setBusyKey] = useState<
    string | null
  >(null);

  const [message, setMessage] =
    useState<string>("");

  const [newSiteName, setNewSiteName] =
    useState("New land site");

  async function runOperation(
    key: string,
    payload: Record<string, unknown>,
    options?: {
      loadResult?: boolean;
      goDashboard?: boolean;
    },
  ) {
    setBusyKey(key);
    setMessage("");

    try {
      const response = await fetch(
        "/api/site-registry",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data =
        (await response.json()) as ApiResponse;

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ??
            "The site operation failed.",
        );
      }

      if (options?.loadResult && data.result) {
        const returnedSite =
          data.result.siteProfile;

        if (
          !isLandAgrivoltaicSiteProfile(
            returnedSite,
          )
        ) {
          throw new Error(
            "The current dashboard supports land agrivoltaic sites only. Flat-roof dashboard support will be enabled in Phase 8C-2.",
          );
        }

        replaceActiveSite(returnedSite);
      }

      if (options?.goDashboard) {
        window.location.assign("/");
        return;
      }

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unknown site operation error.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  const activeProject =
    projects.find(
      (project) =>
        project.id === workspace.activeProjectId,
    ) ?? projects[0];

  return (
    <div className="space-y-6">
      {message ? (
        <p
          className="rounded-xl bg-red-50 px-4 py-3 text-red-700"
          role="alert"
        >
          {message}
        </p>
      ) : null}

      {activeProject ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Add an independent land site
          </h2>

          <p className="mt-2 text-slate-600">
            The new site starts from the current
            dashboard configuration, receives a new
            identity and is preserved as its own
            immutable site version.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={newSiteName}
              onChange={(event) =>
                setNewSiteName(
                  event.target.value,
                )
              }
              maxLength={200}
              className="flex-1 rounded-xl border border-slate-300 px-3 py-2"
              aria-label="New site name"
            />

            <button
              type="button"
              disabled={busyKey !== null}
              onClick={() =>
                runOperation(
                  "create",
                  {
                    action: "create",
                    projectId:
                      activeProject.id,
                    name: newSiteName,
                    siteProfile: activeSite,
                  },
                  {
                    loadResult: true,
                  },
                )
              }
              className="rounded-xl bg-emerald-700 px-4 py-2 font-medium text-white disabled:opacity-60"
            >
              {busyKey === "create"
                ? "Creating…"
                : "Create land site"}
            </button>
          </div>
        </section>
      ) : null}

      {projects.map((project) => {
        const activeSites =
          project.sites.filter(
            (site) =>
              site.status === "active",
          );

        const archivedSites =
          project.sites.filter(
            (site) =>
              site.status === "archived",
          );

        return (
          <article
            key={project.id}
            className="rounded-2xl border border-slate-200 bg-white p-6"
          >
            <h2 className="text-xl font-semibold text-slate-900">
              {project.name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Project ID: {project.id}
            </p>

            <div className="mt-5 space-y-3">
              {activeSites.map((site) => {
                const isActive =
                  workspace.activeSiteId ===
                  site.id;

                return (
                  <section
                    key={site.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium text-slate-900">
                            {site.name}
                          </h3>

                          {isActive ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-800">
                              Active
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {site.siteType.replaceAll(
                            "_",
                            " ",
                          )}
                          {" · "}
                          {site.dataMode}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={
                            busyKey !== null ||
                            isActive
                          }
                          onClick={() =>
                            runOperation(
                              `switch-${site.id}`,
                              {
                                action:
                                  "switch",
                                projectId:
                                  project.id,
                                siteId: site.id,
                              },
                              {
                                loadResult: true,
                                goDashboard: true,
                              },
                            )
                          }
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
                        >
                          Open in dashboard
                        </button>

                        <button
                          type="button"
                          disabled={
                            busyKey !== null
                          }
                          onClick={() => {
                            const name =
                              window.prompt(
                                "Name for the duplicate site:",
                                `${site.name} copy`,
                              );

                            if (name) {
                              void runOperation(
                                `duplicate-${site.id}`,
                                {
                                  action:
                                    "duplicate",
                                  siteId:
                                    site.id,
                                  name,
                                },
                              );
                            }
                          }}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
                        >
                          Duplicate
                        </button>

                        <button
                          type="button"
                          disabled={
                            busyKey !== null
                          }
                          onClick={() => {
                            const name =
                              window.prompt(
                                "New site name:",
                                site.name,
                              );

                            if (
                              name &&
                              name !== site.name
                            ) {
                              void runOperation(
                                `rename-${site.id}`,
                                {
                                  action: "rename",
                                  siteId:
                                    site.id,
                                  name,
                                },
                              );
                            }
                          }}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
                        >
                          Rename
                        </button>

                        <button
                          type="button"
                          disabled={
                            busyKey !== null ||
                            activeSites.length <=
                              1
                          }
                          onClick={() =>
                            runOperation(
                              `archive-${site.id}`,
                              {
                                action:
                                  "archive",
                                siteId: site.id,
                              },
                            )
                          }
                          className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 disabled:opacity-50"
                        >
                          Archive
                        </button>
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>

            {archivedSites.length > 0 ? (
              <section className="mt-6">
                <h3 className="font-medium text-slate-800">
                  Archived sites
                </h3>

                <div className="mt-3 space-y-2">
                  {archivedSites.map(
                    (site) => (
                      <div
                        key={site.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"
                      >
                        <span>
                          {site.name}
                        </span>

                        <button
                          type="button"
                          disabled={
                            busyKey !== null
                          }
                          onClick={() =>
                            runOperation(
                              `restore-${site.id}`,
                              {
                                action:
                                  "restore",
                                siteId:
                                  site.id,
                              },
                            )
                          }
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
                        >
                          Restore
                        </button>
                      </div>
                    ),
                  )}
                </div>
              </section>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
