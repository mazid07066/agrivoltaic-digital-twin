"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import type {
  Scenario,
} from "@/lib/scenarios/types";

interface SimulationRunHistoryEntry {
  id:
    string;

  projectId:
    string;

  siteId:
    string;

  siteVersionId:
    string;

  scenarioId:
    string | null;

  status:
    | "queued"
    | "running"
    | "completed"
    | "failed"
    | "cancelled";

  simulationDate:
    string;

  engineVersion:
    string;

  controllerVersion:
    string | null;

  weatherAdapterVersion:
    string | null;

  startedAt:
    string | null;

  completedAt:
    string | null;

  createdAt:
    string;

  errorMessage:
    string | null;
}

interface HistoryResponse {
  ok:
    boolean;

  runs?:
    SimulationRunHistoryEntry[];

  error?:
    string;
}

interface ExecuteResponse {
  ok:
    boolean;

  simulationRunId?:
    string;

  error?:
    string;
}

interface ScenarioSimulationRunsProps {
  scenario:
    Scenario;
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

function statusClass(
  status:
    SimulationRunHistoryEntry["status"],
): string {
  switch (
    status
  ) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "failed":
      return "border-red-200 bg-red-50 text-red-700";

    case "running":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "queued":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "cancelled":
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

async function fetchRunHistory(
  scenarioId:
    string,

  signal?:
    AbortSignal,
): Promise<
  SimulationRunHistoryEntry[]
> {
  const response =
    await fetch(
      `/api/simulation-runs?scenarioId=${encodeURIComponent(
        scenarioId,
      )}`,
      {
        method:
          "GET",

        cache:
          "no-store",

        signal,
      },
    );

  const data =
    (await response.json()) as
      HistoryResponse;

  if (
    !response.ok ||
    !data.ok
  ) {
    throw new Error(
      data.error ??
        "Run history could not be loaded.",
    );
  }

  return (
    data.runs ??
    []
  );
}

export default function ScenarioSimulationRuns({
  scenario,
}: ScenarioSimulationRunsProps) {
  const [
    runs,
    setRuns,
  ] =
    useState<
      SimulationRunHistoryEntry[]
    >([]);

  const [
    loadingHistory,
    setLoadingHistory,
  ] =
    useState(
      true,
    );

  const [
    running,
    setRunning,
  ] =
    useState(
      false,
    );

  const [
    message,
    setMessage,
  ] =
    useState(
      "",
    );

  useEffect(
    () => {
      const controller =
        new AbortController();

      fetchRunHistory(
        scenario.id,
        controller.signal,
      )
        .then(
          (
            loadedRuns,
          ) => {
            if (
              controller.signal
                .aborted
            ) {
              return;
            }

            setRuns(
              loadedRuns,
            );
          },
        )
        .catch(
          (
            error,
          ) => {
            if (
              controller.signal
                .aborted
            ) {
              return;
            }

            setMessage(
              error instanceof Error
                ? error.message
                : "Run history could not be loaded.",
            );
          },
        )
        .finally(
          () => {
            if (
              !controller.signal
                .aborted
            ) {
              setLoadingHistory(
                false,
              );
            }
          },
        );

      return () => {
        controller.abort();
      };
    },
    [
      scenario.id,
    ],
  );

  async function loadRuns() {
    setLoadingHistory(
      true,
    );

    try {
      const loadedRuns =
        await fetchRunHistory(
          scenario.id,
        );

      setRuns(
        loadedRuns,
      );
    } catch (
      error
    ) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Run history could not be loaded.",
      );
    } finally {
      setLoadingHistory(
        false,
      );
    }
  }

  async function runScenario() {
    if (
      running
    ) {
      return;
    }

    setRunning(
      true,
    );

    setMessage(
      "Executing and preserving simulation run...",
    );

    try {
      const response =
        await fetch(
          "/api/simulation-runs",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                scenarioId:
                  scenario.id,
              }),
          },
        );

      const data =
        (await response.json()) as
          ExecuteResponse;

      if (
        !response.ok ||
        !data.ok ||
        !data.simulationRunId
      ) {
        throw new Error(
          data.error ??
            "Scenario execution failed.",
        );
      }

      setMessage(
        "Simulation completed and persisted successfully.",
      );

      const updatedRuns =
        await fetchRunHistory(
          scenario.id,
        );

      setRuns(
        updatedRuns,
      );
    } catch (
      error
    ) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Scenario execution failed.",
      );
    } finally {
      setRunning(
        false,
      );
    }
  }

  const latestRun =
    runs[0] ??
    null;

  return (
    <section className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-700">
            Digital-twin execution
          </p>

          <p className="mt-1 text-sm text-slate-700">
            Execute this saved scenario and
            preserve its results as an immutable
            simulation run.
          </p>
        </div>

        {scenario.status !==
        "archived" ? (
          <button
            type="button"
            onClick={
              runScenario
            }
            disabled={
              running
            }
            className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {running
              ? "Running..."
              : "Run scenario"}
          </button>
        ) : null}
      </div>

      {message ? (
        <div className="mt-3 rounded-lg border border-indigo-100 bg-white px-3 py-2 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      <div className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-slate-900">
            Run history
          </p>

          <button
            type="button"
            onClick={
              loadRuns
            }
            disabled={
              loadingHistory
            }
            className="text-sm font-medium text-indigo-700 disabled:opacity-50"
          >
            {loadingHistory
              ? "Loading..."
              : "Refresh"}
          </button>
        </div>

        {!loadingHistory &&
        runs.length ===
          0 ? (
          <div className="mt-3 rounded-lg bg-white p-3 text-sm text-slate-600">
            No persisted simulation runs yet.
          </div>
        ) : null}

        {latestRun ? (
          <div className="mt-3 rounded-xl border border-indigo-100 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">
                    Latest run
                  </p>

                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(
                      latestRun.status,
                    )}`}
                  >
                    {
                      latestRun.status
                    }
                  </span>
                </div>

                <div className="mt-2 space-y-1 text-sm text-slate-600">
                  <p>
                    Simulation date:{" "}
                    {
                      latestRun.simulationDate
                    }
                  </p>

                  <p>
                    Engine:{" "}
                    {
                      latestRun.engineVersion
                    }
                  </p>

                  <p>
                    Created:{" "}
                    {dateTime(
                      latestRun.createdAt,
                    )}
                  </p>
                </div>
              </div>

              {latestRun.status ===
              "completed" ? (
                <Link
                  href={`/simulation-runs/${encodeURIComponent(
                    latestRun.id,
                  )}`}
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700"
                >
                  View results
                </Link>
              ) : null}
            </div>

            {latestRun.errorMessage ? (
              <div className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                {
                  latestRun.errorMessage
                }
              </div>
            ) : null}
          </div>
        ) : null}

        {runs.length >
        1 ? (
          <details className="mt-3 rounded-xl border border-indigo-100 bg-white">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-800">
              Previous runs (
              {runs.length -
                1}
              )
            </summary>

            <div className="border-t border-slate-100">
              {runs
                .slice(
                  1,
                )
                .map(
                  (
                    run,
                  ) => (
                    <div
                      key={
                        run.id
                      }
                      className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
                    >
                      <div className="text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {
                              run.simulationDate
                            }
                          </span>

                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs ${statusClass(
                              run.status,
                            )}`}
                          >
                            {
                              run.status
                            }
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          {dateTime(
                            run.createdAt,
                          )}
                        </p>
                      </div>

                      {run.status ===
                      "completed" ? (
                        <Link
                          href={`/simulation-runs/${encodeURIComponent(
                            run.id,
                          )}`}
                          className="text-sm font-medium text-indigo-700"
                        >
                          Results
                        </Link>
                      ) : null}
                    </div>
                  ),
                )}
            </div>
          </details>
        ) : null}
      </div>
    </section>
  );
}
