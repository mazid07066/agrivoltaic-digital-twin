import {
  describe,
  expect,
  it,
} from "vitest";

import {
  assessStudyCompatibility,
} from "../studyCompatibility";

import type {
  ComparableRunRecord,
} from "../types";

function createRecord(
  input: {
    runId:
      string;

    siteType?:
      "land_agrivoltaic" |
      "flat_roof";

    engineKind?:
      "land" |
      "rooftop";

    projectId?:
      string;

    siteId?:
      string;

    simulationDate?:
      string;

    environmentFingerprint?:
      string;

    reproducibilityVerified?:
      boolean;
  },
): ComparableRunRecord {
  const siteType =
    input.siteType ??
    "land_agrivoltaic";

  const engineKind =
    input.engineKind ??
    "land";

  return {
    schema:
      "agritwin-comparable-run-v1",

    identity: {
      runId:
        input.runId,

      scenarioId:
        `scenario-${input.runId}`,

      scenarioVersion:
        1,

      scenarioName:
        `Scenario ${input.runId}`,

      scenarioType:
        "agrivoltaic",

      isBaseline:
        false,

      projectId:
        input.projectId ??
        "project-1",

      siteId:
        input.siteId ??
        "site-1",

      siteVersionId:
        `version-${input.runId}`,

      siteVersionNumber:
        1,

      siteType,

      siteName:
        "Test Site",

      simulationDate:
        input.simulationDate ??
        "2026-08-20",

      engineKind,

      engineVersion:
        "engine-v1",

      controllerVersion:
        null,

      weatherAdapterVersion:
        "weather-v1",

      executionFingerprint:
        `execution-${input.runId}`,

      environmentFingerprint:
        input.environmentFingerprint ??
        "environment-1",

      reproducibilityVerified:
        input.reproducibilityVerified ??
        true,
    },

    summary: {
      engineKind,

      siteType,

      installedCapacityKw:
        100,

      dailyEnergyKwh:
        500,

      specificYieldKwhPerKw:
        5,

      openFieldDliMolM2:
        siteType ===
        "land_agrivoltaic"
          ? 20
          : null,

      cropDliMolM2:
        siteType ===
        "land_agrivoltaic"
          ? 17
          : null,

      estimatedCropYieldPercent:
        siteType ===
        "land_agrivoltaic"
          ? 90
          : null,

      landEquivalentRatio:
        siteType ===
        "land_agrivoltaic"
          ? 1.2
          : null,

      groundCoverageRatioPercent:
        siteType ===
        "land_agrivoltaic"
          ? 35
          : null,

      usableAreaPercent:
        siteType ===
        "flat_roof"
          ? 80
          : null,

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
  "Phase 9D-5 study compatibility",
  () => {
    it(
      "accepts equivalent scientific run contexts",
      () => {
        const report =
          assessStudyCompatibility([
            createRecord({
              runId:
                "run-a",
            }),

            createRecord({
              runId:
                "run-b",
            }),
          ]);

        expect(
          report.compatible,
        ).toBe(
          true,
        );

        expect(
          report.level,
        ).toBe(
          "compatible",
        );
      },
    );

    it(
      "warns when environmental evidence differs",
      () => {
        const report =
          assessStudyCompatibility([
            createRecord({
              runId:
                "run-a",

              environmentFingerprint:
                "environment-a",
            }),

            createRecord({
              runId:
                "run-b",

              environmentFingerprint:
                "environment-b",
            }),
          ]);

        expect(
          report.compatible,
        ).toBe(
          true,
        );

        expect(
          report.level,
        ).toBe(
          "warning",
        );
      },
    );

    it(
      "rejects mixed site types and engines",
      () => {
        const report =
          assessStudyCompatibility([
            createRecord({
              runId:
                "land",

              siteType:
                "land_agrivoltaic",

              engineKind:
                "land",
            }),

            createRecord({
              runId:
                "roof",

              siteType:
                "flat_roof",

              engineKind:
                "rooftop",
            }),
          ]);

        expect(
          report.compatible,
        ).toBe(
          false,
        );

        expect(
          report.level,
        ).toBe(
          "incompatible",
        );
      },
    );

    it(
      "rejects unverified persisted evidence",
      () => {
        const report =
          assessStudyCompatibility([
            createRecord({
              runId:
                "run-a",
            }),

            createRecord({
              runId:
                "run-b",

              reproducibilityVerified:
                false,
            }),
          ]);

        expect(
          report.compatible,
        ).toBe(
          false,
        );
      },
    );
  },
);
