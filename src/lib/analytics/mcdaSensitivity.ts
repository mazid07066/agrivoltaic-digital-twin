import {
  evaluateMcda,
} from "./mcda";

import type {
  ComparableRunRecord,
  McdaCriterionConfiguration,
  McdaSensitivityResult,
} from "./types";

function boundedFraction(
  value:
    number,
): number {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    throw new Error(
      "MCDA sensitivity perturbation must be finite.",
    );
  }

  if (
    value <=
      0 ||
    value >=
      1
  ) {
    throw new Error(
      "MCDA sensitivity perturbation must be greater than 0 and less than 1.",
    );
  }

  return value;
}

function normalizeWeights(
  criteria:
    McdaCriterionConfiguration[],
): McdaCriterionConfiguration[] {
  const total =
    criteria.reduce(
      (
        sum,
        criterion,
      ) =>
        sum +
        criterion.weight,
      0,
    );

  if (
    total <=
    0
  ) {
    throw new Error(
      "MCDA sensitivity requires positive total criterion weight.",
    );
  }

  return criteria.map(
    (
      criterion,
    ) => ({
      ...criterion,

      weight:
        criterion.weight /
        total,
    }),
  );
}

function perturbCriterion(
  criteria:
    McdaCriterionConfiguration[],

  targetIndex:
    number,

  multiplier:
    number,
): McdaCriterionConfiguration[] {
  const changed =
    criteria.map(
      (
        criterion,
        index,
      ) => ({
        ...criterion,

        weight:
          index ===
          targetIndex
            ? criterion.weight *
              multiplier
            : criterion.weight,
      }),
    );

  return normalizeWeights(
    changed,
  );
}

export function analyzeMcdaSensitivity(
  records:
    ComparableRunRecord[],

  criteria:
    McdaCriterionConfiguration[],

  perturbationFraction =
    0.2,
): McdaSensitivityResult {
  const fraction =
    boundedFraction(
      perturbationFraction,
    );

  const baseResult =
    evaluateMcda(
      records,
      criteria,
    );

  const normalizedBaseCriteria =
    baseResult.criteria;

  const scenarios =
    normalizedBaseCriteria.flatMap(
      (
        criterion,
        index,
      ) => {
        const variants = [
          {
            direction:
              "decrease" as const,

            multiplier:
              1 -
              fraction,
          },

          {
            direction:
              "increase" as const,

            multiplier:
              1 +
              fraction,
          },
        ];

        return variants.map(
          (
            variant,
          ) => {
            const perturbedCriteria =
              perturbCriterion(
                normalizedBaseCriteria,
                index,
                variant.multiplier,
              );

            const result =
              evaluateMcda(
                records,
                perturbedCriteria,
              );

            const topRunId =
              result.alternatives[0]
                ?.runId ??
              null;

            return {
              criterionKey:
                criterion.key,

              criterionLabel:
                criterion.label,

              baseWeight:
                criterion.weight,

              testedWeight:
                perturbedCriteria[
                  index
                ].weight,

              direction:
                variant.direction,

              ranking:
                result.alternatives.map(
                  (
                    alternative,
                  ) => ({
                    runId:
                      alternative.runId,

                    rank:
                      alternative.rank,

                    score:
                      alternative.score,
                  }),
                ),

              topRunId,

              topChanged:
                topRunId !==
                (
                  baseResult
                    .alternatives[0]
                    ?.runId ??
                  null
                ),
            };
          },
        );
      },
    );

  const stability =
    baseResult.alternatives.map(
      (
        baseAlternative,
      ) => {
        const observedRanks =
          scenarios
            .map(
              (
                scenario,
              ) =>
                scenario.ranking.find(
                  (
                    candidate,
                  ) =>
                    candidate.runId ===
                    baseAlternative.runId,
                )?.rank,
            )
            .filter(
              (
                rank,
              ): rank is number =>
                typeof rank ===
                "number",
            );

        const allRanks = [
          baseAlternative.rank,
          ...observedRanks,
        ];

        const topRankCount =
          allRanks.filter(
            (
              rank,
            ) =>
              rank ===
              1,
          ).length;

        return {
          runId:
            baseAlternative.runId,

          scenarioName:
            baseAlternative.scenarioName,

          baseRank:
            baseAlternative.rank,

          bestObservedRank:
            Math.min(
              ...allRanks,
            ),

          worstObservedRank:
            Math.max(
              ...allRanks,
            ),

          rankRange:
            Math.max(
              ...allRanks,
            ) -
            Math.min(
              ...allRanks,
            ),

          topRankCount,

          scenarioCount:
            allRanks.length,

          topRankFrequency:
            topRankCount /
            allRanks.length,
        };
      },
    );

  const baseTopRunId =
    baseResult
      .alternatives[0]
      ?.runId ??
    null;

  const distinctTopRunIds = [
    ...new Set(
      [
        baseTopRunId,
        ...scenarios.map(
          (
            scenario,
          ) =>
            scenario.topRunId,
        ),
      ].filter(
        (
          value,
        ): value is string =>
          typeof value ===
          "string",
      ),
    ),
  ];

  const rankReversalDetected =
    scenarios.some(
      (
        scenario,
      ) =>
        scenario.topChanged,
    );

  return {
    schema:
      "agritwin-mcda-sensitivity-v1",

    generatedAt:
      new Date()
        .toISOString(),

    perturbationFraction:
      fraction,

    baseResult,

    scenarios,

    stability,

    topAlternativeStable:
      !rankReversalDetected,

    rankReversalDetected,

    distinctTopRunIds,

    warnings:
      [
        ...baseResult.warnings,
      ],
  };
}
