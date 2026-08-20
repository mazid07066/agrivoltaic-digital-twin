import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createExecutionFingerprint,
} from "../fingerprint";

import {
  verifyPersistedSimulationRun,
} from "../reproducibility";

import type {
  PersistedSimulationRun,
} from "../persistedRunTypes";

function createRun():
  PersistedSimulationRun {
  const inputWithoutFingerprint = {
    schema:
      "agritwin-execution-input-v1" as const,

    inputFingerprint:
      null,

    simulationDate:
      "2025-06-01",

    engine: {
      executionContractVersion:
        "9c-v1",

      engineKind:
        "land" as const,

      engineVersion:
        "agritwin-land-phase7b",

      controllerVersion:
        "agritwin-adaptive-controller-phase7b",

      weatherAdapterVersion:
        "agritwin-environment-9b-v1",

      moduleCatalogueVersion:
        null,
    },

    scenario: {
      scenarioId:
        "44444444-4444-4444-8444-444444444444",

      scenarioVersion:
        5,

      scenarioName:
        "Reproducibility Test",

      scenarioType:
        "agrivoltaic",

      isBaseline:
        false,
    },

    site: {
      projectId:
        "11111111-1111-4111-8111-111111111111",

      siteId:
        "22222222-2222-4222-8222-222222222222",

      siteVersionId:
        "33333333-3333-4333-8333-333333333333",

      siteVersionNumber:
        2,

      siteSchemaVersion:
        1,

      siteType:
        "land_agrivoltaic" as const,

      siteName:
        "Test Site",
    },

    scenarioConfiguration: {
      technicalConfig:
        {},

      agriculturalConfig:
        {},

      weatherConfig:
        {},

      policyConfig:
        {},

      economicConfig:
        {},

      metadata:
        {},
    },

    siteConfiguration:
      {} as never,

    environment: {
      source:
        "open_meteo" as const,

      mode:
        "historical" as const,

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
    },
  };

  const fingerprint =
    createExecutionFingerprint({
      ...inputWithoutFingerprint,

      inputFingerprint:
        undefined,
    });

  const inputSnapshot = {
    ...inputWithoutFingerprint,

    inputFingerprint:
      fingerprint,
  };

  return {
    id:
      "55555555-5555-4555-8555-555555555555",

    projectId:
      inputSnapshot.site
        .projectId,

    siteId:
      inputSnapshot.site
        .siteId,

    siteVersionId:
      inputSnapshot.site
        .siteVersionId,

    scenarioId:
      inputSnapshot.scenario
        .scenarioId,

    status:
      "completed",

    simulationDate:
      inputSnapshot
        .simulationDate,

    engineVersion:
      inputSnapshot.engine
        .engineVersion,

    controllerVersion:
      inputSnapshot.engine
        .controllerVersion,

    siteSchemaVersion:
      inputSnapshot.site
        .siteSchemaVersion,

    moduleCatalogueVersion:
      null,

    weatherAdapterVersion:
      inputSnapshot.engine
        .weatherAdapterVersion,

    inputSnapshot,

    weatherSnapshot:
      null,

    resultSummary:
      {},

    warnings:
      [],

    errorMessage:
      null,

    requestedBy:
      null,

    startedAt:
      "2026-08-20T10:00:00.000Z",

    completedAt:
      "2026-08-20T10:00:01.000Z",

    createdAt:
      "2026-08-20T10:00:00.000Z",

    hourly:
      Array.from(
        {
          length:
            24,
        },
        (
          _,
          hourIndex,
        ) => ({
          hourIndex,

          timestamp:
            `2025-06-01T${String(
              hourIndex,
            ).padStart(
              2,
              "0",
            )}:00`,

          solarAltitudeDeg:
            null,

          solarAzimuthDeg:
            null,

          ghiWm2:
            null,

          poaWm2:
            null,

          moduleTemperatureC:
            null,

          pvPowerKw:
            null,

          trackerAngleDeg:
            null,

          trackingState:
            null,

          openFieldDliIncrementMolM2:
            null,

          cropDliIncrementMolM2:
            null,

          additionalValues:
            {},
        }),
      ),

    spatial:
      [],
  };
}

describe(
  "Phase 9C persisted-run reproducibility",
  () => {
    it(
      "verifies an unchanged persisted run",
      () => {
        const report =
          verifyPersistedSimulationRun(
            createRun(),
          );

        expect(
          report.verified,
        ).toBe(
          true,
        );

        expect(
          report.checks.every(
            (item) =>
              item.passed,
          ),
        ).toBe(
          true,
        );

        expect(
          report.inputFingerprint,
        ).toBe(
          report
            .recomputedInputFingerprint,
        );
      },
    );

    it(
      "detects changed engine metadata",
      () => {
        const run =
          createRun();

        run.engineVersion =
          "unexpected-engine";

        const report =
          verifyPersistedSimulationRun(
            run,
          );

        expect(
          report.verified,
        ).toBe(
          false,
        );

        expect(
          report.checks.find(
            (item) =>
              item.key ===
              "engineVersion",
          )?.passed,
        ).toBe(
          false,
        );
      },
    );

    it(
      "detects an altered execution snapshot",
      () => {
        const run =
          createRun();

        run.inputSnapshot = {
          ...run.inputSnapshot,

          simulationDate:
            "2025-06-02",
        };

        const report =
          verifyPersistedSimulationRun(
            run,
          );

        expect(
          report.verified,
        ).toBe(
          false,
        );

        expect(
          report.checks.find(
            (item) =>
              item.key ===
              "inputFingerprint",
          )?.passed,
        ).toBe(
          false,
        );
      },
    );
  },
);
