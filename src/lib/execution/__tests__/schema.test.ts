import {
  describe,
  expect,
  it,
} from "vitest";

import {
  canonicalHourlySimulationPointSchema,
  environmentalExecutionIdentitySchema,
  executionIdentitySchema,
  simulationEngineIdentitySchema,
} from "../schema";

describe(
  "Phase 9C execution contract schemas",
  () => {
    it(
      "accepts a valid execution identity",
      () => {
        const value =
          executionIdentitySchema.parse({
            projectId:
              "11111111-1111-4111-8111-111111111111",

            siteId:
              "22222222-2222-4222-8222-222222222222",

            siteVersionId:
              "33333333-3333-4333-8333-333333333333",

            scenarioId:
              "44444444-4444-4444-8444-444444444444",

            scenarioVersion:
              2,

            simulationDate:
              "2025-06-01",
          });

        expect(
          value.scenarioVersion,
        ).toBe(
          2,
        );
      },
    );

    it(
      "accepts land engine identity",
      () => {
        const value =
          simulationEngineIdentitySchema.parse({
            executionContractVersion:
              "9c-v1",

            engineKind:
              "land",

            engineVersion:
              "agritwin-land-phase7b",

            controllerVersion:
              "agritwin-adaptive-controller-phase7b",

            weatherAdapterVersion:
              "agritwin-environment-9b-v1",

            moduleCatalogueVersion:
              null,
          });

        expect(
          value.engineKind,
        ).toBe(
          "land",
        );
      },
    );

    it(
      "accepts environmental execution identity",
      () => {
        const value =
          environmentalExecutionIdentitySchema.parse({
            source:
              "open_meteo",

            mode:
              "historical",

            datasetId:
              null,

            requestFingerprint:
              "sha256:request",

            datasetFingerprint:
              "sha256:dataset",

            requestedCoordinate: {
              latitude:
                23.8103,

              longitude:
                90.4125,
            },

            resolvedCoordinate: {
              latitude:
                23.796133,

              longitude:
                90.38055,
            },

            timezone:
              "Asia/Dhaka",

            startTime:
              "2025-06-01T00:00",

            endTime:
              "2025-06-01T23:00",

            recordCount:
              24,

            expectedRecordCount:
              24,

            coveragePercent:
              100,

            missingRequiredValueCount:
              0,

            warnings:
              [],
          });

        expect(
          value.recordCount,
        ).toBe(
          24,
        );
      },
    );

    it(
      "validates canonical hourly output",
      () => {
        const point =
          canonicalHourlySimulationPointSchema.parse({
            hourIndex:
              12,

            timestamp:
              "2025-06-01T12:00",

            solarAltitudeDeg:
              70,

            solarAzimuthDeg:
              180,

            ghiWm2:
              800,

            poaWm2:
              850,

            moduleTemperatureC:
              44,

            pvPowerKw:
              12.5,

            trackerAngleDeg:
              10,

            trackingState:
              "standard",

            openFieldDliIncrementMolM2:
              1.5,

            cropDliIncrementMolM2:
              1.1,

            additionalValues:
              {},
          });

        expect(
          point.hourIndex,
        ).toBe(
          12,
        );
      },
    );
  },
);
