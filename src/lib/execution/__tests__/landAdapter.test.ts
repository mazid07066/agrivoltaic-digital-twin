import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  EnvironmentalDataset,
} from "@/lib/environment/types";

import type {
  SiteVersionSnapshot,
} from "@/lib/projects/types";

import type {
  Scenario,
} from "@/lib/scenarios/types";

import {
  createDefaultLandSiteProfile,
} from "@/lib/sites/defaults";

import {
  createSimulationExecutionInputSnapshot,
} from "../inputSnapshot";

import {
  executeLandSimulation,
} from "../landAdapter";

import type {
  ResolvedSimulationExecutionInput,
} from "../types";

const PROJECT_ID =
  "11111111-1111-4111-8111-111111111111";

const SITE_ID =
  "22222222-2222-4222-8222-222222222222";

const VERSION_ID =
  "33333333-3333-4333-8333-333333333333";

const SCENARIO_ID =
  "44444444-4444-4444-8444-444444444444";

function scenario():
  Scenario {
  return {
    id:
      SCENARIO_ID,

    projectId:
      PROJECT_ID,

    siteId:
      SITE_ID,

    name:
      "Phase 9C Land Execution",

    description:
      null,

    scenarioType:
      "agrivoltaic",

    status:
      "ready",

    isBaseline:
      false,

    parentScenarioId:
      null,

    scenarioVersion:
      2,

    configuration:
      {},

    technicalConfig:
      {},

    agriculturalConfig:
      {},

    weatherConfig: {
      source:
        "uploaded_dataset",

      mode:
        "dataset",

      year:
        2017,

      startDate:
        "2017-06-08",

      endDate:
        "2017-06-08",

      datasetId:
        "solar-mem-data-v1",
    },

    policyConfig:
      {},

    economicConfig:
      {},

    metadata:
      {},

    createdBy:
      null,

    createdAt:
      "2026-08-20T00:00:00.000Z",

    updatedAt:
      "2026-08-20T00:00:00.000Z",

    archivedAt:
      null,
  };
}

function siteVersion():
  SiteVersionSnapshot {
  const site =
    createDefaultLandSiteProfile();

  return {
    id:
      VERSION_ID,

    siteId:
      SITE_ID,

    versionNumber:
      4,

    schemaVersion:
      site.schemaVersion,

    configuration: {
      ...site,

      id:
        SITE_ID,

      name:
        "Land Execution Site",

      /*
       * Intentionally different from the
       * environmental date. The adapter must
       * execute 2017-06-08 without mutating
       * this stored site snapshot.
       */
      simulationDate:
        "2026-08-20",

      location: {
        ...site.location,

        latitude:
          23.8103,

        longitude:
          90.4125,

        timezone:
          "Asia/Dhaka",
      },
    },

    configurationHash:
      "site-hash",

    changeSummary:
      "Execution test",

    createdAt:
      "2026-08-20T00:00:00.000Z",
  };
}

function environment():
  EnvironmentalDataset {
  const hourly =
    Array.from(
      {
        length:
          24,
      },

      (
        _,
        hour,
      ) => {
        const daylight =
          hour >= 6 &&
          hour <= 18;

        const ghi =
          daylight
            ? Math.max(
                0,
                800 *
                  Math.sin(
                    (
                      (hour - 6) /
                      12
                    ) *
                      Math.PI,
                  ),
              )
            : 0;

        return {
          timestamp:
            `2017-06-08T${String(
              hour,
            ).padStart(
              2,
              "0",
            )}:00`,

          ghiWm2:
            ghi,

          dniWm2:
            ghi * 0.75,

          dhiWm2:
            ghi * 0.25,

          temperatureC:
            29,

          relativeHumidityPct:
            75,

          cloudCoverPct:
            null,

          windSpeedMs:
            3,

          windDirectionDeg:
            180,

          precipitationMm:
            0,

          pressureHpa:
            1000,

          et0Mm:
            null,
        };
      },
    );

  return {
    schemaVersion:
      1,

    provenance: {
      source:
        "uploaded_dataset",

      mode:
        "dataset",

      provider:
        "Solar-MEM",

      requestedCoordinate: {
        latitude:
          23.8103,

        longitude:
          90.4125,
      },

      resolvedCoordinate:
        null,

      timezone:
        "Asia/Dhaka",

      retrievedAt:
        "2026-08-20T00:00:00.000Z",

      datasetId:
        "solar-mem-data-v1",

      requestFingerprint:
        "sha256:request",

      datasetFingerprint:
        "sha256:dataset",
    },

    startTime:
      "2017-06-08T00:00",

    endTime:
      "2017-06-08T23:00",

    hourly,

    quality: {
      recordCount:
        24,

      missingValueCount:
        0,

      warnings:
        [],

      expectedHourlyRecordCount:
        24,

      coveragePercent:
        100,
    },
  };
}

function resolvedInput():
  ResolvedSimulationExecutionInput {
  const currentScenario =
    scenario();

  const currentSiteVersion =
    siteVersion();

  const currentEnvironment =
    environment();

  const inputSnapshot =
    createSimulationExecutionInputSnapshot(
      currentScenario,
      currentSiteVersion,
      currentEnvironment,
    );

  return {
    scenario:
      currentScenario,

    siteVersion:
      currentSiteVersion,

    environment:
      currentEnvironment,

    inputSnapshot,
  };
}

describe(
  "Phase 9C land execution adapter",
  () => {
    it(
      "executes the existing Phase 7B land engine",
      () => {
        const result =
          executeLandSimulation(
            resolvedInput(),
          );

        expect(
          result.status,
        ).toBe(
          "completed",
        );

        expect(
          result.engine
            .engineKind,
        ).toBe(
          "land",
        );

        expect(
          result.simulationDate,
        ).toBe(
          "2017-06-08",
        );

        expect(
          result.hourly,
        ).toHaveLength(
          24,
        );

        expect(
          result.summary
            .installedCapacityKw,
        ).not.toBeNull();

        expect(
          result.summary
            .dailyEnergyKwh,
        ).not.toBeNull();

        expect(
          result.summary
            .dailyEnergyKwh ??
            0,
        ).toBeGreaterThan(
          0,
        );
      },
    );

    it(
      "does not mutate the immutable stored site simulation date",
      () => {
        const input =
          resolvedInput();

        expect(
          input.siteVersion
            .configuration
            .simulationDate,
        ).toBe(
          "2026-08-20",
        );

        executeLandSimulation(
          input,
        );

        expect(
          input.siteVersion
            .configuration
            .simulationDate,
        ).toBe(
          "2026-08-20",
        );

        expect(
          input.inputSnapshot
            .simulationDate,
        ).toBe(
          "2017-06-08",
        );
      },
    );

    it(
      "produces canonical hourly solar and PV outputs",
      () => {
        const result =
          executeLandSimulation(
            resolvedInput(),
          );

        const noon =
          result.hourly[12];

        expect(
          noon.hourIndex,
        ).toBe(
          12,
        );

        expect(
          noon.timestamp,
        ).toBe(
          "2017-06-08T12:00",
        );

        expect(
          noon.ghiWm2 ??
            0,
        ).toBeGreaterThan(
          0,
        );

        expect(
          noon.poaWm2 ??
            0,
        ).toBeGreaterThanOrEqual(
          0,
        );

        expect(
          noon.pvPowerKw ??
            0,
        ).toBeGreaterThanOrEqual(
          0,
        );

        expect(
          noon.openFieldDliIncrementMolM2 ??
            0,
        ).toBeGreaterThan(
          0,
        );
      },
    );

    it(
      "preserves the native Phase 7B spatial result",
      () => {
        const result =
          executeLandSimulation(
            resolvedInput(),
          );

        expect(
          result.spatial,
        ).toHaveLength(
          1,
        );

        expect(
          result.spatial[0]
            .resultKind,
        ).toBe(
          "daily_dli_grid",
        );

        expect(
          result.spatial[0]
            .valuesData,
        ).toBeTruthy();
      },
    );

    it(
      "rejects a non-land execution package",
      () => {
        const input =
          resolvedInput();

        input.inputSnapshot.engine = {
          ...input
            .inputSnapshot
            .engine,

          engineKind:
            "rooftop",
        };

        expect(
          () =>
            executeLandSimulation(
              input,
            ),
        ).toThrow(
          /non-land/,
        );
      },
    );
  },
);
