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
  createDefaultLandSiteProfile,
} from "@/lib/sites/defaults";

import {
  createSimulationExecutionInputSnapshot,
} from "../inputSnapshot";

import {
  executeResolvedSimulation,
} from "../executeResolved";

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

function createScenario():
  Scenario {
  return {
    id:
      SCENARIO_ID,

    projectId:
      PROJECT_ID,

    siteId:
      SITE_ID,

    name:
      "Unified Execution Test",

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
      1,

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

function createEnvironment():
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
            30,

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

function createResolvedInput(
  kind:
    "land" |
    "rooftop",
): ResolvedSimulationExecutionInput {
  const currentScenario =
    createScenario();

  const site =
    kind ===
    "land"
      ? createDefaultLandSiteProfile()
      : createDefaultFlatRoofSiteProfile();

  const siteVersion:
    SiteVersionSnapshot = {
    id:
      VERSION_ID,

    siteId:
      SITE_ID,

    versionNumber:
      1,

    schemaVersion:
      site.schemaVersion,

    configuration: {
      ...site,

      id:
        SITE_ID,

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
      "hash",

    changeSummary:
      "Unified execution test",

    createdAt:
      "2026-08-20T00:00:00.000Z",
  };

  const currentEnvironment =
    createEnvironment();

  const inputSnapshot =
    createSimulationExecutionInputSnapshot(
      currentScenario,
      siteVersion,
      currentEnvironment,
    );

  return {
    scenario:
      currentScenario,

    siteVersion,

    environment:
      currentEnvironment,

    inputSnapshot,
  };
}

describe(
  "Phase 9C unified execution router",
  () => {
    it(
      "routes land sites to the land execution adapter",
      () => {
        const result =
          executeResolvedSimulation(
            createResolvedInput(
              "land",
            ),
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
          result.summary
            .siteType,
        ).toBe(
          "land_agrivoltaic",
        );

        expect(
          result.hourly,
        ).toHaveLength(
          24,
        );
      },
    );

    it(
      "routes rooftop sites to the rooftop execution adapter",
      () => {
        const result =
          executeResolvedSimulation(
            createResolvedInput(
              "rooftop",
            ),
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
          result.summary
            .siteType,
        ).toBe(
          "flat_roof",
        );

        expect(
          result.hourly,
        ).toHaveLength(
          24,
        );
      },
    );
  },
);
