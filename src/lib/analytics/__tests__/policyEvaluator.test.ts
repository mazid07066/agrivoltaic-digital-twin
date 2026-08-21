import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  ComparableRunRecord,
} from "../types";

import {
  evaluatePolicyConstraints,
} from "../policyEvaluator";

function record():
  ComparableRunRecord {
  return {
    schema:
      "agritwin-comparable-run-v1",

    identity: {
      runId:
        "run-1",

      scenarioId:
        "scenario-1",

      scenarioVersion:
        1,

      scenarioName:
        "Policy Test",

      scenarioType:
        "agrivoltaic",

      isBaseline:
        false,

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
        "input",

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
        500,

      specificYieldKwhPerKw:
        5,

      openFieldDliMolM2:
        20,

      cropDliMolM2:
        17,

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
        85,

      maximumGcr:
        40,

      minimumLer:
        1.1,

      minimumPanelHeightM:
        null,

      maximumDliReduction:
        20,

      minimumRenewableEnergyKwh:
        450,

      policyPreset:
        "test-policy",
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
  "Phase 9D-3 policy evaluator",
  () => {
    it(
      "passes configured policy constraints",
      () => {
        const result =
          evaluatePolicyConstraints(
            record(),
          );

        expect(
          result.overallStatus,
        ).toBe(
          "pass",
        );

        expect(
          result.failedConstraintCount,
        ).toBe(
          0,
        );
      },
    );

    it(
      "fails when a threshold is violated",
      () => {
        const input =
          record();

        input.policy.minimumLer =
          1.4;

        const result =
          evaluatePolicyConstraints(
            input,
          );

        expect(
          result.overallStatus,
        ).toBe(
          "fail",
        );

        expect(
          result.constraints.find(
            (
              constraint,
            ) =>
              constraint.key ===
              "minimumLer",
          )?.status,
        ).toBe(
          "fail",
        );
      },
    );

    it(
      "marks unconfigured thresholds explicitly",
      () => {
        const input =
          record();

        input.policy.minimumLer =
          null;

        const result =
          evaluatePolicyConstraints(
            input,
          );

        expect(
          result.constraints.find(
            (
              constraint,
            ) =>
              constraint.key ===
              "minimumLer",
          )?.status,
        ).toBe(
          "not_configured",
        );
      },
    );
  },
);

describe(
  "Phase 9D normalized policy percentage contract",
  () => {
    it(
      "compares normalized crop-retention and GCR policy fractions against percentage-valued simulation metrics",
      () => {
        const record = {
          schema:
            "agritwin-comparable-run-v1",

          identity: {
            runId:
              "phase9d-policy-test",

            scenarioId:
              "scenario-1",

            scenarioName:
              "Policy normalization test",

            scenarioVersion:
          1,

        scenarioType:
              "agrivoltaic",

            isBaseline:
              true,

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
              "Test site",

            simulationDate:
              "2026-08-20",

            engineKind:
              "land",

            engineVersion:
              "test-engine",

            controllerVersion:
              null,

            weatherAdapterVersion:
              null,

            executionFingerprint:
              "test-execution",

            environmentFingerprint:
              "test-environment",

            reproducibilityVerified:
              true,
          },

          summary: {
            engineKind:
              "land",

            siteType:
              "land_agrivoltaic",

            installedCapacityKw:
              33,

            dailyEnergyKwh:
              97.47,

            specificYieldKwhPerKw:
              2.9536,

            openFieldDliMolM2:
              50,

            cropDliMolM2:
              44.12,

            estimatedCropYieldPercent:
              88.2,

            landEquivalentRatio:
              1.6,

            groundCoverageRatioPercent:
              17.6,

            usableAreaPercent:
              null,

            moduleCount:
              null,

            additionalMetrics:
              {},
          },

          policy: {
            minimumCropRetention:
              0.8,

            maximumGcr:
              0.4,

            minimumLer:
              1.1,

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
        } as const;

        const evaluation =
          evaluatePolicyConstraints(
            record,
          );

        const crop =
          evaluation.constraints.find(
            (constraint) =>
              constraint.key ===
              "minimumCropRetention",
          );

        const gcr =
          evaluation.constraints.find(
            (constraint) =>
              constraint.key ===
              "maximumGcr",
          );

        const ler =
          evaluation.constraints.find(
            (constraint) =>
              constraint.key ===
              "minimumLer",
          );

        expect(
          crop?.actualValue,
        ).toBe(
          88.2,
        );

        expect(
          crop?.thresholdValue,
        ).toBe(
          80,
        );

        expect(
          crop?.status,
        ).toBe(
          "pass",
        );

        expect(
          gcr?.actualValue,
        ).toBe(
          17.6,
        );

        expect(
          gcr?.thresholdValue,
        ).toBe(
          40,
        );

        expect(
          gcr?.status,
        ).toBe(
          "pass",
        );

        expect(
          ler?.thresholdValue,
        ).toBe(
          1.1,
        );

        expect(
          ler?.status,
        ).toBe(
          "pass",
        );

        expect(
          evaluation.overallStatus,
        ).toBe(
          "pass",
        );
      },
    );
  },
);
