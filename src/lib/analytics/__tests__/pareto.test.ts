import {
  describe,
  expect,
  it,
} from "vitest";

import {
  analyzePareto,
  dominates,
} from "../pareto";

import type {
  ComparableRunRecord,
  ParetoCriterionConfiguration,
} from "../types";

function record(
  runId:
    string,

  energy:
    number,

  cropYield:
    number,
): ComparableRunRecord {
  return {
    schema:
      "agritwin-comparable-run-v1",

    identity: {
      runId,

      scenarioId:
        `scenario-${runId}`,

      scenarioVersion:
        1,

      scenarioName:
        runId,

      scenarioType:
        "agrivoltaic",

      isBaseline:
        false,

      projectId:
        "project",

      siteId:
        "site",

      siteVersionId:
        "version",

      siteVersionNumber:
        1,

      siteType:
        "land_agrivoltaic",

      siteName:
        "site",

      simulationDate:
        "2026-08-20",

      engineKind:
        "land",

      engineVersion:
        "engine",

      controllerVersion:
        null,

      weatherAdapterVersion:
        "weather",

      executionFingerprint:
        `fingerprint-${runId}`,

      environmentFingerprint:
        "environment",

      reproducibilityVerified:
        true,
    },

    summary: {
      engineKind:
        "land",

      siteType:
        "land_agrivoltaic",

      installedCapacityKw:
        100,

      dailyEnergyKwh:
        energy,

      specificYieldKwhPerKw:
        energy /
        100,

      openFieldDliMolM2:
        20,

      cropDliMolM2:
        17,

      estimatedCropYieldPercent:
        cropYield,

      landEquivalentRatio:
        1.2,

      groundCoverageRatioPercent:
        35,

      usableAreaPercent:
        null,

      moduleCount:
        200,

      additionalMetrics:
        {},
    },

    policy: {
      minimumCropRetention:
        null,

      maximumGcr:
        null,

      minimumLer:
        null,

      minimumPanelHeightM:
        null,

      maximumDliReduction:
        null,

      minimumRenewableEnergyKwh:
        null,

      policyPreset:
        null,
    },

    economic: {
      currency:
        null,

      capex:
        null,

      annualOpex:
        null,

      electricityTariffPerKwh:
        null,

      cropPrice:
        null,

      discountRate:
        null,

      projectLifetimeYears:
        null,
    },
  };
}

const criteria:
  ParetoCriterionConfiguration[] =
  [
    {
      key:
        "dailyEnergyKwh",

      label:
        "Energy",

      unit:
        "kWh",

      direction:
        "benefit",
    },

    {
      key:
        "estimatedCropYieldPercent",

      label:
        "Crop yield",

      unit:
        "%",

      direction:
        "benefit",
    },
  ];

describe(
  "Phase 9D-7 Pareto analysis",
  () => {
    it(
      "detects direct Pareto dominance",
      () => {
        const a =
          record(
            "a",
            500,
            90,
          );

        const b =
          record(
            "b",
            550,
            92,
          );

        expect(
          dominates(
            b,
            a,
            criteria,
          ),
        ).toBe(
          true,
        );

        expect(
          dominates(
            a,
            b,
            criteria,
          ),
        ).toBe(
          false,
        );
      },
    );

    it(
      "keeps trade-off alternatives on the frontier",
      () => {
        const result =
          analyzePareto(
            [
              record(
                "a",
                550,
                95,
              ),

              record(
                "b",
                650,
                88,
              ),
            ],
            criteria,
          );

        expect(
          result.frontierRunIds.sort(),
        ).toEqual([
          "a",
          "b",
        ]);
      },
    );

    it(
      "removes dominated alternatives from the frontier",
      () => {
        const result =
          analyzePareto(
            [
              record(
                "a",
                500,
                90,
              ),

              record(
                "b",
                560,
                94,
              ),

              record(
                "c",
                610,
                88,
              ),
            ],
            criteria,
          );

        expect(
          result.frontierRunIds,
        ).not.toContain(
          "a",
        );

        expect(
          result.dominatedRunIds,
        ).toContain(
          "a",
        );

        expect(
          result.frontierRunIds,
        ).toContain(
          "b",
        );

        expect(
          result.frontierRunIds,
        ).toContain(
          "c",
        );
      },
    );

    it(
      "supports cost direction",
      () => {
        const costCriteria:
          ParetoCriterionConfiguration[] =
          [
            {
              key:
                "dailyEnergyKwh",

              label:
                "Test cost",

              unit:
                "kWh",

              direction:
                "cost",
            },
          ];

        const low =
          record(
            "low",
            400,
            90,
          );

        const high =
          record(
            "high",
            600,
            90,
          );

        expect(
          dominates(
            low,
            high,
            costCriteria,
          ),
        ).toBe(
          true,
        );
      },
    );
  },
);
