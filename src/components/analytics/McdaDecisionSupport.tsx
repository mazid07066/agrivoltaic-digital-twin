"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import DecisionRobustness from "@/components/analytics/DecisionRobustness";

import type {
  AnalyticsMetricKey,
  McdaCriterionConfiguration,
  McdaCriterionDirection,
  McdaResult,
  MultiRunAnalyticsResult,
} from "@/lib/analytics/types";

interface McdaDecisionSupportProps {
  analytics:
    MultiRunAnalyticsResult;
}

interface McdaResponse {
  ok:
    boolean;

  result?:
    McdaResult;

  error?:
    string;
}

interface EditableCriterion {
  key:
    AnalyticsMetricKey;

  label:
    string;

  unit:
    string | null;

  enabled:
    boolean;

  direction:
    McdaCriterionDirection;

  weight:
    number;
}

function scoreText(
  value:
    number,
): string {
  return value.toFixed(
    4,
  );
}

function percentageText(
  value:
    number,
): string {
  return `${(
    value *
    100
  ).toFixed(
    1,
  )}%`;
}

export default function McdaDecisionSupport({
  analytics,
}: McdaDecisionSupportProps) {
  const initialCriteria =
    useMemo(
      (): EditableCriterion[] => {
        const eligible =
          analytics.metricStatistics.filter(
            (
              metric,
            ) =>
              metric.availableCount ===
                analytics.runCount &&
              metric.direction !==
                "neutral",
          );

        const defaultWeight =
          eligible.length >
          0
            ? 100 /
              eligible.length
            : 0;

        return analytics.metricStatistics.map(
          (
            metric,
          ) => ({
            key:
              metric.key,

            label:
              metric.label,

            unit:
              metric.unit,

            enabled:
              metric.availableCount ===
                analytics.runCount &&
              metric.direction !==
                "neutral",

            direction:
              metric.direction ===
              "cost"
                ? "cost"
                : "benefit",

            weight:
              metric.availableCount ===
                  analytics.runCount &&
              metric.direction !==
                "neutral"
                ? defaultWeight
                : 0,
          }),
        );
      },
      [
        analytics,
      ],
    );

  const [
    criteria,
    setCriteria,
  ] =
    useState<
      EditableCriterion[]
    >(
      initialCriteria,
    );

  const [
    result,
    setResult,
  ] =
    useState<
      McdaResult | null
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

  const enabledCriteria =
    criteria.filter(
      (
        criterion,
      ) =>
        criterion.enabled,
    );

  const totalWeight =
    enabledCriteria.reduce(
      (
        total,
        criterion,
      ) =>
        total +
        criterion.weight,
      0,
    );

  function updateCriterion(
    key:
      AnalyticsMetricKey,

    update:
      Partial<
        EditableCriterion
      >,
  ) {
    setCriteria(
      (
        current,
      ) =>
        current.map(
          (
            criterion,
          ) =>
            criterion.key ===
            key
              ? {
                  ...criterion,
                  ...update,
                }
              : criterion,
        ),
    );

    setResult(
      null,
    );

    setMessage(
      "",
    );
  }

  function equalWeights() {
    const selected =
      criteria.filter(
        (
          criterion,
        ) =>
          criterion.enabled,
      );

    if (
      selected.length ===
      0
    ) {
      return;
    }

    const weight =
      100 /
      selected.length;

    setCriteria(
      (
        current,
      ) =>
        current.map(
          (
            criterion,
          ) => ({
            ...criterion,

            weight:
              criterion.enabled
                ? weight
                : 0,
          }),
        ),
    );

    setResult(
      null,
    );
  }

  async function runMcda() {
    if (
      !analytics.compatibility
        .compatible
    ) {
      setMessage(
        "MCDA cannot run because this study set is scientifically incompatible.",
      );

      return;
    }

    if (
      enabledCriteria.length ===
      0
    ) {
      setMessage(
        "Select at least one MCDA criterion.",
      );

      return;
    }

    if (
      totalWeight <=
      0
    ) {
      setMessage(
        "The total MCDA weight must be greater than zero.",
      );

      return;
    }

    const requestCriteria:
      McdaCriterionConfiguration[] =
      enabledCriteria.map(
        (
          criterion,
        ) => ({
          key:
            criterion.key,

          label:
            criterion.label,

          unit:
            criterion.unit,

          direction:
            criterion.direction,

          weight:
            criterion.weight,
        }),
      );

    const runIds =
      analytics.records.map(
        (
          record,
        ) =>
          record.run
            .identity
            .runId,
      );

    setLoading(
      true,
    );

    setResult(
      null,
    );

    setMessage(
      "",
    );

    try {
      const response =
        await fetch(
          "/api/analytics/mcda",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                runIds,

                criteria:
                  requestCriteria,
              }),
          },
        );

      const data =
        (await response.json()) as
          McdaResponse;

      if (
        !response.ok ||
        !data.ok ||
        !data.result
      ) {
        throw new Error(
          data.error ??
            "MCDA evaluation failed.",
        );
      }

      setResult(
        data.result,
      );
    } catch (
      error
    ) {
      setMessage(
        error instanceof Error
          ? error.message
          : "MCDA evaluation failed.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }

  return (
    <section className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
            Multi-Criteria Decision Analysis
          </p>

          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            MCDA decision support
          </h2>

          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Configure criterion direction and
            relative importance. AgriTwin uses
            min-max normalization followed by a
            weighted-sum ranking of the selected
            persisted alternatives.
          </p>
        </div>

        <button
          type="button"
          onClick={
            equalWeights
          }
          disabled={
            enabledCriteria.length ===
            0
          }
          className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-800 disabled:opacity-50"
        >
          Equal weights
        </button>
      </div>

      {!analytics.compatibility
        .compatible ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          MCDA is disabled because the selected
          study set contains hard scientific
          incompatibilities.
        </div>
      ) : null}

      <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-4 py-3">
                Use
              </th>

              <th className="px-4 py-3">
                Criterion
              </th>

              <th className="px-4 py-3">
                Availability
              </th>

              <th className="px-4 py-3">
                Direction
              </th>

              <th className="px-4 py-3 text-right">
                Weight
              </th>
            </tr>
          </thead>

          <tbody>
            {criteria.map(
              (
                criterion,
              ) => {
                const statistics =
                  analytics.metricStatistics.find(
                    (
                      metric,
                    ) =>
                      metric.key ===
                      criterion.key,
                  );

                const complete =
                  statistics
                    ?.availableCount ===
                  analytics.runCount;

                return (
                  <tr
                    key={
                      criterion.key
                    }
                    className="border-b border-slate-100"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={
                          criterion.enabled
                        }
                        disabled={
                          !complete
                        }
                        onChange={
                          (
                            event,
                          ) =>
                            updateCriterion(
                              criterion.key,
                              {
                                enabled:
                                  event.target
                                    .checked,
                              },
                            )
                        }
                      />
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">
                        {
                          criterion.label
                        }
                      </p>

                      <p className="text-xs text-slate-500">
                        {
                          criterion.unit ??
                          "Unitless"
                        }
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={[
                          "rounded-full px-2 py-1 text-xs font-medium",

                          complete
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600",
                        ].join(
                          " ",
                        )}
                      >
                        {statistics
                          ? `${statistics.availableCount}/${analytics.runCount}`
                          : "N/A"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <select
                        value={
                          criterion.direction
                        }
                        disabled={
                          !criterion.enabled
                        }
                        onChange={
                          (
                            event,
                          ) =>
                            updateCriterion(
                              criterion.key,
                              {
                                direction:
                                  event.target
                                    .value as
                                    McdaCriterionDirection,
                              },
                            )
                        }
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 disabled:opacity-50"
                      >
                        <option value="benefit">
                          Benefit — higher is better
                        </option>

                        <option value="cost">
                          Cost — lower is better
                        </option>
                      </select>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={
                          criterion.weight
                        }
                        disabled={
                          !criterion.enabled
                        }
                        onChange={
                          (
                            event,
                          ) => {
                            const value =
                              Number(
                                event.target
                                  .value,
                              );

                            updateCriterion(
                              criterion.key,
                              {
                                weight:
                                  Number.isFinite(
                                    value,
                                  )
                                    ? Math.max(
                                        0,
                                        value,
                                      )
                                    : 0,
                              },
                            );
                          }
                        }
                        className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-right disabled:opacity-50"
                      />
                    </td>
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={
            runMcda
          }
          disabled={
            loading ||
            !analytics.compatibility
              .compatible ||
            enabledCriteria.length ===
              0 ||
            totalWeight <=
              0
          }
          className="rounded-xl bg-indigo-700 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {loading
            ? "Ranking..."
            : "Run MCDA"}
        </button>

        <span className="text-sm text-slate-500">
          {
            enabledCriteria.length
          }{" "}
          criteria · raw weight total{" "}
          {
            totalWeight.toFixed(
              2,
            )
          }
        </span>
      </div>

      {message ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {
            message
          }
        </div>
      ) : null}

      {result ? (
        <div className="mt-6 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-xl bg-indigo-50 p-4">
              <p className="text-xs uppercase tracking-wide text-indigo-700">
                Alternatives
              </p>

              <p className="mt-1 text-2xl font-semibold text-indigo-950">
                {
                  result.runCount
                }
              </p>
            </article>

            <article className="rounded-xl bg-indigo-50 p-4">
              <p className="text-xs uppercase tracking-wide text-indigo-700">
                Criteria
              </p>

              <p className="mt-1 text-2xl font-semibold text-indigo-950">
                {
                  result.criterionCount
                }
              </p>
            </article>

            <article className="rounded-xl bg-emerald-50 p-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-emerald-700">
                Highest-ranked alternative
              </p>

              <p className="mt-1 text-lg font-semibold text-emerald-950">
                {
                  result.alternatives[0]
                    ?.scenarioName
                }
              </p>

              <p className="text-sm text-emerald-800">
                Score{" "}
                {result.alternatives[0]
                  ? scoreText(
                      result.alternatives[0]
                        .score,
                    )
                  : "N/A"}
              </p>
            </article>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-4 py-3 text-center">
                    Rank
                  </th>

                  <th className="px-4 py-3">
                    Alternative
                  </th>

                  <th className="px-4 py-3 text-right">
                    Score
                  </th>

                  {result.criteria.map(
                    (
                      criterion,
                    ) => (
                      <th
                        key={
                          criterion.key
                        }
                        className="whitespace-nowrap px-4 py-3 text-right"
                      >
                        {
                          criterion.label
                        }
                        <span className="ml-1 text-xs font-normal">
                          {percentageText(
                            criterion.weight,
                          )}
                        </span>
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {result.alternatives.map(
                  (
                    alternative,
                  ) => (
                    <tr
                      key={
                        alternative.runId
                      }
                      className="border-b border-slate-100 bg-white"
                    >
                      <td className="px-4 py-3 text-center text-lg font-semibold">
                        {
                          alternative.rank
                        }
                      </td>

                      <td className="min-w-56 px-4 py-3">
                        <p className="font-medium text-slate-900">
                          {
                            alternative.scenarioName
                          }
                        </p>

                        <p className="text-xs text-slate-500">
                          {
                            alternative.siteName
                          }
                          {" · "}
                          {
                            alternative.simulationDate
                          }
                        </p>

                        <Link
                          href={`/simulation-runs/${alternative.runId}`}
                          className="mt-1 block font-mono text-xs text-indigo-700"
                        >
                          {
                            alternative.runId.slice(
                              0,
                              12,
                            )
                          }
                          …
                        </Link>
                      </td>

                      <td className="px-4 py-3 text-right text-lg font-semibold text-indigo-800">
                        {scoreText(
                          alternative.score,
                        )}
                      </td>

                      {alternative.criteria.map(
                        (
                          criterion,
                        ) => (
                          <td
                            key={
                              criterion.key
                            }
                            className="whitespace-nowrap px-4 py-3 text-right"
                          >
                            <p className="font-medium">
                              {criterion.normalizedValue.toFixed(
                                3,
                              )}
                            </p>

                            <p className="text-xs text-slate-500">
                              +{" "}
                              {criterion.weightedValue.toFixed(
                                3,
                              )}
                            </p>
                          </td>
                        ),
                      )}
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          <DecisionRobustness
            mcdaResult={
              result
            }
            runIds={
              analytics.records.map(
                (
                  record,
                ) =>
                  record.run
                    .identity
                    .runId,
              )
            }
          />

          {result.warnings.length >
          0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-semibold text-amber-900">
                MCDA interpretation warnings
              </p>

              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
                {result.warnings.map(
                  (
                    warning,
                  ) => (
                    <li
                      key={
                        warning
                      }
                    >
                      {
                        warning
                      }
                    </li>
                  ),
                )}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
