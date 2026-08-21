import Link from "next/link";

import {
  notFound,
  redirect,
} from "next/navigation";

import LogoutButton from "@/components/auth/LogoutButton";

import SimulationHourlyChart from "@/components/simulation-runs/SimulationHourlyChart";

import SimulationStudyProvenance from "@/components/simulation-runs/SimulationStudyProvenance";

import {
  createSupabaseServerClient,
} from "@/lib/database/server";

import {
  loadSimulationRun,
} from "@/lib/execution/runReader.server";

import type {
  CanonicalSimulationSummary,
} from "@/lib/execution/types";

export const dynamic =
  "force-dynamic";

interface SimulationRunPageProps {
  params:
    Promise<{
      runId:
        string;
    }>;
}

function isRecord(
  value:
    unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value,
    )
  );
}

function parseSummary(
  value:
    unknown,
): CanonicalSimulationSummary | null {
  if (
    !isRecord(
      value,
    )
  ) {
    return null;
  }

  return value as unknown as
    CanonicalSimulationSummary;
}

function metric(
  value:
    number | null | undefined,
  digits = 2,
): string {
  return value == null
    ? "N/A"
    : value.toFixed(
        digits,
      );
}

function dateTime(
  value:
    string | null,
): string {
  if (!value) {
    return "Not available";
  }

  const date =
    new Date(
      value,
    );

  return Number.isNaN(
    date.getTime(),
  )
    ? value
    : date.toLocaleString();
}

export default async function SimulationRunPage({
  params,
}: SimulationRunPageProps) {
  const supabase =
    await createSupabaseServerClient();

  const {
    data: {
      user,
    },
  } =
    await supabase.auth
      .getUser();

  if (!user) {
    redirect(
      "/login",
    );
  }

  const {
    runId,
  } =
    await params;

  let loaded;

  try {
    loaded =
      await loadSimulationRun(
        runId,
      );
  } catch {
    notFound();
  }

  const {
    run,
    reproducibility,
  } =
    loaded;

  const summary =
    parseSummary(
      run.resultSummary,
    );

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
              AgriTwin Simulation Run
            </p>

            <h1 className="mt-1 text-3xl font-semibold text-slate-950">
              Persisted digital-twin results
            </h1>

            <p className="mt-2 max-w-3xl text-slate-600">
              Results shown here were loaded from
              the persisted simulation run. The
              engine is not rerun when this page
              opens.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/scenarios"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-800"
            >
              Scenario Lab
            </Link>

            <Link
              href="/projects"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-800"
            >
              Projects
            </Link>

            <Link
              href="/analytics"
              className="rounded-xl border border-indigo-300 bg-white px-4 py-2 font-medium text-indigo-700"
            >
              Analytics
            </Link>

            <LogoutButton className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50" />
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">
                Simulation Run ID
              </p>

              <p className="mt-1 break-all font-mono text-sm font-medium text-slate-900">
                {
                  run.id
                }
              </p>
            </div>

            <span
              className={`rounded-full border px-3 py-1 text-sm font-medium ${
                run.status ===
                "completed"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : run.status ===
                      "failed"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-slate-200 bg-slate-50 text-slate-700"
              }`}
            >
              {run.status}
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Simulation date
              </p>

              <p className="mt-1 font-semibold">
                {
                  run.simulationDate
                }
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Engine
              </p>

              <p className="mt-1 font-semibold">
                {
                  run.engineVersion
                }
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Started
              </p>

              <p className="mt-1 font-semibold">
                {dateTime(
                  run.startedAt,
                )}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Completed
              </p>

              <p className="mt-1 font-semibold">
                {dateTime(
                  run.completedAt,
                )}
              </p>
            </div>
          </div>
        </section>

        {summary ? (
          <section>
            <h2 className="text-xl font-semibold text-slate-950">
              Performance summary
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <article className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Installed capacity
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {metric(
                    summary.installedCapacityKw,
                  )}{" "}
                  kWp
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Daily energy
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {metric(
                    summary.dailyEnergyKwh,
                  )}{" "}
                  kWh
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Specific yield
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {metric(
                    summary.specificYieldKwhPerKw,
                  )}{" "}
                  kWh/kWp
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Site type
                </p>

                <p className="mt-2 text-xl font-semibold">
                  {summary.siteType.replaceAll(
                    "_",
                    " ",
                  )}
                </p>
              </article>

              {summary.cropDliMolM2 !=
              null ? (
                <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-xs uppercase tracking-wide text-emerald-700">
                    Crop DLI
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-emerald-950">
                    {metric(
                      summary.cropDliMolM2,
                    )}{" "}
                    mol/m²/day
                  </p>
                </article>
              ) : null}

              {summary.estimatedCropYieldPercent !=
              null ? (
                <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-xs uppercase tracking-wide text-emerald-700">
                    Estimated crop yield
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-emerald-950">
                    {metric(
                      summary.estimatedCropYieldPercent,
                      1,
                    )}
                    %
                  </p>
                </article>
              ) : null}

              {summary.landEquivalentRatio !=
              null ? (
                <article className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                  <p className="text-xs uppercase tracking-wide text-blue-700">
                    Land Equivalent Ratio
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-blue-950">
                    {metric(
                      summary.landEquivalentRatio,
                    )}
                  </p>
                </article>
              ) : null}

              {summary.moduleCount !=
              null ? (
                <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="text-xs uppercase tracking-wide text-amber-700">
                    Rooftop modules
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-amber-950">
                    {
                      summary.moduleCount
                    }
                  </p>
                </article>
              ) : null}
            </div>
          </section>
        ) : null}

        <SimulationStudyProvenance
          run={
            run
          }
          reproducibility={
            reproducibility
          }
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-slate-950">
            Hourly environmental and PV response
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Persisted GHI, plane-of-array
            irradiance and PV output for this run.
          </p>

          <div className="mt-5">
            <SimulationHourlyChart
              data={
                run.hourly
              }
            />
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">
              Execution provenance
            </h2>

            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p className="break-all">
                Scenario:{" "}
                {run.scenarioId ??
                  "Not available"}
              </p>

              <p className="break-all">
                Site:{" "}
                {
                  run.siteId
                }
              </p>

              <p className="break-all">
                Site version:{" "}
                {
                  run.siteVersionId
                }
              </p>

              <p>
                Site schema:{" "}
                {
                  run.siteSchemaVersion
                }
              </p>

              <p>
                Weather adapter:{" "}
                {run.weatherAdapterVersion ??
                  "Not available"}
              </p>

              <p>
                Controller:{" "}
                {run.controllerVersion ??
                  "Not applicable"}
              </p>
            </div>
          </article>

          <article
            className={`rounded-2xl border p-5 ${
              reproducibility.verified
                ? "border-emerald-200 bg-emerald-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <h2 className="text-lg font-semibold">
              Reproducibility
            </h2>

            <p className="mt-2 text-2xl font-semibold">
              {reproducibility.verified
                ? "Verified"
                : "Verification failed"}
            </p>

            <div className="mt-4 space-y-2 text-sm">
              <p className="break-all">
                Stored input fingerprint:
                <br />
                <span className="font-mono text-xs">
                  {reproducibility.inputFingerprint ??
                    "Not available"}
                </span>
              </p>

              <p className="break-all">
                Recomputed fingerprint:
                <br />
                <span className="font-mono text-xs">
                  {reproducibility.recomputedInputFingerprint ??
                    "Not available"}
                </span>
              </p>
            </div>

            <div className="mt-4 space-y-2">
              {reproducibility.checks.map(
                (
                  check,
                ) => (
                  <div
                    key={
                      check.key
                    }
                    className="flex items-center justify-between gap-3 rounded-lg bg-white/70 px-3 py-2 text-sm"
                  >
                    <span>
                      {
                        check.label
                      }
                    </span>

                    <span
                      className={
                        check.passed
                          ? "font-medium text-emerald-700"
                          : "font-medium text-red-700"
                      }
                    >
                      {check.passed
                        ? "Pass"
                        : "Fail"}
                    </span>
                  </div>
                ),
              )}
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">
            Persisted data coverage
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-slate-500">
                Hourly records
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {
                  run.hourly.length
                }
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Spatial results
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {
                  run.spatial.length
                }
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Reproducibility checks
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {
                  reproducibility.checks.length
                }
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
