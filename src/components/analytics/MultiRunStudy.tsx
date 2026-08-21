"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import McdaDecisionSupport from "@/components/analytics/McdaDecisionSupport";

import type {
  MultiRunAnalyticsResult,
  StudyCompatibilityReport,
} from "@/lib/analytics/types";

interface AnalyticsRunOption {
  runId:
    string;

  scenarioId:
    string | null;

  scenarioName:
    string;

  scenarioType:
    string;

  projectId:
    string;

  siteId:
    string;

  simulationDate:
    string;

  siteName:
    string;

  siteType:
    string;

  engineKind:
    string;

  engineVersion:
    string;

  environmentFingerprint:
    string | null;

  isBaseline:
    boolean;
}

interface MultiRunStudyProps {
  runs:
    AnalyticsRunOption[];
}

interface StudyResponse {
  ok:
    boolean;

  analytics?:
    MultiRunAnalyticsResult;

  error?:
    string;
}

interface CompatibilityResponse {
  ok:
    boolean;

  compatibility?:
    StudyCompatibilityReport;

  error?:
    string;
}

type BaselineFilter =
  | "all"
  | "baseline"
  | "alternative";

function numberText(
  value:
    number | null,

  digits = 2,
): string {
  return value ===
    null
    ? "N/A"
    : value.toFixed(
        digits,
      );
}

function uniqueValues(
  values:
    string[],
): string[] {
  return [
    ...new Set(
      values,
    ),
  ].sort(
    (
      first,
      second,
    ) =>
      first.localeCompare(
        second,
      ),
  );
}

function shortId(
  value:
    string,
): string {
  return value.length >
    12
    ? `${value.slice(
        0,
        12,
      )}…`
    : value;
}

export default function MultiRunStudy({
  runs,
}: MultiRunStudyProps) {
  const [
    selectedRunIds,
    setSelectedRunIds,
  ] =
    useState<
      string[]
    >([]);

  const [
    projectFilter,
    setProjectFilter,
  ] =
    useState(
      "all",
    );

  const [
    siteFilter,
    setSiteFilter,
  ] =
    useState(
      "all",
    );

  const [
    scenarioTypeFilter,
    setScenarioTypeFilter,
  ] =
    useState(
      "all",
    );

  const [
    siteTypeFilter,
    setSiteTypeFilter,
  ] =
    useState(
      "all",
    );

  const [
    engineFilter,
    setEngineFilter,
  ] =
    useState(
      "all",
    );

  const [
    baselineFilter,
    setBaselineFilter,
  ] =
    useState<
      BaselineFilter
    >(
      "all",
    );

  const [
    loadingCompatibility,
    setLoadingCompatibility,
  ] =
    useState(
      false,
    );

  const [
    compatibility,
    setCompatibility,
  ] =
    useState<
      StudyCompatibilityReport | null
    >(
      null,
    );

  const [
    loading,
    setLoading,
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

  const [
    analytics,
    setAnalytics,
  ] =
    useState<
      MultiRunAnalyticsResult | null
    >(
      null,
    );

  const projects =
    useMemo(
      () =>
        uniqueValues(
          runs.map(
            (
              run,
            ) =>
              run.projectId,
          ),
        ),
      [
        runs,
      ],
    );

  const sites =
    useMemo(
      () =>
        uniqueValues(
          runs
            .filter(
              (
                run,
              ) =>
                projectFilter ===
                  "all" ||
                run.projectId ===
                  projectFilter,
            )
            .map(
              (
                run,
              ) =>
                run.siteId,
            ),
        ),
      [
        runs,
        projectFilter,
      ],
    );

  const scenarioTypes =
    useMemo(
      () =>
        uniqueValues(
          runs.map(
            (
              run,
            ) =>
              run.scenarioType,
          ),
        ),
      [
        runs,
      ],
    );

  const siteTypes =
    useMemo(
      () =>
        uniqueValues(
          runs.map(
            (
              run,
            ) =>
              run.siteType,
          ),
        ),
      [
        runs,
      ],
    );

  const engineKinds =
    useMemo(
      () =>
        uniqueValues(
          runs.map(
            (
              run,
            ) =>
              run.engineKind,
          ),
        ),
      [
        runs,
      ],
    );

  const visibleRuns =
    useMemo(
      () =>
        runs.filter(
          (
            run,
          ) => {
            if (
              projectFilter !==
                "all" &&
              run.projectId !==
                projectFilter
            ) {
              return false;
            }

            if (
              siteFilter !==
                "all" &&
              run.siteId !==
                siteFilter
            ) {
              return false;
            }

            if (
              scenarioTypeFilter !==
                "all" &&
              run.scenarioType !==
                scenarioTypeFilter
            ) {
              return false;
            }

            if (
              siteTypeFilter !==
                "all" &&
              run.siteType !==
                siteTypeFilter
            ) {
              return false;
            }

            if (
              engineFilter !==
                "all" &&
              run.engineKind !==
                engineFilter
            ) {
              return false;
            }

            if (
              baselineFilter ===
                "baseline" &&
              !run.isBaseline
            ) {
              return false;
            }

            if (
              baselineFilter ===
                "alternative" &&
              run.isBaseline
            ) {
              return false;
            }

            return true;
          },
        ),
      [
        runs,
        projectFilter,
        siteFilter,
        scenarioTypeFilter,
        siteTypeFilter,
        engineFilter,
        baselineFilter,
      ],
    );

  function invalidateStudyResult() {
    setCompatibility(
      null,
    );

    setAnalytics(
      null,
    );

    setMessage(
      "",
    );
  }

  function toggleRun(
    runId:
      string,
  ) {
    invalidateStudyResult();

    setSelectedRunIds(
      (
        current,
      ) =>
        current.includes(
          runId,
        )
          ? current.filter(
              (
                id,
              ) =>
                id !==
                runId,
            )
          : [
              ...current,
              runId,
            ],
    );
  }

  function selectVisible() {
    invalidateStudyResult();

    setSelectedRunIds(
      (
        current,
      ) =>
        [
          ...new Set([
            ...current,

            ...visibleRuns.map(
              (
                run,
              ) =>
                run.runId,
            ),
          ]),
        ],
    );
  }

  function clearSelection() {
    setSelectedRunIds(
      [],
    );

    invalidateStudyResult();
  }

  function resetFilters() {
    setProjectFilter(
      "all",
    );

    setSiteFilter(
      "all",
    );

    setScenarioTypeFilter(
      "all",
    );

    setSiteTypeFilter(
      "all",
    );

    setEngineFilter(
      "all",
    );

    setBaselineFilter(
      "all",
    );
  }

  async function checkCompatibility() {
    if (
      selectedRunIds.length <
      2
    ) {
      setMessage(
        "Select at least two persisted runs.",
      );

      return;
    }

    setLoadingCompatibility(
      true,
    );

    setCompatibility(
      null,
    );

    setAnalytics(
      null,
    );

    setMessage(
      "",
    );

    try {
      const response =
        await fetch(
          "/api/analytics/compatibility",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                runIds:
                  selectedRunIds,
              }),
          },
        );

      const data =
        (await response.json()) as
          CompatibilityResponse;

      if (
        !response.ok ||
        !data.ok ||
        !data.compatibility
      ) {
        throw new Error(
          data.error ??
            "Compatibility assessment failed.",
        );
      }

      setCompatibility(
        data.compatibility,
      );
    } catch (
      error
    ) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Compatibility assessment failed.",
      );
    } finally {
      setLoadingCompatibility(
        false,
      );
    }
  }

  async function analyzeStudy() {
    if (
      selectedRunIds.length <
      2
    ) {
      setMessage(
        "Select at least two persisted runs.",
      );

      return;
    }

    if (
      !compatibility
    ) {
      setMessage(
        "Check study compatibility before running multi-run analytics.",
      );

      return;
    }

    if (
      !compatibility.compatible
    ) {
      setMessage(
        "This study set contains hard scientific incompatibilities and cannot proceed to formal analysis.",
      );

      return;
    }

    setLoading(
      true,
    );

    setMessage(
      "",
    );

    setAnalytics(
      null,
    );

    try {
      const response =
        await fetch(
          "/api/analytics/study",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                runIds:
                  selectedRunIds,
              }),
          },
        );

      const data =
        (await response.json()) as
          StudyResponse;

      if (
        !response.ok ||
        !data.ok ||
        !data.analytics
      ) {
        throw new Error(
          data.error ??
            "Multi-run analytics failed.",
        );
      }

      setAnalytics(
        data.analytics,
      );
    } catch (
      error
    ) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Multi-run analytics failed.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }

  return (
    <section className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
            Multi-run study
          </p>

          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Study-set builder
          </h2>

          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Filter persisted simulation evidence,
            construct a study set and verify
            scientific compatibility before
            analytics or MCDA.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={
              selectVisible
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            Select visible
          </button>

          <button
            type="button"
            onClick={
              clearSelection
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            Clear selection
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-900">
              Study filters
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Filters affect the run browser only;
              already selected runs remain selected.
            </p>
          </div>

          <button
            type="button"
            onClick={
              resetFilters
            }
            className="text-sm font-medium text-violet-700"
          >
            Reset filters
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <label>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Project
            </span>

            <select
              value={
                projectFilter
              }
              onChange={
                (
                  event,
                ) => {
                  setProjectFilter(
                    event.target.value,
                  );

                  setSiteFilter(
                    "all",
                  );
                }
              }
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="all">
                All projects
              </option>

              {projects.map(
                (
                  projectId,
                ) => (
                  <option
                    key={
                      projectId
                    }
                    value={
                      projectId
                    }
                  >
                    {shortId(
                      projectId,
                    )}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Site
            </span>

            <select
              value={
                siteFilter
              }
              onChange={
                (
                  event,
                ) =>
                  setSiteFilter(
                    event.target.value,
                  )
              }
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="all">
                All sites
              </option>

              {sites.map(
                (
                  siteId,
                ) => {
                  const run =
                    runs.find(
                      (
                        item,
                      ) =>
                        item.siteId ===
                        siteId,
                    );

                  return (
                    <option
                      key={
                        siteId
                      }
                      value={
                        siteId
                      }
                    >
                      {run?.siteName ??
                        shortId(
                          siteId,
                        )}
                    </option>
                  );
                },
              )}
            </select>
          </label>

          <label>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Scenario type
            </span>

            <select
              value={
                scenarioTypeFilter
              }
              onChange={
                (
                  event,
                ) =>
                  setScenarioTypeFilter(
                    event.target.value,
                  )
              }
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="all">
                All scenario types
              </option>

              {scenarioTypes.map(
                (
                  value,
                ) => (
                  <option
                    key={
                      value
                    }
                    value={
                      value
                    }
                  >
                    {value.replaceAll(
                      "_",
                      " ",
                    )}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Site type
            </span>

            <select
              value={
                siteTypeFilter
              }
              onChange={
                (
                  event,
                ) =>
                  setSiteTypeFilter(
                    event.target.value,
                  )
              }
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="all">
                All site types
              </option>

              {siteTypes.map(
                (
                  value,
                ) => (
                  <option
                    key={
                      value
                    }
                    value={
                      value
                    }
                  >
                    {value.replaceAll(
                      "_",
                      " ",
                    )}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Engine
            </span>

            <select
              value={
                engineFilter
              }
              onChange={
                (
                  event,
                ) =>
                  setEngineFilter(
                    event.target.value,
                  )
              }
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="all">
                All engines
              </option>

              {engineKinds.map(
                (
                  value,
                ) => (
                  <option
                    key={
                      value
                    }
                    value={
                      value
                    }
                  >
                    {value}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Study role
            </span>

            <select
              value={
                baselineFilter
              }
              onChange={
                (
                  event,
                ) =>
                  setBaselineFilter(
                    event.target
                      .value as BaselineFilter,
                  )
              }
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="all">
                Baselines + alternatives
              </option>

              <option value="baseline">
                Baselines only
              </option>

              <option value="alternative">
                Alternatives only
              </option>
            </select>
          </label>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {
            visibleRuns.length
          }{" "}
          of{" "}
          {
            runs.length
          }{" "}
          completed persisted runs visible
        </p>
      </div>

      {runs.length === 0 ? (
        <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          No completed persisted runs are
          currently available.
        </p>
      ) : visibleRuns.length ===
        0 ? (
        <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No persisted runs match the active
          filters.
        </p>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleRuns.map(
            (
              run,
            ) => {
              const selected =
                selectedRunIds.includes(
                  run.runId,
                );

              return (
                <label
                  key={
                    run.runId
                  }
                  className={[
                    "cursor-pointer rounded-xl border p-4 transition",

                    selected
                      ? "border-violet-500 bg-violet-50"
                      : "border-slate-200 bg-slate-50",
                  ].join(
                    " ",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={
                        selected
                      }
                      onChange={
                        () =>
                          toggleRun(
                            run.runId,
                          )
                      }
                      className="mt-1"
                    />

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900">
                          {
                            run.scenarioName
                          }
                        </p>

                        {run.isBaseline ? (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            Baseline
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        {
                          run.siteName
                        }
                        {" · "}
                        {
                          run.simulationDate
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {
                          run.scenarioType
                        }
                        {" · "}
                        {
                          run.siteType
                        }
                        {" · "}
                        {
                          run.engineKind
                        }
                      </p>

                      <p className="mt-1 truncate font-mono text-[11px] text-slate-400">
                        {
                          run.runId
                        }
                      </p>
                    </div>
                  </div>
                </label>
              );
            },
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={
            checkCompatibility
          }
          disabled={
            loadingCompatibility ||
            selectedRunIds.length <
              2
          }
          className="rounded-xl border border-violet-300 bg-violet-50 px-4 py-2 font-medium text-violet-800 disabled:opacity-50"
        >
          {loadingCompatibility
            ? "Checking..."
            : "Check compatibility"}
        </button>

        <button
          type="button"
          onClick={
            analyzeStudy
          }
          disabled={
            loading ||
            selectedRunIds.length <
              2 ||
            !compatibility ||
            !compatibility.compatible
          }
          className="rounded-xl bg-violet-700 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {loading
            ? "Analyzing..."
            : "Analyze study set"}
        </button>

        <span className="text-sm text-slate-500">
          {
            selectedRunIds.length
          }{" "}
          selected
        </span>
      </div>

      {compatibility ? (
        <div
          className={[
            "mt-5 rounded-2xl border p-4",

            compatibility.level ===
            "compatible"
              ? "border-emerald-200 bg-emerald-50"
              : compatibility.level ===
                  "warning"
                ? "border-amber-200 bg-amber-50"
                : "border-red-200 bg-red-50",
          ].join(
            " ",
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Scientific compatibility
              </p>

              <h3 className="mt-1 text-lg font-semibold text-slate-950">
                {compatibility.level ===
                "compatible"
                  ? "Compatible study set"
                  : compatibility.level ===
                      "warning"
                    ? "Compatible with warnings"
                    : "Incompatible study set"}
              </h3>
            </div>

            <span
              className={[
                "rounded-full px-3 py-1 text-sm font-semibold",

                compatibility.compatible
                  ? compatibility.level ===
                    "warning"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                  : "bg-red-100 text-red-800",
              ].join(
                " ",
              )}
            >
              {
                compatibility.level
              }
            </span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <div className="rounded-lg bg-white/70 p-3">
              <p className="text-xs text-slate-500">
                Projects
              </p>

              <p className="mt-1 font-semibold">
                {
                  compatibility.projectCount
                }
              </p>
            </div>

            <div className="rounded-lg bg-white/70 p-3">
              <p className="text-xs text-slate-500">
                Sites
              </p>

              <p className="mt-1 font-semibold">
                {
                  compatibility.siteCount
                }
              </p>
            </div>

            <div className="rounded-lg bg-white/70 p-3">
              <p className="text-xs text-slate-500">
                Site types
              </p>

              <p className="mt-1 font-semibold">
                {
                  compatibility.siteTypeCount
                }
              </p>
            </div>

            <div className="rounded-lg bg-white/70 p-3">
              <p className="text-xs text-slate-500">
                Simulation dates
              </p>

              <p className="mt-1 font-semibold">
                {
                  compatibility.simulationDateCount
                }
              </p>
            </div>
          </div>

          {compatibility.issues.length >
          0 ? (
            <div className="mt-4 space-y-2">
              {compatibility.issues.map(
                (
                  issue,
                ) => (
                  <div
                    key={
                      issue.key
                    }
                    className="rounded-xl bg-white/80 p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={[
                          "rounded-full px-2 py-0.5 text-xs font-semibold",

                          issue.level ===
                          "incompatible"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700",
                        ].join(
                          " ",
                        )}
                      >
                        {
                          issue.level
                        }
                      </span>

                      <p className="font-medium text-slate-900">
                        {
                          issue.label
                        }
                      </p>
                    </div>

                    <p className="mt-1 text-sm text-slate-600">
                      {
                        issue.explanation
                      }
                    </p>
                  </div>
                ),
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-emerald-800">
              No scientific compatibility issues
              were detected.
            </p>
          )}
        </div>
      ) : null}

      {message ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {
            message
          }
        </div>
      ) : null}

      {analytics ? (
        <div className="mt-6 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-xl bg-violet-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                Runs analyzed
              </p>

              <p className="mt-1 text-2xl font-semibold text-violet-950">
                {
                  analytics.runCount
                }
              </p>
            </article>

            <article className="rounded-xl bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Policy pass
              </p>

              <p className="mt-1 text-2xl font-semibold text-emerald-950">
                {
                  analytics.records.filter(
                    (
                      record,
                    ) =>
                      record.policyEvaluation
                        .overallStatus ===
                      "pass",
                  ).length
                }
              </p>
            </article>

            <article className="rounded-xl bg-red-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                Policy fail
              </p>

              <p className="mt-1 text-2xl font-semibold text-red-950">
                {
                  analytics.records.filter(
                    (
                      record,
                    ) =>
                      record.policyEvaluation
                        .overallStatus ===
                      "fail",
                  ).length
                }
              </p>
            </article>

            <article className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                KPI definitions
              </p>

              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {
                  analytics.metricStatistics
                    .length
                }
              </p>
            </article>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-4 py-3">
                    Metric
                  </th>

                  <th className="px-4 py-3 text-right">
                    Minimum
                  </th>

                  <th className="px-4 py-3 text-right">
                    Mean
                  </th>

                  <th className="px-4 py-3 text-right">
                    Maximum
                  </th>

                  <th className="px-4 py-3">
                    Best run
                  </th>
                </tr>
              </thead>

              <tbody>
                {analytics.metricStatistics.map(
                  (
                    metric,
                  ) => (
                    <tr
                      key={
                        metric.key
                      }
                      className="border-b border-slate-100 bg-white"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {
                          metric.label
                        }

                        {metric.unit ? (
                          <span className="ml-1 text-xs font-normal text-slate-500">
                            ({
                              metric.unit
                            })
                          </span>
                        ) : null}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {numberText(
                          metric.minimum,
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {numberText(
                          metric.mean,
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {numberText(
                          metric.maximum,
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {metric.bestRunId ? (
                          <Link
                            href={`/simulation-runs/${metric.bestRunId}`}
                            className="font-mono text-xs text-violet-700"
                          >
                            {shortId(
                              metric.bestRunId,
                            )}
                          </Link>
                        ) : (
                          <span className="text-slate-400">
                            N/A
                          </span>
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-4 py-3">
                    Scenario
                  </th>

                  {analytics.metricStatistics.map(
                    (
                      metric,
                    ) => (
                      <th
                        key={
                          metric.key
                        }
                        className="whitespace-nowrap px-4 py-3 text-right"
                      >
                        {
                          metric.label
                        }
                      </th>
                    ),
                  )}

                  <th className="px-4 py-3 text-center">
                    Policy
                  </th>
                </tr>
              </thead>

              <tbody>
                {analytics.records.map(
                  (
                    studyRecord,
                  ) => (
                    <tr
                      key={
                        studyRecord.run
                          .identity
                          .runId
                      }
                      className="border-b border-slate-100 bg-white"
                    >
                      <td className="min-w-52 px-4 py-3">
                        <p className="font-medium text-slate-900">
                          {
                            studyRecord.run
                              .identity
                              .scenarioName
                          }
                        </p>

                        <Link
                          href={`/simulation-runs/${studyRecord.run.identity.runId}`}
                          className="mt-1 block font-mono text-xs text-violet-700"
                        >
                          {shortId(
                            studyRecord.run
                              .identity
                              .runId,
                          )}
                        </Link>
                      </td>

                      {analytics.metricStatistics.map(
                        (
                          metric,
                        ) => {
                          const value =
                            studyRecord.run
                              .summary[
                              metric.key
                            ];

                          return (
                            <td
                              key={
                                metric.key
                              }
                              className="whitespace-nowrap px-4 py-3 text-right"
                            >
                              {typeof value ===
                                "number"
                                ? numberText(
                                    value,
                                  )
                                : "N/A"}
                            </td>
                          );
                        },
                      )}

                      <td className="px-4 py-3 text-center">
                        <span
                          className={[
                            "rounded-full px-2.5 py-1 text-xs font-semibold",

                            studyRecord
                              .policyEvaluation
                              .overallStatus ===
                            "pass"
                              ? "bg-emerald-100 text-emerald-700"
                              : studyRecord
                                    .policyEvaluation
                                    .overallStatus ===
                                  "fail"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-600",
                          ].join(
                            " ",
                          )}
                        >
                          {
                            studyRecord
                              .policyEvaluation
                              .overallStatus
                          }
                        </span>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
          <McdaDecisionSupport
            analytics={
              analytics
            }
          />
        </div>
      ) : null}
    </section>
  );
}
