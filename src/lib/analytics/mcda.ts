import {
  ANALYTICS_METRICS,
} from "./baselineComparison";

import {
  assessStudyCompatibility,
} from "./studyCompatibility";

import type {
  AnalyticsMetricKey,
  ComparableRunRecord,
  McdaCriterionConfiguration,
  McdaCriterionEligibility,
  McdaCriterionDirection,
  McdaNormalizedCriterionValue,
  McdaRankedAlternative,
  McdaResult,
  MetricDefinition,
} from "./types";

const SCORE_EPSILON =
  1e-12;

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
    typeof value ===
      "number" &&
    Number.isFinite(
      value,
    )
  )
    ? value
    : null;
}

function metricDefinition(
  key:
    AnalyticsMetricKey,
): MetricDefinition {
  const definition =
    ANALYTICS_METRICS.find(
      (
        candidate,
      ) =>
        candidate.key ===
        key,
    );

  if (!definition) {
    throw new Error(
      `Unknown analytics metric: ${key}.`,
    );
  }

  return definition;
}

function uniqueRunCheck(
  records:
    ComparableRunRecord[],
): void {
  if (
    records.length <
    2
  ) {
    throw new Error(
      "MCDA requires at least two persisted simulation runs.",
    );
  }

  const runIds =
    records.map(
      (
        record,
      ) =>
        record.identity
          .runId,
    );

  if (
    new Set(
      runIds,
    ).size !==
    runIds.length
  ) {
    throw new Error(
      "MCDA cannot contain duplicate simulation runs.",
    );
  }
}

export function assessMcdaCriterionEligibility(
  records:
    ComparableRunRecord[],
): McdaCriterionEligibility[] {
  uniqueRunCheck(
    records,
  );

  return ANALYTICS_METRICS.map(
    (
      definition,
    ) => {
      const availableCount =
        records.filter(
          (
            record,
          ) =>
            finiteMetric(
              record,
              definition.key,
            ) !==
            null,
        ).length;

      const missingCount =
        records.length -
        availableCount;

      if (
        definition.direction ===
        "neutral"
      ) {
        return {
          key:
            definition.key,

          label:
            definition.label,

          unit:
            definition.unit,

          sourceDirection:
            definition.direction,

          eligible:
            false,

          availableCount,

          missingCount,

          reason:
            "This metric has neutral direction and requires an explicit benefit or cost interpretation before it can be used for ranking.",
        };
      }

      if (
        missingCount >
        0
      ) {
        return {
          key:
            definition.key,

          label:
            definition.label,

          unit:
            definition.unit,

          sourceDirection:
            definition.direction,

          eligible:
            false,

          availableCount,

          missingCount,

          reason:
            "At least one selected run does not contain this KPI. AgriTwin does not silently impute missing MCDA evidence.",
        };
      }

      return {
        key:
          definition.key,

        label:
          definition.label,

        unit:
          definition.unit,

        sourceDirection:
          definition.direction,

        eligible:
          true,

        availableCount,

        missingCount:
          0,

        reason:
          null,
      };
    },
  );
}

export function createDefaultMcdaCriteria(
  records:
    ComparableRunRecord[],
): McdaCriterionConfiguration[] {
  const eligibility =
    assessMcdaCriterionEligibility(
      records,
    );

  const eligible =
    eligibility.filter(
      (
        item,
      ) =>
        item.eligible &&
        item.sourceDirection !==
          "neutral",
    );

  if (
    eligible.length ===
    0
  ) {
    return [];
  }

  const equalWeight =
    1 /
    eligible.length;

  return eligible.map(
    (
      item,
    ) => ({
      key:
        item.key,

      label:
        item.label,

      unit:
        item.unit,

      direction:
        item.sourceDirection as
          McdaCriterionDirection,

      weight:
        equalWeight,
    }),
  );
}

function validateCriteria(
  records:
    ComparableRunRecord[],

  criteria:
    McdaCriterionConfiguration[],
): McdaCriterionConfiguration[] {
  if (
    criteria.length ===
    0
  ) {
    throw new Error(
      "MCDA requires at least one criterion.",
    );
  }

  const keys =
    criteria.map(
      (
        criterion,
      ) =>
        criterion.key,
    );

  if (
    new Set(
      keys,
    ).size !==
    keys.length
  ) {
    throw new Error(
      "MCDA criteria cannot contain duplicate metric keys.",
    );
  }

  const validated =
    criteria.map(
      (
        criterion,
      ) => {
        const definition =
          metricDefinition(
            criterion.key,
          );

        if (
          criterion.direction !==
            "benefit" &&
          criterion.direction !==
            "cost"
        ) {
          throw new Error(
            `Criterion ${criterion.key} requires benefit or cost direction.`,
          );
        }

        if (
          typeof criterion.weight !==
            "number" ||
          !Number.isFinite(
            criterion.weight,
          ) ||
          criterion.weight <
            0
        ) {
          throw new Error(
            `Criterion ${criterion.key} has an invalid weight.`,
          );
        }

        for (
          const record of
          records
        ) {
          if (
            finiteMetric(
              record,
              criterion.key,
            ) ===
            null
          ) {
            throw new Error(
              `Criterion ${criterion.key} is unavailable for run ${record.identity.runId}. Missing MCDA evidence is not automatically imputed.`,
            );
          }
        }

        return {
          key:
            criterion.key,

          label:
            criterion.label ||
            definition.label,

          unit:
            criterion.unit ??
            definition.unit,

          direction:
            criterion.direction,

          weight:
            criterion.weight,
        };
      },
    );

  const totalWeight =
    validated.reduce(
      (
        total,
        criterion,
      ) =>
        total +
        criterion.weight,
      0,
    );

  if (
    totalWeight <=
    0
  ) {
    throw new Error(
      "The total MCDA criterion weight must be greater than zero.",
    );
  }

  /*
   * Always normalize supplied weights.
   *
   * The UI may use percentages, decimals or
   * arbitrary positive relative weights.
   */
  return validated.map(
    (
      criterion,
    ) => ({
      ...criterion,

      weight:
        criterion.weight /
        totalWeight,
    }),
  );
}

function normalizeCriterion(
  values:
    number[],

  direction:
    McdaCriterionDirection,
): {
  normalized:
    number[];

  nonDiscriminating:
    boolean;
} {
  const minimum =
    Math.min(
      ...values,
    );

  const maximum =
    Math.max(
      ...values,
    );

  const range =
    maximum -
    minimum;

  /*
   * If every alternative has exactly the same
   * value, this criterion has no discriminatory
   * power.
   *
   * Assigning 1 to every run preserves equality
   * and prevents division by zero.
   */
  if (
    Math.abs(
      range,
    ) <=
    SCORE_EPSILON
  ) {
    return {
      normalized:
        values.map(
          () =>
            1,
        ),

      nonDiscriminating:
        true,
    };
  }

  if (
    direction ===
    "benefit"
  ) {
    return {
      normalized:
        values.map(
          (
            value,
          ) =>
            (
              value -
              minimum
            ) /
            range,
        ),

      nonDiscriminating:
        false,
    };
  }

  return {
    normalized:
      values.map(
        (
          value,
        ) =>
          (
            maximum -
            value
          ) /
          range,
      ),

    nonDiscriminating:
      false,
  };
}

function rankAlternatives(
  alternatives:
    Omit<
      McdaRankedAlternative,
      "rank"
    >[],
): McdaRankedAlternative[] {
  const sorted =
    [...alternatives].sort(
      (
        first,
        second,
      ) => {
        const scoreDifference =
          second.score -
          first.score;

        if (
          Math.abs(
            scoreDifference,
          ) >
          SCORE_EPSILON
        ) {
          return scoreDifference;
        }

        return first.runId.localeCompare(
          second.runId,
        );
      },
    );

  let previousScore:
    number | null =
      null;

  let previousRank =
    0;

  return sorted.map(
    (
      alternative,
      index,
    ) => {
      const sameAsPrevious =
        previousScore !==
          null &&
        Math.abs(
          alternative.score -
          previousScore,
        ) <=
          SCORE_EPSILON;

      const rank =
        sameAsPrevious
          ? previousRank
          : index + 1;

      previousScore =
        alternative.score;

      previousRank =
        rank;

      return {
        ...alternative,

        rank,
      };
    },
  );
}

export function evaluateMcda(
  records:
    ComparableRunRecord[],

  criteria:
    McdaCriterionConfiguration[],
): McdaResult {
  uniqueRunCheck(
    records,
  );

  const compatibility =
    assessStudyCompatibility(
      records,
    );

  if (
    !compatibility.compatible
  ) {
    throw new Error(
      "MCDA cannot rank a scientifically incompatible study set.",
    );
  }

  const normalizedCriteria =
    validateCriteria(
      records,
      criteria,
    );

  const warnings:
    string[] =
      compatibility.issues
        .filter(
          (
            issue,
          ) =>
            issue.level ===
            "warning",
        )
        .map(
          (
            issue,
          ) =>
            issue.explanation,
        );

  const matrix =
    new Map<
      AnalyticsMetricKey,
      {
        normalized:
          number[];

        nonDiscriminating:
          boolean;
      }
    >();

  for (
    const criterion of
    normalizedCriteria
  ) {
    const rawValues =
      records.map(
        (
          record,
        ) => {
          const value =
            finiteMetric(
              record,
              criterion.key,
            );

          if (
            value ===
            null
          ) {
            throw new Error(
              `Criterion ${criterion.key} became unavailable during MCDA evaluation.`,
            );
          }

          return value;
        },
      );

    const normalized =
      normalizeCriterion(
        rawValues,
        criterion.direction,
      );

    matrix.set(
      criterion.key,
      normalized,
    );

    if (
      normalized.nonDiscriminating
    ) {
      warnings.push(
        `${criterion.label} has identical values across all selected alternatives and therefore provides no discrimination between runs.`,
      );
    }
  }

  const alternatives =
    records.map(
      (
        record,
        runIndex,
      ) => {
        const criterionValues:
          McdaNormalizedCriterionValue[] =
          normalizedCriteria.map(
            (
              criterion,
            ) => {
              const rawValue =
                finiteMetric(
                  record,
                  criterion.key,
                );

              if (
                rawValue ===
                null
              ) {
                throw new Error(
                  `Criterion ${criterion.key} is unavailable for run ${record.identity.runId}.`,
                );
              }

              const normalizedValue =
                matrix.get(
                  criterion.key,
                )?.normalized[
                  runIndex
                ];

              if (
                typeof normalizedValue !==
                  "number"
              ) {
                throw new Error(
                  `MCDA normalization failed for criterion ${criterion.key}.`,
                );
              }

              return {
                key:
                  criterion.key,

                rawValue,

                normalizedValue,

                weightedValue:
                  normalizedValue *
                  criterion.weight,
              };
            },
          );

        const score =
          criterionValues.reduce(
            (
              total,
              criterion,
            ) =>
              total +
              criterion.weightedValue,
            0,
          );

        return {
          runId:
            record.identity
              .runId,

          scenarioId:
            record.identity
              .scenarioId,

          scenarioName:
            record.identity
              .scenarioName,

          scenarioType:
            record.identity
              .scenarioType,

          isBaseline:
            record.identity
              .isBaseline,

          siteName:
            record.identity
              .siteName,

          simulationDate:
            record.identity
              .simulationDate,

          score,

          criteria:
            criterionValues,
        };
      },
    );

  return {
    schema:
      "agritwin-mcda-v1",

    method:
      "weighted-sum-min-max",

    generatedAt:
      new Date()
        .toISOString(),

    runCount:
      records.length,

    criterionCount:
      normalizedCriteria.length,

    compatibility,

    criteria:
      normalizedCriteria,

    alternatives:
      rankAlternatives(
        alternatives,
      ),

    eligibility:
      assessMcdaCriterionEligibility(
        records,
      ),

    warnings:
      [
        ...new Set(
          warnings,
        ),
      ],
  };
}
