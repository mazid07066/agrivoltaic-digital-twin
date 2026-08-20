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
  createDefaultFlatRoofSiteProfile,
} from "@/lib/sites/defaults";

import {
  createSimulationExecutionInputSnapshot,
} from "../inputSnapshot";

import {
  executeRooftopSimulation,
} from "../rooftopAdapter";

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
      "Phase 9C Rooftop Execution",

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
        "open_meteo",

      mode:
        "historical",

      year:
        2025,

      startDate:
        "2025-06-01",

      endDate:
        "2025-06-01",
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
    createDefaultFlatRoofSiteProfile();

  return {
    id:
      VERSION_ID,

    siteId:
      SITE_ID,

    versionNumber:
      3,

    schemaVersion:
      site.schemaVersion,

    configuration: {
      ...site,

      id:
        SITE_ID,

      name:
        "Rooftop Execution Site",

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
      "roof-site-hash",

    changeSummary:
      "Rooftop execution test",

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

                850 *
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
            `2025-06-01T${String(
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
            31,

          relativeHumidityPct:
            70,

          cloudCoverPct:
            30,

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
        "open_meteo",

      mode:
        "historical",

      provider:
        "Open-Meteo",

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

      retrievedAt:
        "2026-08-20T00:00:00.000Z",

      datasetId:
        null,

      requestFingerprint:
        "sha256:request",

      datasetFingerprint:
        "sha256:dataset",
    },

    startTime:
      "2025-06-01T00:00",

    endTime:
      "2025-06-01T23:00",

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
  "Phase 9C rooftop execution adapter",
  () => {
    it(
      "executes the existing Phase 8C rooftop engine",
      () => {
        const result =
          executeRooftopSimulation(
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
          "rooftop",
        );

        expect(
          result.simulationDate,
        ).toBe(
          "2025-06-01",
        );

        expect(
          result.hourly,
        ).toHaveLength(
          24,
        );

        expect(
          result.summary
            .installedCapacityKw ??
            0,
        ).toBeGreaterThan(
          0,
        );

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
      "does not mutate the immutable rooftop site version",
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

        executeRooftopSimulation(
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
          "2025-06-01",
        );
      },
    );

    it(
      "produces canonical rooftop hourly outputs",
      () => {
        const result =
          executeRooftopSimulation(
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
          "2025-06-01T12:00",
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
          noon.trackerAngleDeg,
        ).toBeNull();

        expect(
          noon.cropDliIncrementMolM2,
        ).toBeNull();
      },
    );

    it(
      "produces rooftop-specific canonical summary fields",
      () => {
        const result =
          executeRooftopSimulation(
            resolvedInput(),
          );

        expect(
          result.summary
            .usableAreaPercent,
        ).not.toBeNull();

        expect(
          result.summary
            .moduleCount ??
            0,
        ).toBeGreaterThan(
          0,
        );

        expect(
          result.summary
            .openFieldDliMolM2,
        ).toBeNull();

        expect(
          result.summary
            .cropDliMolM2,
        ).toBeNull();

        expect(
          result.spatial,
        ).toHaveLength(
          0,
        );
      },
    );

    it(
      "rejects a non-rooftop execution package",
      () => {
        const input =
          resolvedInput();

        input.inputSnapshot.engine = {
          ...input
            .inputSnapshot
            .engine,

          engineKind:
            "land",
        };

        expect(
          () =>
            executeRooftopSimulation(
              input,
            ),
        ).toThrow(
          /non-rooftop/,
        );
      },
    );
  },
);
