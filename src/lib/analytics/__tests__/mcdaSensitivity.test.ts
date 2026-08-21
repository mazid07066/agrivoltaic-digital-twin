import {
  describe,
  expect,
  it,
} from "vitest";

import {
  analyzeMcdaSensitivity,
} from "../mcdaSensitivity";

import type {
  ComparableRunRecord,
  McdaCriterionConfiguration,
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
  McdaCriterionConfiguration[] =
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

      weight:
        0.5,
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

      weight:
        0.5,
    },
  ];

describe(
  "Phase 9D-7 MCDA sensitivity",
  () => {
    it(
      "creates two perturbation scenarios per criterion",
      () => {
        const result =
          analyzeMcdaSensitivity(
            [
              record(
                "a",
                500,
                95,
              ),

              record(
                "b",
                600,
                85,
              ),
            ],
            criteria,
            0.2,
          );

        expect(
          result.scenarios,
        ).toHaveLength(
          4,
        );
      },
    );

    it(
      "reports rank stability for every alternative",
      () => {
        const result =
          analyzeMcdaSensitivity(
            [
              record(
                "a",
                500,
                95,
              ),

              record(
                "b",
                600,
                85,
              ),
            ],
            criteria,
            0.2,
          );

        expect(
          result.stability,
        ).toHaveLength(
          2,
        );

        for (
          const item of
          result.stability
        ) {
          expect(
            item.bestObservedRank,
          ).toBeGreaterThanOrEqual(
            1,
          );

          expect(
            item.worstObservedRank,
          ).toBeGreaterThanOrEqual(
            item.bestObservedRank,
          );
        }
      },
    );

    it(
      "detects top-rank reversal when weighting changes the winner",
      () => {
        const result =
          analyzeMcdaSensitivity(
            [
              record(
                "a",
                500,
                100,
              ),

              record(
                "b",
                600,
                80,
              ),
            ],
            criteria,
            0.8,
          );

        expect(
          result.distinctTopRunIds.length,
        ).toBeGreaterThan(
          1,
        );

        expect(
          result.rankReversalDetected,
        ).toBe(
          true,
        );

        expect(
          result.topAlternativeStable,
        ).toBe(
          false,
        );
      },
    );

    it(
      "rejects invalid perturbation fractions",
      () => {
        expect(
          () =>
            analyzeMcdaSensitivity(
              [
                record(
                  "a",
                  500,
                  95,
                ),

                record(
                  "b",
                  600,
                  85,
                ),
              ],
              criteria,
              1,
            ),
        ).toThrow(
          /perturbation/,
        );
      },
    );
  },
);
