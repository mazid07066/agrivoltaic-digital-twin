import {
  describe,
  expect,
  it,
} from "vitest";

import {
  analyzePersistedRuns,
} from "../multiRunAnalytics";

import type {
  ComparableRunRecord,
} from "../types";

function createRecord(
  runId:
    string,

  dailyEnergyKwh:
    number,

  cropDli:
    number,

  ler:
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
        `Scenario ${runId}`,

      scenarioType:
        "agrivoltaic",

      isBaseline:
        runId ===
        "run-a",

      projectId:
        "project-1",

      siteId:
        "site-1",

      siteVersionId:
        "version-1",

      siteVersionNumber:
        1,

      siteType:
        "land_agrivoltaic",

      siteName:
        "Test Site",

      simulationDate:
        "2026-08-20",

      engineKind:
        "land",

      engineVersion:
        "engine-v1",

      controllerVersion:
        null,

      weatherAdapterVersion:
        "weather-v1",

      executionFingerprint:
        `execution-${runId}`,

      environmentFingerprint:
        "environment-1",

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

      dailyEnergyKwh,

      specificYieldKwhPerKw:
        dailyEnergyKwh /
        100,

      openFieldDliMolM2:
        20,

      cropDliMolM2:
        cropDli,

      estimatedCropYieldPercent:
        90,

      landEquivalentRatio:
        ler,

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
        80,

      maximumGcr:
        40,

      minimumLer:
        1,

      minimumPanelHeightM:
        null,

      maximumDliReduction:
        30,

      minimumRenewableEnergyKwh:
        400,

      policyPreset:
        "test",
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

describe(
  "Phase 9D-4 multi-run analytics",
  () => {
    it(
      "calculates study-set metric statistics",
      () => {
        const result =
          analyzePersistedRuns([
            createRecord(
              "run-a",
              500,
              18,
              1.1,
            ),

            createRecord(
              "run-b",
              550,
              17,
              1.2,
            ),

            createRecord(
              "run-c",
              600,
              19,
              1.3,
            ),
          ]);

        expect(
          result.runCount,
        ).toBe(
          3,
        );

        const energy =
          result.metricStatistics.find(
            (
              metric,
            ) =>
              metric.key ===
              "dailyEnergyKwh",
          );

        expect(
          energy?.minimum,
        ).toBe(
          500,
        );

        expect(
          energy?.maximum,
        ).toBe(
          600,
        );

        expect(
          energy?.mean,
        ).toBe(
          550,
        );

        expect(
          energy?.bestRunId,
        ).toBe(
          "run-c",
        );
      },
    );

    it(
      "includes policy evaluation for every run",
      () => {
        const result =
          analyzePersistedRuns([
            createRecord(
              "run-a",
              500,
              18,
              1.1,
            ),

            createRecord(
              "run-b",
              550,
              17,
              1.2,
            ),
          ]);

        expect(
          result.records,
        ).toHaveLength(
          2,
        );

        expect(
          result.records[0]
            .policyEvaluation
            .schema,
        ).toBe(
          "agritwin-policy-evaluation-v1",
        );
      },
    );

    it(
      "rejects one-run study sets",
      () => {
        expect(
          () =>
            analyzePersistedRuns([
              createRecord(
                "run-a",
                500,
                18,
                1.1,
              ),
            ]),
        ).toThrow(
          /at least two/,
        );
      },
    );

    it(
      "rejects duplicate runs",
      () => {
        const run =
          createRecord(
            "run-a",
            500,
            18,
            1.1,
          );

        expect(
          () =>
            analyzePersistedRuns([
              run,
              run,
            ]),
        ).toThrow(
          /duplicate/,
        );
      },
    );
  },
);
