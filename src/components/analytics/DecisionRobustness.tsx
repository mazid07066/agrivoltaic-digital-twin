"use client";

import {
  useState,
} from "react";

import Link from "next/link";

import type {
  McdaCriterionConfiguration,
  McdaResult,
  McdaSensitivityResult,
  ParetoAnalysisResult,
} from "@/lib/analytics/types";

interface DecisionRobustnessProps {
  mcdaResult:
    McdaResult;

  runIds:
    string[];
}

interface RobustnessResponse {
  ok:
    boolean;

  pareto?:
    ParetoAnalysisResult;

  sensitivity?:
    McdaSensitivityResult;

  error?:
    string;
}

function percent(
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

export default function DecisionRobustness({
  mcdaResult,
  runIds,
}: DecisionRobustnessProps) {
  const [
    perturbationPercent,
    setPerturbationPercent,
  ] =
    useState(
      20,
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
    pareto,
    setPareto,
  ] =
    useState<
      ParetoAnalysisResult | null
    >(
      null,
    );

  const [
    sensitivity,
    setSensitivity,
  ] =
    useState<
      McdaSensitivityResult | null
    >(
      null,
    );

  async function analyzeRobustness() {
    const fraction =
      perturbationPercent /
      100;

    if (
      fraction <=
        0 ||
      fraction >=
        1
    ) {
      setMessage(
        "Sensitivity perturbation must be greater than 0% and less than 100%.",
      );

      return;
    }

    const criteria:
      McdaCriterionConfiguration[] =
      mcdaResult.criteria.map(
        (
          criterion,
        ) => ({
          ...criterion,
        }),
      );

    setLoading(
      true,
    );

    setMessage(
      "",
    );

    setPareto(
      null,
    );

    setSensitivity(
      null,
    );

    try {
      const response =
        await fetch(
          "/api/analytics/robustness",
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

                criteria,

                perturbationFraction:
                  fraction,
              }),
          },
        );

      const data =
        (await response.json()) as
          RobustnessResponse;

      if (
        !response.ok ||
        !data.ok ||
        !data.pareto ||
        !data.sensitivity
      ) {
        throw new Error(
          data.error ??
            "Decision robustness analysis failed.",
        );
      }

      setPareto(
        data.pareto,
      );

      setSensitivity(
        data.sensitivity,
      );
    } catch (
      error
    ) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Decision robustness analysis failed.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }

  return (
    <section className="rounded-2xl border border-fuchsia-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-700">
            Decision robustness
          </p>

          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Pareto and ranking stability
          </h2>

          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Test whether the MCDA recommendation
            remains credible under criterion-weight
            changes and identify alternatives that
            are not dominated by another design.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-4">
        <label>
          <span className="block text-sm font-medium text-slate-700">
            Weight perturbation
          </span>

          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="99"
              step="1"
              value={
                perturbationPercent
              }
              onChange={
                (
                  event,
                ) =>
                  setPerturbationPercent(
                    Number(
                      event.target
                        .value,
                    ),
                  )
              }
              className="w-24 rounded-lg border border-slate-300 px-3 py-2"
            />

            <span className="text-sm text-slate-600">
              %
            </span>
          </div>
        </label>

        <button
          type="button"
          onClick={
            analyzeRobustness
          }
          disabled={
            loading
          }
          className="rounded-xl bg-fuchsia-700 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {loading
            ? "Analyzing..."
            : "Analyze robustness"}
        </button>
      </div>

      {message ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {
            message
          }
        </div>
      ) : null}

      {pareto &&
      sensitivity ? (
        <div className="mt-6 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-xl bg-fuchsia-50 p-4">
              <p className="text-xs uppercase tracking-wide text-fuchsia-700">
                Pareto frontier
              </p>

              <p className="mt-1 text-2xl font-semibold text-fuchsia-950">
                {
                  pareto.frontierRunIds
                    .length
                }
              </p>
            </article>

            <article className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Dominated designs
              </p>

              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {
                  pareto.dominatedRunIds
                    .length
                }
              </p>
            </article>

            <article
              className={[
                "rounded-xl p-4",

                sensitivity
                  .topAlternativeStable
                  ? "bg-emerald-50"
                  : "bg-amber-50",
              ].join(
                " ",
              )}
            >
              <p className="text-xs uppercase tracking-wide text-slate-600">
                Top recommendation
              </p>

              <p className="mt-1 text-lg font-semibold">
                {sensitivity
                  .topAlternativeStable
                  ? "Stable"
                  : "Sensitive"}
              </p>
            </article>

            <article
              className={[
                "rounded-xl p-4",

                sensitivity
                  .rankReversalDetected
                  ? "bg-red-50"
                  : "bg-emerald-50",
              ].join(
                " ",
              )}
            >
              <p className="text-xs uppercase tracking-wide text-slate-600">
                Rank reversal
              </p>

              <p className="mt-1 text-lg font-semibold">
                {sensitivity
                  .rankReversalDetected
                  ? "Detected"
                  : "Not detected"}
              </p>
            </article>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-950">
              Pareto frontier
            </h3>

            <p className="mt-1 text-sm text-slate-600">
              Frontier alternatives are not
              dominated by another selected design
              across all configured criteria.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {pareto.alternatives.map(
                (
                  alternative,
                ) => (
                  <article
                    key={
                      alternative.runId
                    }
                    className={[
                      "rounded-xl border p-4",

                      alternative.frontier
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-slate-200 bg-slate-50",
                    ].join(
                      " ",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {
                            alternative.scenarioName
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {
                            alternative.siteName
                          }
                        </p>
                      </div>

                      <span
                        className={[
                          "rounded-full px-2 py-1 text-xs font-semibold",

                          alternative.frontier
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-700",
                        ].join(
                          " ",
                        )}
                      >
                        {alternative.frontier
                          ? "Frontier"
                          : "Dominated"}
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-slate-600">
                      Dominates:{" "}
                      {
                        alternative
                          .dominatesRunIds
                          .length
                      }
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      Dominated by:{" "}
                      {
                        alternative
                          .dominatedByRunIds
                          .length
                      }
                    </p>

                    <Link
                      href={`/simulation-runs/${alternative.runId}`}
                      className="mt-3 inline-block font-mono text-xs text-fuchsia-700"
                    >
                      {
                        alternative.runId.slice(
                          0,
                          12,
                        )
                      }
                      …
                    </Link>
                  </article>
                ),
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-950">
              Ranking stability
            </h3>

            <p className="mt-1 text-sm text-slate-600">
              Results after changing each criterion
              weight by ±
              {
                (
                  sensitivity
                    .perturbationFraction *
                  100
                ).toFixed(
                  0,
                )
              }
              % one criterion at a time.
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-3">
                      Alternative
                    </th>

                    <th className="px-3 py-3 text-center">
                      Base rank
                    </th>

                    <th className="px-3 py-3 text-center">
                      Best
                    </th>

                    <th className="px-3 py-3 text-center">
                      Worst
                    </th>

                    <th className="px-3 py-3 text-center">
                      Range
                    </th>

                    <th className="px-3 py-3 text-right">
                      Rank #1 frequency
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {sensitivity.stability.map(
                    (
                      item,
                    ) => (
                      <tr
                        key={
                          item.runId
                        }
                        className="border-b border-slate-100"
                      >
                        <td className="px-3 py-3 font-medium text-slate-900">
                          {
                            item.scenarioName
                          }
                        </td>

                        <td className="px-3 py-3 text-center">
                          {
                            item.baseRank
                          }
                        </td>

                        <td className="px-3 py-3 text-center">
                          {
                            item.bestObservedRank
                          }
                        </td>

                        <td className="px-3 py-3 text-center">
                          {
                            item.worstObservedRank
                          }
                        </td>

                        <td className="px-3 py-3 text-center">
                          {
                            item.rankRange
                          }
                        </td>

                        <td className="px-3 py-3 text-right">
                          {percent(
                            item.topRankFrequency,
                          )}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-950">
              Weight perturbation scenarios
            </h3>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-3">
                      Criterion
                    </th>

                    <th className="px-3 py-3">
                      Change
                    </th>

                    <th className="px-3 py-3 text-right">
                      Base weight
                    </th>

                    <th className="px-3 py-3 text-right">
                      Tested weight
                    </th>

                    <th className="px-3 py-3">
                      Winner
                    </th>

                    <th className="px-3 py-3">
                      Changed?
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {sensitivity.scenarios.map(
                    (
                      scenario,
                      index,
                    ) => (
                      <tr
                        key={`${scenario.criterionKey}-${scenario.direction}-${index}`}
                        className="border-b border-slate-100"
                      >
                        <td className="px-3 py-3 font-medium">
                          {
                            scenario.criterionLabel
                          }
                        </td>

                        <td className="px-3 py-3">
                          {
                            scenario.direction
                          }
                        </td>

                        <td className="px-3 py-3 text-right">
                          {percent(
                            scenario.baseWeight,
                          )}
                        </td>

                        <td className="px-3 py-3 text-right">
                          {percent(
                            scenario.testedWeight,
                          )}
                        </td>

                        <td className="px-3 py-3 font-mono text-xs">
                          {scenario.topRunId
                            ? `${scenario.topRunId.slice(
                                0,
                                12,
                              )}…`
                            : "N/A"}
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={[
                              "rounded-full px-2 py-1 text-xs font-semibold",

                              scenario.topChanged
                                ? "bg-red-100 text-red-700"
                                : "bg-emerald-100 text-emerald-700",
                            ].join(
                              " ",
                            )}
                          >
                            {scenario.topChanged
                              ? "Yes"
                              : "No"}
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
