import {
  describe,
  expect,
  it,
} from "vitest";

import {
  assessMcdaCriterionEligibility,
  createDefaultMcdaCriteria,
  evaluateMcda,
} from "../mcda";

import type {
  ComparableRunRecord,
  McdaCriterionConfiguration,
} from "../types";

interface RecordOptions {
  runId:
    string;

  dailyEnergyKwh:
    number;

  specificYieldKwhPerKw?:
    number;

  cropDliMolM2?:
    number | null;

  landEquivalentRatio?:
    number | null;

  estimatedCropYieldPercent?:
    number | null;

  siteType?:
    "land_agrivoltaic"
    | "flat_roof";

  engineKind?:
    "land"
    | "rooftop";

  reproducibilityVerified?:
    boolean;
}

function createRecord(
  options:
    RecordOptions,
): ComparableRunRecord {
  const siteType =
    options.siteType ??
    "land_agrivoltaic";

  const engineKind =
    options.engineKind ??
    "land";

  return {
    schema:
      "agritwin-comparable-run-v1",

    identity: {
      runId:
        options.runId,

      scenarioId:
        `scenario-${options.runId}`,

      scenarioVersion:
        1,

      scenarioName:
        `Scenario ${options.runId}`,

      scenarioType:
        "agrivoltaic",

      isBaseline:
        options.runId ===
        "run-a",

      projectId:
        "project-1",

      siteId:
        "site-1",

      siteVersionId:
        `version-${options.runId}`,

      siteVersionNumber:
        1,

      siteType,

      siteName:
        "MCDA Test Site",

      simulationDate:
        "2026-08-20",

      engineKind,

      engineVersion:
        "engine-v1",

      controllerVersion:
        null,

      weatherAdapterVersion:
        "weather-v1",

      executionFingerprint:
        `execution-${options.runId}`,

      environmentFingerprint:
        "environment-1",

      reproducibilityVerified:
        options.reproducibilityVerified ??
        true,
    },

    summary: {
      engineKind,

      siteType,

      installedCapacityKw:
        100,

      dailyEnergyKwh:
        options.dailyEnergyKwh,

      specificYieldKwhPerKw:
        options.specificYieldKwhPerKw ??
        options.dailyEnergyKwh /
          100,

      openFieldDliMolM2:
        siteType ===
        "land_agrivoltaic"
          ? 20
          : null,

      cropDliMolM2:
        options.cropDliMolM2 ===
        undefined
          ? 17
          : options.cropDliMolM2,

      estimatedCropYieldPercent:
        options.estimatedCropYieldPercent ===
        undefined
          ? 90
          : options.estimatedCropYieldPercent,

      landEquivalentRatio:
        options.landEquivalentRatio ===
        undefined
          ? 1.2
          : options.landEquivalentRatio,

      groundCoverageRatioPercent:
        35,

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
  "Phase 9D-6 MCDA",
  () => {
    it(
      "identifies complete benefit criteria as eligible",
      () => {
        const records = [
          createRecord({
            runId:
              "run-a",

            dailyEnergyKwh:
              500,
          }),

          createRecord({
            runId:
              "run-b",

            dailyEnergyKwh:
              600,
          }),
        ];

        const eligibility =
          assessMcdaCriterionEligibility(
            records,
          );

        const energy =
          eligibility.find(
            (
              criterion,
            ) =>
              criterion.key ===
              "dailyEnergyKwh",
          );

        expect(
          energy?.eligible,
        ).toBe(
          true,
        );

        const capacity =
          eligibility.find(
            (
              criterion,
            ) =>
              criterion.key ===
              "installedCapacityKw",
          );

        expect(
          capacity?.eligible,
        ).toBe(
          false,
        );

        expect(
          capacity?.sourceDirection,
        ).toBe(
          "neutral",
        );
      },
    );

    it(
      "excludes metrics with missing evidence from default criteria",
      () => {
        const records = [
          createRecord({
            runId:
              "run-a",

            dailyEnergyKwh:
              500,

            cropDliMolM2:
              17,
          }),

          createRecord({
            runId:
              "run-b",

            dailyEnergyKwh:
              600,

            cropDliMolM2:
              null,
          }),
        ];

        const criteria =
          createDefaultMcdaCriteria(
            records,
          );

        expect(
          criteria.some(
            (
              criterion,
            ) =>
              criterion.key ===
              "cropDliMolM2",
          ),
        ).toBe(
          false,
        );

        expect(
          criteria.some(
            (
              criterion,
            ) =>
              criterion.key ===
              "dailyEnergyKwh",
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "uses equal normalized default weights",
      () => {
        const records = [
          createRecord({
            runId:
              "run-a",

            dailyEnergyKwh:
              500,
          }),

          createRecord({
            runId:
              "run-b",

            dailyEnergyKwh:
              600,
          }),
        ];

        const criteria =
          createDefaultMcdaCriteria(
            records,
          );

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

        expect(
          total,
        ).toBeCloseTo(
          1,
          12,
        );
      },
    );

    it(
      "normalizes benefit criteria so the highest value receives one",
      () => {
        const records = [
          createRecord({
            runId:
              "run-a",

            dailyEnergyKwh:
              500,
          }),

          createRecord({
            runId:
              "run-b",

            dailyEnergyKwh:
              600,
          }),

          createRecord({
            runId:
              "run-c",

            dailyEnergyKwh:
              550,
          }),
        ];

        const criteria:
          McdaCriterionConfiguration[] =
          [
            {
              key:
                "dailyEnergyKwh",

              label:
                "Daily energy",

              unit:
                "kWh",

              direction:
                "benefit",

              weight:
                1,
            },
          ];

        const result =
          evaluateMcda(
            records,
            criteria,
          );

        expect(
          result.alternatives[0]
            .runId,
        ).toBe(
          "run-b",
        );

        expect(
          result.alternatives[0]
            .score,
        ).toBeCloseTo(
          1,
          12,
        );

        const worst =
          result.alternatives.find(
            (
              alternative,
            ) =>
              alternative.runId ===
              "run-a",
          );

        expect(
          worst?.score,
        ).toBeCloseTo(
          0,
          12,
        );
      },
    );

    it(
      "normalizes cost criteria so the lowest value receives one",
      () => {
        const records = [
          createRecord({
            runId:
              "run-a",

            dailyEnergyKwh:
              500,
          }),

          createRecord({
            runId:
              "run-b",

            dailyEnergyKwh:
              600,
          }),
        ];

        const result =
          evaluateMcda(
            records,
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

                weight:
                  1,
              },
            ],
          );

        expect(
          result.alternatives[0]
            .runId,
        ).toBe(
          "run-a",
        );
      },
    );

    it(
      "normalizes arbitrary positive user weights",
      () => {
        const records = [
          createRecord({
            runId:
              "run-a",

            dailyEnergyKwh:
              500,

            landEquivalentRatio:
              1.4,
          }),

          createRecord({
            runId:
              "run-b",

            dailyEnergyKwh:
              600,

            landEquivalentRatio:
              1.1,
          }),
        ];

        const result =
          evaluateMcda(
            records,
            [
              {
                key:
                  "dailyEnergyKwh",

                label:
                  "Daily energy",

                unit:
                  "kWh",

                direction:
                  "benefit",

                weight:
                  70,
              },

              {
                key:
                  "landEquivalentRatio",

                label:
                  "LER",

                unit:
                  null,

                direction:
                  "benefit",

                weight:
                  30,
              },
            ],
          );

        expect(
          result.criteria[0]
            .weight,
        ).toBeCloseTo(
          0.7,
          12,
        );

        expect(
          result.criteria[1]
            .weight,
        ).toBeCloseTo(
          0.3,
          12,
        );

        expect(
          result.alternatives[0]
            .runId,
        ).toBe(
          "run-b",
        );
      },
    );

    it(
      "rejects missing criterion evidence",
      () => {
        const records = [
          createRecord({
            runId:
              "run-a",

            dailyEnergyKwh:
              500,

            cropDliMolM2:
              17,
          }),

          createRecord({
            runId:
              "run-b",

            dailyEnergyKwh:
              600,

            cropDliMolM2:
              null,
          }),
        ];

        expect(
          () =>
            evaluateMcda(
              records,
              [
                {
                  key:
                    "cropDliMolM2",

                  label:
                    "Crop DLI",

                  unit:
                    "mol/m²/day",

                  direction:
                    "benefit",

                  weight:
                    1,
                },
              ],
            ),
        ).toThrow(
          /unavailable/,
        );
      },
    );

    it(
      "rejects scientifically incompatible study sets",
      () => {
        const records = [
          createRecord({
            runId:
              "land",

            dailyEnergyKwh:
              500,

            siteType:
              "land_agrivoltaic",

            engineKind:
              "land",
          }),

          createRecord({
            runId:
              "roof",

            dailyEnergyKwh:
              600,

            siteType:
              "flat_roof",

            engineKind:
              "rooftop",
          }),
        ];

        expect(
          () =>
            evaluateMcda(
              records,
              [
                {
                  key:
                    "dailyEnergyKwh",

                  label:
                    "Daily energy",

                  unit:
                    "kWh",

                  direction:
                    "benefit",

                  weight:
                    1,
                },
              ],
            ),
        ).toThrow(
          /incompatible/,
        );
      },
    );

    it(
      "handles identical criterion values without division by zero",
      () => {
        const records = [
          createRecord({
            runId:
              "run-a",

            dailyEnergyKwh:
              500,
          }),

          createRecord({
            runId:
              "run-b",

            dailyEnergyKwh:
              500,
          }),
        ];

        const result =
          evaluateMcda(
            records,
            [
              {
                key:
                  "dailyEnergyKwh",

                label:
                  "Daily energy",

                unit:
                  "kWh",

                direction:
                  "benefit",

                weight:
                  1,
              },
            ],
          );

        expect(
          result.alternatives[0]
            .score,
        ).toBeCloseTo(
          1,
          12,
        );

        expect(
          result.alternatives[1]
            .score,
        ).toBeCloseTo(
          1,
          12,
        );

        expect(
          result.alternatives[0]
            .rank,
        ).toBe(
          1,
        );

        expect(
          result.alternatives[1]
            .rank,
        ).toBe(
          1,
        );

        expect(
          result.warnings.some(
            (
              warning,
            ) =>
              warning.includes(
                "identical values",
              ),
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "assigns equal ranks to equal weighted scores",
      () => {
        const records = [
          createRecord({
            runId:
              "run-a",

            dailyEnergyKwh:
              500,
          }),

          createRecord({
            runId:
              "run-b",

            dailyEnergyKwh:
              500,
          }),

          createRecord({
            runId:
              "run-c",

            dailyEnergyKwh:
              400,
          }),
        ];

        const result =
          evaluateMcda(
            records,
            [
              {
                key:
                  "dailyEnergyKwh",

                label:
                  "Daily energy",

                unit:
                  "kWh",

                direction:
                  "benefit",

                weight:
                  1,
              },
            ],
          );

        const runA =
          result.alternatives.find(
            (
              alternative,
            ) =>
              alternative.runId ===
              "run-a",
          );

        const runB =
          result.alternatives.find(
            (
              alternative,
            ) =>
              alternative.runId ===
              "run-b",
          );

        const runC =
          result.alternatives.find(
            (
              alternative,
            ) =>
              alternative.runId ===
              "run-c",
          );

        expect(
          runA?.rank,
        ).toBe(
          1,
        );

        expect(
          runB?.rank,
        ).toBe(
          1,
        );

        expect(
          runC?.rank,
        ).toBe(
          3,
        );
      },
    );
  },
);
