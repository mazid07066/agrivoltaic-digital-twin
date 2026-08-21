import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  ComparableRunRecord,
} from "../types";

import {
  comparePersistedRunRecords,
} from "../baselineComparison";

function createRecord(
  runId:
    string,

  dailyEnergyKwh:
    number | null,

  cropDliMolM2:
    number | null,
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
        false,

      projectId:
        "project-1",

      siteId:
        "site-1",

      siteVersionId:
        "site-version-1",

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
        "input-fingerprint",

      environmentFingerprint:
        "environment-fingerprint",

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
        5,

      openFieldDliMolM2:
        20,

      cropDliMolM2,

      estimatedCropYieldPercent:
        90,

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

describe(
  "Phase 9D persisted run comparison",
  () => {
    it(
      "calculates absolute and relative differences",
      () => {
        const reference =
          createRecord(
            "reference",
            500,
            20,
          );

        const alternative =
          createRecord(
            "alternative",
            550,
            18,
          );

        const result =
          comparePersistedRunRecords(
            reference,
            alternative,
          );

        const energy =
          result.metrics.find(
            (metric) =>
              metric.key ===
              "dailyEnergyKwh",
          );

        expect(
          energy?.absoluteDelta,
        ).toBe(
          50,
        );

        expect(
          energy?.relativeChangePercent,
        ).toBeCloseTo(
          10,
        );
      },
    );

    it(
      "keeps unavailable metrics explicitly unavailable",
      () => {
        const reference =
          createRecord(
            "reference",
            500,
            null,
          );

        const alternative =
          createRecord(
            "alternative",
            550,
            18,
          );

        const result =
          comparePersistedRunRecords(
            reference,
            alternative,
          );

        const cropDli =
          result.metrics.find(
            (metric) =>
              metric.key ===
              "cropDliMolM2",
          );

        expect(
          cropDli?.available,
        ).toBe(
          false,
        );

        expect(
          cropDli?.absoluteDelta,
        ).toBeNull();
      },
    );

    it(
      "rejects comparing a run with itself",
      () => {
        const record =
          createRecord(
            "same",
            500,
            20,
          );

        expect(
          () =>
            comparePersistedRunRecords(
              record,
              record,
            ),
        ).toThrow(
          /different/,
        );
      },
    );
  },
);
