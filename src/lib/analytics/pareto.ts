import {
  assessStudyCompatibility,
} from "./studyCompatibility";

import type {
  AnalyticsMetricKey,
  ComparableRunRecord,
  ParetoAnalysisResult,
  ParetoCriterionConfiguration,
} from "./types";

const EPSILON =
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

function validateRecords(
  records:
    ComparableRunRecord[],
): void {
  if (
    records.length <
    2
  ) {
    throw new Error(
      "Pareto analysis requires at least two persisted simulation runs.",
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

  if (
    new Set(
      ids,
    ).size !==
    ids.length
  ) {
    throw new Error(
      "Pareto analysis cannot contain duplicate simulation runs.",
    );
  }
}

function validateCriteria(
  records:
    ComparableRunRecord[],

  criteria:
    ParetoCriterionConfiguration[],
): void {
  if (
    criteria.length ===
    0
  ) {
    throw new Error(
      "Pareto analysis requires at least one criterion.",
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
      "Pareto criteria cannot contain duplicate metric keys.",
    );
  }

  for (
    const criterion of
    criteria
  ) {
    if (
      criterion.direction !==
        "benefit" &&
      criterion.direction !==
        "cost"
    ) {
      throw new Error(
        `Pareto criterion ${criterion.key} requires benefit or cost direction.`,
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
          `Pareto criterion ${criterion.key} is unavailable for run ${record.identity.runId}.`,
        );
      }
    }
  }
}

function atLeastAsGood(
  first:
    number,

  second:
    number,

  direction:
    "benefit"
    | "cost",
): boolean {
  if (
    direction ===
    "benefit"
  ) {
    return (
      first >
        second ||
      Math.abs(
        first -
        second,
      ) <=
        EPSILON
    );
  }

  return (
    first <
      second ||
    Math.abs(
      first -
        second,
    ) <=
      EPSILON
  );
}

function strictlyBetter(
  first:
    number,

  second:
    number,

  direction:
    "benefit"
    | "cost",
): boolean {
  if (
    direction ===
    "benefit"
  ) {
    return (
      first -
        second >
      EPSILON
    );
  }

  return (
    second -
      first >
    EPSILON
  );
}

export function dominates(
  first:
    ComparableRunRecord,

  second:
    ComparableRunRecord,

  criteria:
    ParetoCriterionConfiguration[],
): boolean {
  let strictlyBetterSomewhere =
    false;

  for (
    const criterion of
    criteria
  ) {
    const firstValue =
      finiteMetric(
        first,
        criterion.key,
      );

    const secondValue =
      finiteMetric(
        second,
        criterion.key,
      );

    if (
      firstValue ===
        null ||
      secondValue ===
        null
    ) {
      throw new Error(
        `Pareto evidence is incomplete for criterion ${criterion.key}.`,
      );
    }

    if (
      !atLeastAsGood(
        firstValue,
        secondValue,
        criterion.direction,
      )
    ) {
      return false;
    }

    if (
      strictlyBetter(
        firstValue,
        secondValue,
        criterion.direction,
      )
    ) {
      strictlyBetterSomewhere =
        true;
    }
  }

  return strictlyBetterSomewhere;
}

export function analyzePareto(
  records:
    ComparableRunRecord[],

  criteria:
    ParetoCriterionConfiguration[],
): ParetoAnalysisResult {
  validateRecords(
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
      "Pareto analysis cannot evaluate a scientifically incompatible study set.",
    );
  }

  validateCriteria(
    records,
    criteria,
  );

  const alternatives =
    records.map(
      (
        record,
      ) => {
        const dominatedByRunIds =
          records
            .filter(
              (
                candidate,
              ) =>
                candidate.identity
                  .runId !==
                  record.identity
                    .runId &&
                dominates(
                  candidate,
                  record,
                  criteria,
                ),
            )
            .map(
              (
                candidate,
              ) =>
                candidate.identity
                  .runId,
            );

        const dominatesRunIds =
          records
            .filter(
              (
                candidate,
              ) =>
                candidate.identity
                  .runId !==
                  record.identity
                    .runId &&
                dominates(
                  record,
                  candidate,
                  criteria,
                ),
            )
            .map(
              (
                candidate,
              ) =>
                candidate.identity
                  .runId,
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

          siteName:
            record.identity
              .siteName,

          simulationDate:
            record.identity
              .simulationDate,

          dominated:
            dominatedByRunIds.length >
            0,

          dominatedByRunIds,

          dominatesRunIds,

          frontier:
            dominatedByRunIds.length ===
            0,
        };
      },
    );

  const frontierRunIds =
    alternatives
      .filter(
        (
          alternative,
        ) =>
          alternative.frontier,
      )
      .map(
        (
          alternative,
        ) =>
          alternative.runId,
      );

  const dominatedRunIds =
    alternatives
      .filter(
        (
          alternative,
        ) =>
          alternative.dominated,
      )
      .map(
        (
          alternative,
        ) =>
          alternative.runId,
      );

  return {
    schema:
      "agritwin-pareto-v1",

    generatedAt:
      new Date()
        .toISOString(),

    runCount:
      records.length,

    criterionCount:
      criteria.length,

    compatibility,

    criteria,

    alternatives,

    frontierRunIds,

    dominatedRunIds,

    warnings:
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
        ),
  };
}
