import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createDefaultLandSiteProfile,
} from "@/lib/sites/defaults";

import type {
  EnvironmentalDataset,
} from "@/lib/environment/types";

import type {
  ProjectSummary,
  SiteVersionSnapshot,
} from "@/lib/projects/types";

import type {
  Scenario,
} from "@/lib/scenarios/types";

import {
  resolveSimulationExecutionInputWithDependencies,
} from "../resolveInput";

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
      "Phase 9C Test",

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
      3,

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

function createSiteVersion():
  SiteVersionSnapshot {
  const site =
    createDefaultLandSiteProfile();

  return {
    id:
      VERSION_ID,

    siteId:
      SITE_ID,

    versionNumber:
      5,

    schemaVersion:
      site.schemaVersion,

    configuration: {
      ...site,

      id:
        SITE_ID,

      name:
        "Execution Test Site",

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
      "hash-5",

    changeSummary:
      "Test version",

    createdAt:
      "2026-08-20T00:00:00.000Z",
  };
}

function createProjects():
  ProjectSummary[] {
  return [
    {
      id:
        PROJECT_ID,

      name:
        "Execution Project",

      description:
        null,

      status:
        "active",

      schemaVersion:
        1,

      createdAt:
        "2026-08-20T00:00:00.000Z",

      updatedAt:
        "2026-08-20T00:00:00.000Z",

      sites: [
        {
          id:
            SITE_ID,

          projectId:
            PROJECT_ID,

          name:
            "Execution Test Site",

          siteType:
            "land_agrivoltaic",

          dataMode:
            "design",

          status:
            "active",

          clientReference:
            null,

          activeVersionId:
            VERSION_ID,

          createdAt:
            "2026-08-20T00:00:00.000Z",

          updatedAt:
            "2026-08-20T00:00:00.000Z",
        },
      ],
    },
  ];
}

function createEnvironment():
  EnvironmentalDataset {
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

    hourly:
      Array.from(
        {
          length:
            24,
        },

        (
          _,
          hour,
        ) => ({
          timestamp:
            `2025-06-01T${String(
              hour,
            ).padStart(
              2,
              "0",
            )}:00`,

          ghiWm2:
            100,

          dniWm2:
            70,

          dhiWm2:
            30,

          temperatureC:
            30,

          relativeHumidityPct:
            70,

          cloudCoverPct:
            50,

          windSpeedMs:
            3,

          precipitationMm:
            0,
        }),
      ),

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

describe(
  "Phase 9C execution-input resolver",
  () => {
    it(
      "resolves scenario, active site version and environment",
      async () => {
        const scenario =
          createScenario();

        const siteVersion =
          createSiteVersion();

        const environment =
          createEnvironment();

        const getScenario =
          vi.fn()
            .mockResolvedValue(
              scenario,
            );

        const listProjects =
          vi.fn()
            .mockResolvedValue(
              createProjects(),
            );

        const getSiteVersion =
          vi.fn()
            .mockResolvedValue(
              siteVersion,
            );

        const environmentLoader =
          vi.fn()
            .mockResolvedValue(
              environment,
            );

        const resolved =
          await resolveSimulationExecutionInputWithDependencies(
            SCENARIO_ID,
            {
              scenarioRepository: {
                getScenario,
              },

              projectRepository: {
                listProjects,
                getSiteVersion,
              },

              environmentLoader,
            },
          );

        expect(
          resolved.scenario.id,
        ).toBe(
          SCENARIO_ID,
        );

        expect(
          resolved.siteVersion.id,
        ).toBe(
          VERSION_ID,
        );

        expect(
          resolved.environment
            .quality
            .recordCount,
        ).toBe(
          24,
        );

        expect(
          resolved.inputSnapshot
            .site
            .siteVersionId,
        ).toBe(
          VERSION_ID,
        );

        expect(
          resolved.inputSnapshot
            .scenario
            .scenarioVersion,
        ).toBe(
          3,
        );

        expect(
          resolved.inputSnapshot
            .environment
            .datasetFingerprint,
        ).toBe(
          "sha256:dataset",
        );

        expect(
          resolved.inputSnapshot
            .inputFingerprint
            ?.startsWith(
              "sha256:",
            ),
        ).toBe(
          true,
        );

        expect(
          environmentLoader,
        ).toHaveBeenCalledWith(
          scenario,
          {
            siteCoordinate: {
              latitude:
                23.8103,

              longitude:
                90.4125,
            },

            siteTimezone:
              "Asia/Dhaka",
          },
        );
      },
    );

    it(
      "rejects archived scenarios",
      async () => {
        const scenario = {
          ...createScenario(),

          status:
            "archived" as const,
        };

        await expect(
          resolveSimulationExecutionInputWithDependencies(
            SCENARIO_ID,
            {
              scenarioRepository: {
                getScenario:
                  vi.fn()
                    .mockResolvedValue(
                      scenario,
                    ),
              },

              projectRepository: {
                listProjects:
                  vi.fn(),

                getSiteVersion:
                  vi.fn(),
              },

              environmentLoader:
                vi.fn(),
            },
          ),
        ).rejects.toThrow(
          /Archived scenarios/,
        );
      },
    );

    it(
      "rejects sites without an active immutable version",
      async () => {
        const projects =
          createProjects();

        projects[0].sites[0] = {
          ...projects[0]
            .sites[0],

          activeVersionId:
            null,
        };

        await expect(
          resolveSimulationExecutionInputWithDependencies(
            SCENARIO_ID,
            {
              scenarioRepository: {
                getScenario:
                  vi.fn()
                    .mockResolvedValue(
                      createScenario(),
                    ),
              },

              projectRepository: {
                listProjects:
                  vi.fn()
                    .mockResolvedValue(
                      projects,
                    ),

                getSiteVersion:
                  vi.fn(),
              },

              environmentLoader:
                vi.fn(),
            },
          ),
        ).rejects.toThrow(
          /active immutable site version/,
        );
      },
    );
  },
);
