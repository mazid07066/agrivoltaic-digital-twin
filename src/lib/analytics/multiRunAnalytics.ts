import {
  ANALYTICS_METRICS,
} from "./baselineComparison";

import {
  evaluatePolicyConstraints,
} from "./policyEvaluator";

import {
  assessStudyCompatibility,
} from "./studyCompatibility";

import type {
  AnalyticsMetricKey,
  ComparableRunRecord,
  MultiRunAnalyticsResult,
  MultiRunMetricStatistics,
} from "./types";

function finiteMetric(
  record:
    ComparableRunRecord,

  key:
    AnalyticsMetricKey,
): number | null {
  const value =
    record.summary[
      key
    ];

  return (
    typeof value === "number" &&
    Number.isFinite(value)
  )
    ? value
    : null;
}

function mean(
  values:
    number[],
): number | null {
  if (
    values.length === 0
  ) {
    return null;
  }

  return (
    values.reduce(
      (
        total,
        value,
      ) =>
        total +
        value,
      0,
    ) /
    values.length
  );
}

function bestRecord(
  records:
    ComparableRunRecord[],

  key:
    AnalyticsMetricKey,

  direction:
    "benefit"
    | "cost"
    | "neutral",
): {
  runId:
    string | null;

  value:
    number | null;
} {
  const available =
    records
      .map(
        (
          record,
        ) => ({
          record,

          value:
            finiteMetric(
              record,
              key,
            ),
        }),
      )
      .filter(
        (
          item,
        ): item is {
          record:
            ComparableRunRecord;

          value:
            number;
        } =>
          item.value !==
          null,
      );

  if (
    available.length ===
    0
  ) {
    return {
      runId:
        null,

      value:
        null,
    };
  }

  /*
   * Neutral metrics do not yet define
   * "better" semantics for MCDA.
   *
   * We still report a deterministic
   * representative maximum here, but
   * direction remains explicitly neutral.
   */
  const sorted =
    [...available].sort(
      (
        first,
        second,
      ) => {
        if (
          direction ===
          "cost"
        ) {
          return (
            first.value -
            second.value
          );
        }

        return (
          second.value -
          first.value
        );
      },
    );

  return {
    runId:
      sorted[0]
        .record
        .identity
        .runId,

    value:
      sorted[0]
        .value,
  };
}

function metricStatistics(
  records:
    ComparableRunRecord[],
): MultiRunMetricStatistics[] {
  return ANALYTICS_METRICS.map(
    (
      definition,
    ) => {
      const values =
        records
          .map(
            (
              record,
            ) =>
              finiteMetric(
                record,
                definition.key,
              ),
          )
          .filter(
            (
              value,
            ): value is number =>
              value !== null,
          );

      const best =
        bestRecord(
          records,
          definition.key,
          definition.direction,
        );

      return {
        key:
          definition.key,

        label:
          definition.label,

        unit:
          definition.unit,

        direction:
          definition.direction,

        availableCount:
          values.length,

        unavailableCount:
          records.length -
          values.length,

        minimum:
          values.length > 0
            ? Math.min(
                ...values,
              )
            : null,

        maximum:
          values.length > 0
            ? Math.max(
                ...values,
              )
            : null,

        mean:
          mean(
            values,
          ),

        bestRunId:
          best.runId,

        bestValue:
          best.value,
      };
    },
  );
}

export function analyzePersistedRuns(
  records:
    ComparableRunRecord[],
): MultiRunAnalyticsResult {
  if (
    records.length <
    2
  ) {
    throw new Error(
      "Multi-run analytics requires at least two persisted runs.",
    );
  }

  const ids =
    records.map(
      (
        record,
      ) =>
        record.identity
          .runId,
    );

  const uniqueIds =
    new Set(
      ids,
    );

  if (
    uniqueIds.size !==
    ids.length
  ) {
    throw new Error(
      "Multi-run analytics cannot contain duplicate simulation runs.",
    );
  }

  const compatibility =
    assessStudyCompatibility(
      records,
    );

  return {
    schema:
      "agritwin-multi-run-analytics-v1",

    generatedAt:
      new Date()
        .toISOString(),

    runCount:
      records.length,

    compatibility,

    records:
      records.map(
        (
          run,
        ) => ({
          run,

          policyEvaluation:
            evaluatePolicyConstraints(
              run,
            ),
        }),
      ),

    metricStatistics:
      metricStatistics(
        records,
      ),
  };
}
