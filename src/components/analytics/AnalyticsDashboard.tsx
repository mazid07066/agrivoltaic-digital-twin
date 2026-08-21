"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import MultiRunStudy from "./MultiRunStudy";

import type {
  PolicyEvaluationResult,
  RunComparisonResult,
} from "@/lib/analytics/types";

interface RunListEntry {
  runId:
    string;

  scenarioId:
    string | null;

  scenarioName:
    string;

  scenarioType:
    string;

  isBaseline:
    boolean;

  projectId:
    string;

  siteId:
    string;

  siteName:
    string;

  siteType:
    string;

  engineKind:
    string;

  simulationDate:
    string;

  engineVersion:
    string;

  environmentFingerprint:
    string | null;

  createdAt:
    string;

  status:
    string;
}

interface RunListResponse {
  ok:
    boolean;

  runs?:
    RunListEntry[];

  error?:
    string;
}

interface ComparisonResponse {
  ok:
    boolean;

  comparison?:
    RunComparisonResult;

  policyEvaluation?: {
    reference:
      PolicyEvaluationResult;

    alternative:
      PolicyEvaluationResult;
  };

  error?:
    string;
}

function numberText(
  value:
    number | null,

  digits = 2,
): string {
  return value === null
    ? "N/A"
    : value.toFixed(
        digits,
      );
}

function signedNumber(
  value:
    number | null,

  digits = 2,
): string {
  if (value === null) {
    return "N/A";
  }

  const formatted =
    value.toFixed(
      digits,
    );

  return value > 0
    ? `+${formatted}`
    : formatted;
}

export default function AnalyticsDashboard() {
  const [
    runs,
    setRuns,
  ] =
    useState<
      RunListEntry[]
    >([]);

  const [
    referenceRunId,
    setReferenceRunId,
  ] =
    useState(
      "",
    );

  const [
    alternativeRunId,
    setAlternativeRunId,
  ] =
    useState(
      "",
    );

  const [
    comparison,
    setComparison,
  ] =
    useState<
      RunComparisonResult | null
    >(null);


  const [
    policyEvaluation,
    setPolicyEvaluation,
  ] =
    useState<{
      reference:
        PolicyEvaluationResult;

      alternative:
        PolicyEvaluationResult;
    } | null>(
      null,
    );

  const [
    loadingRuns,
    setLoadingRuns,
  ] =
    useState(
      true,
    );

  const [
    comparing,
    setComparing,
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

      fetch(
        "/api/analytics/runs",
        {
          cache:
            "no-store",

          signal:
            controller.signal,
        },
      )
        .then(
          async (
            response,
          ) => {
            const data =
              (await response.json()) as
                RunListResponse;

            if (
              !response.ok ||
              !data.ok
            ) {
              throw new Error(
                data.error ??
                  "Analytics runs could not be loaded.",
              );
            }

            return data.runs ??
              [];
          },
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

            const baseline =
              loadedRuns.find(
                (run) =>
                  run.isBaseline,
              );

            const reference =
              baseline ??
              loadedRuns[0];

            const alternative =
              loadedRuns.find(
                (run) =>
                  run.runId !==
                  reference?.runId,
              );

            if (reference) {
              setReferenceRunId(
                reference.runId,
              );
            }

            if (alternative) {
              setAlternativeRunId(
                alternative.runId,
              );
            }
          },
        )
        .catch(
          (
            error,
          ) => {
            if (
              !controller.signal
                .aborted
            ) {
              setMessage(
                error instanceof Error
                  ? error.message
                  : "Analytics runs could not be loaded.",
              );
            }
          },
        )
        .finally(
          () => {
            if (
              !controller.signal
                .aborted
            ) {
              setLoadingRuns(
                false,
              );
            }
          },
        );

      return () => {
        controller.abort();
      };
    },
    [],
  );

  async function compareRuns() {
    if (
      !referenceRunId ||
      !alternativeRunId
    ) {
      setMessage(
        "Select both a reference and an alternative run.",
      );

      return;
    }

    if (
      referenceRunId ===
      alternativeRunId
    ) {
      setMessage(
        "Reference and alternative runs must be different.",
      );

      return;
    }

    setComparing(
      true,
    );

    setComparison(
      null,
    );

    setPolicyEvaluation(
      null,
    );

    setMessage(
      "",
    );

    try {
      const response =
        await fetch(
          `/api/analytics/compare?referenceRunId=${encodeURIComponent(
            referenceRunId,
          )}&alternativeRunId=${encodeURIComponent(
            alternativeRunId,
          )}`,
          {
            cache:
              "no-store",
          },
        );

      const data =
        (await response.json()) as
          ComparisonResponse;

      if (
        !response.ok ||
        !data.ok ||
        !data.comparison ||
        !data.policyEvaluation
      ) {
        throw new Error(
          data.error ??
            "Run comparison failed.",
        );
      }

      setComparison(
        data.comparison,
      );

      setPolicyEvaluation(
        data.policyEvaluation,
      );
    } catch (
      error
    ) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Run comparison failed.",
      );
    } finally {
      setComparing(
        false,
      );
    }
  }

  return (
    <div className="space-y-6">
      <MultiRunStudy
        runs={
          runs.map(
            (
              run,
            ) => ({
              runId:
                run.runId,

              scenarioId:
                run.scenarioId,

              scenarioName:
                run.scenarioName,

              scenarioType:
                run.scenarioType,

              projectId:
                run.projectId,

              siteId:
                run.siteId,

              simulationDate:
                run.simulationDate,

              siteName:
                run.siteName,

              siteType:
                run.siteType,

              engineKind:
                run.engineKind,

              engineVersion:
                run.engineVersion,

              environmentFingerprint:
                run.environmentFingerprint,

              isBaseline:
                run.isBaseline,
            }),
          )
        }
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
            Persisted run comparison
          </p>

          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Reference vs alternative
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Compare immutable Phase 9C simulation
            runs without rerunning the digital
            twin.
          </p>
        </div>

        {loadingRuns ? (
          <p className="mt-5 text-sm text-slate-500">
            Loading persisted runs...
          </p>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <label>
              <span className="text-sm font-medium text-slate-700">
                Reference / baseline run
              </span>

              <select
                value={
                  referenceRunId
                }
                onChange={
                  (
                    event,
                  ) =>
                    setReferenceRunId(
                      event.target.value,
                    )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              >
                <option value="">
                  Select reference run
                </option>

                {runs.map(
                  (
                    run,
                  ) => (
                    <option
                      key={
                        run.runId
                      }
                      value={
                        run.runId
                      }
                    >
                      {run.isBaseline
                        ? "[Baseline] "
                        : ""}
                      {run.scenarioName}
                      {" · "}
                      {run.simulationDate}
                      {" · "}
                      {run.runId.slice(
                        0,
                        8,
                      )}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              <span className="text-sm font-medium text-slate-700">
                Alternative run
              </span>

              <select
                value={
                  alternativeRunId
                }
                onChange={
                  (
                    event,
                  ) =>
                    setAlternativeRunId(
                      event.target.value,
                    )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              >
                <option value="">
                  Select alternative run
                </option>

                {runs.map(
                  (
                    run,
                  ) => (
                    <option
                      key={
                        run.runId
                      }
                      value={
                        run.runId
                      }
                    >
                      {run.isBaseline
                        ? "[Baseline] "
                        : ""}
                      {run.scenarioName}
                      {" · "}
                      {run.simulationDate}
                      {" · "}
                      {run.runId.slice(
                        0,
                        8,
                      )}
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={
              compareRuns
            }
            disabled={
              comparing ||
              loadingRuns
            }
            className="rounded-xl bg-indigo-700 px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            {comparing
              ? "Comparing..."
              : "Compare runs"}
          </button>

          <span className="text-sm text-slate-500">
            {runs.length} completed persisted run
            {runs.length === 1
              ? ""
              : "s"}{" "}
            available
          </span>
        </div>

        {message ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {message}
          </div>
        ) : null}
      </section>

      {comparison ? (
        <>
          <section className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Reference
              </p>

              <h3 className="mt-2 text-lg font-semibold">
                {
                  comparison.reference
                    .identity
                    .scenarioName
                }
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                {
                  comparison.reference
                    .identity
                    .siteName
                }
                {" · "}
                {
                  comparison.reference
                    .identity
                    .simulationDate
                }
              </p>

              <p className="mt-1 font-mono text-xs text-slate-500">
                {
                  comparison.reference
                    .identity
                    .runId
                }
              </p>

              <Link
                href={`/simulation-runs/${comparison.reference.identity.runId}`}
                className="mt-4 inline-block text-sm font-medium text-indigo-700"
              >
                Open persisted results
              </Link>
            </article>

            <article className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Alternative
              </p>

              <h3 className="mt-2 text-lg font-semibold text-indigo-950">
                {
                  comparison.alternative
                    .identity
                    .scenarioName
                }
              </h3>

              <p className="mt-2 text-sm text-indigo-900/70">
                {
                  comparison.alternative
                    .identity
                    .siteName
                }
                {" · "}
                {
                  comparison.alternative
                    .identity
                    .simulationDate
                }
              </p>

              <p className="mt-1 font-mono text-xs text-indigo-800/70">
                {
                  comparison.alternative
                    .identity
                    .runId
                }
              </p>

              <Link
                href={`/simulation-runs/${comparison.alternative.identity.runId}`}
                className="mt-4 inline-block text-sm font-medium text-indigo-700"
              >
                Open persisted results
              </Link>
            </article>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  KPI comparison
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Absolute and relative changes
                  from the selected reference run.
                </p>
              </div>

              <p className="text-sm text-slate-500">
                {
                  comparison.comparableMetricCount
                }{" "}
                comparable ·{" "}
                {
                  comparison.unavailableMetricCount
                }{" "}
                unavailable
              </p>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-3">
                      Metric
                    </th>

                    <th className="px-3 py-3 text-right">
                      Reference
                    </th>

                    <th className="px-3 py-3 text-right">
                      Alternative
                    </th>

                    <th className="px-3 py-3 text-right">
                      Δ
                    </th>

                    <th className="px-3 py-3 text-right">
                      Change
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {comparison.metrics.map(
                    (
                      metric,
                    ) => (
                      <tr
                        key={
                          metric.key
                        }
                        className="border-b border-slate-100"
                      >
                        <td className="px-3 py-3 font-medium text-slate-900">
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

                        <td className="px-3 py-3 text-right">
                          {numberText(
                            metric.referenceValue,
                          )}
                        </td>

                        <td className="px-3 py-3 text-right">
                          {numberText(
                            metric.alternativeValue,
                          )}
                        </td>

                        <td className="px-3 py-3 text-right font-medium">
                          {signedNumber(
                            metric.absoluteDelta,
                          )}
                        </td>

                        <td className="px-3 py-3 text-right">
                          {metric.relativeChangePercent ===
                          null
                            ? "N/A"
                            : `${signedNumber(
                                metric.relativeChangePercent,
                              )}%`}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {policyEvaluation ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Policy Test Bench
                  </p>

                  <h2 className="mt-1 text-xl font-semibold text-slate-950">
                    Policy compliance
                  </h2>

                  <p className="mt-2 text-sm text-slate-600">
                    Policy thresholds are evaluated against persisted
                    simulation evidence only.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                {[
                  {
                    label:
                      "Reference",

                    evaluation:
                      policyEvaluation.reference,
                  },

                  {
                    label:
                      "Alternative",

                    evaluation:
                      policyEvaluation.alternative,
                  },
                ].map(
                  ({
                    label,
                    evaluation,
                  }) => (
                    <article
                      key={
                        label
                      }
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {
                              label
                            }
                          </p>

                          <p className="mt-1 font-mono text-xs text-slate-500">
                            {
                              evaluation.runId
                            }
                          </p>
                        </div>

                        <span
                          className={[
                            "rounded-full border px-3 py-1 text-sm font-semibold",

                            evaluation.overallStatus ===
                            "pass"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : evaluation.overallStatus ===
                                  "fail"
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-slate-200 bg-white text-slate-600",
                          ].join(
                            " ",
                          )}
                        >
                          {evaluation.overallStatus ===
                          "pass"
                            ? "Policy pass"
                            : evaluation.overallStatus ===
                                "fail"
                              ? "Policy fail"
                              : "Not evaluable"}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-white p-3">
                          <p className="text-xs text-slate-500">
                            Configured
                          </p>

                          <p className="mt-1 text-xl font-semibold">
                            {
                              evaluation.configuredConstraintCount
                            }
                          </p>
                        </div>

                        <div className="rounded-lg bg-emerald-50 p-3">
                          <p className="text-xs text-emerald-700">
                            Passed
                          </p>

                          <p className="mt-1 text-xl font-semibold text-emerald-800">
                            {
                              evaluation.passedConstraintCount
                            }
                          </p>
                        </div>

                        <div className="rounded-lg bg-red-50 p-3">
                          <p className="text-xs text-red-700">
                            Failed
                          </p>

                          <p className="mt-1 text-xl font-semibold text-red-800">
                            {
                              evaluation.failedConstraintCount
                            }
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {evaluation.constraints.map(
                          (
                            constraint,
                          ) => (
                            <div
                              key={
                                constraint.key
                              }
                              className="rounded-xl border border-slate-200 bg-white p-3"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium text-slate-900">
                                    {
                                      constraint.label
                                    }
                                  </p>

                                  <p className="mt-1 text-xs text-slate-500">
                                    {
                                      constraint.explanation
                                    }
                                  </p>
                                </div>

                                <span
                                  className={[
                                    "rounded-full px-2.5 py-1 text-xs font-semibold",

                                    constraint.status ===
                                    "pass"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : constraint.status ===
                                          "fail"
                                        ? "bg-red-100 text-red-800"
                                        : constraint.status ===
                                            "not_configured"
                                          ? "bg-amber-100 text-amber-800"
                                          : "bg-slate-100 text-slate-600",
                                  ].join(
                                    " ",
                                  )}
                                >
                                  {constraint.status ===
                                  "pass"
                                    ? "Pass"
                                    : constraint.status ===
                                        "fail"
                                      ? "Fail"
                                      : constraint.status ===
                                          "not_configured"
                                        ? "Not configured"
                                        : "N/A"}
                                </span>
                              </div>

                              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-slate-400">
                                    Actual
                                  </p>

                                  <p className="mt-1 text-sm font-medium text-slate-800">
                                    {constraint.actualValue ===
                                    null
                                      ? "N/A"
                                      : `${numberText(
                                          constraint.actualValue,
                                        )}${
                                          constraint.unit
                                            ? ` ${constraint.unit}`
                                            : ""
                                        }`}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs uppercase tracking-wide text-slate-400">
                                    Threshold
                                  </p>

                                  <p className="mt-1 text-sm font-medium text-slate-800">
                                    {constraint.thresholdValue ===
                                    null
                                      ? "Not configured"
                                      : `${numberText(
                                          constraint.thresholdValue,
                                        )}${
                                          constraint.unit
                                            ? ` ${constraint.unit}`
                                            : ""
                                        }`}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs uppercase tracking-wide text-slate-400">
                                    Margin
                                  </p>

                                  <p className="mt-1 text-sm font-medium text-slate-800">
                                    {constraint.margin ===
                                    null
                                      ? "N/A"
                                      : `${signedNumber(
                                          constraint.margin,
                                        )}${
                                          constraint.unit
                                            ? ` ${constraint.unit}`
                                            : ""
                                        }`}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>

                      {evaluation.policyPreset ? (
                        <p className="mt-4 text-xs text-slate-500">
                          Policy preset:{" "}
                          <strong>
                            {
                              evaluation.policyPreset
                            }
                          </strong>
                        </p>
                      ) : null}
                    </article>
                  ),
                )}
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-950">
              Evidence integrity
            </h2>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {[
                comparison.reference,
                comparison.alternative,
              ].map(
                (
                  record,
                ) => (
                  <div
                    key={
                      record.identity
                        .runId
                    }
                    className="rounded-xl bg-slate-50 p-4 text-sm"
                  >
                    <p className="font-semibold text-slate-900">
                      {
                        record.identity
                          .scenarioName
                      }
                    </p>

                    <p className="mt-2 break-all text-xs text-slate-600">
                      Execution fingerprint:
                      <br />
                      {
                        record.identity
                          .executionFingerprint ??
                        "Not available"
                      }
                    </p>

                    <p className="mt-2 break-all text-xs text-slate-600">
                      Environment fingerprint:
                      <br />
                      {
                        record.identity
                          .environmentFingerprint ??
                        "Not available"
                      }
                    </p>

                    <p className="mt-2 text-sm">
                      Reproducibility:{" "}
                      <strong>
                        {record.identity
                          .reproducibilityVerified
                          ? "Verified"
                          : "Not verified"}
                      </strong>
                    </p>
                  </div>
                ),
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
