import {
  describe,
  expect,
  it,
} from "vitest";

import {
  resolveScenarioEnvironmentalRequest,
} from "../scenarioResolver";

import type {
  Scenario,
} from "@/lib/scenarios/types";

function createScenario(
  overrides:
    Partial<Scenario["weatherConfig"]> = {},
): Scenario {
  return {
    id:
      "11111111-1111-4111-8111-111111111111",

    projectId:
      "22222222-2222-4222-8222-222222222222",

    siteId:
      "33333333-3333-4333-8333-333333333333",

    name:
      "Rice policy scenario",

    description:
      null,

    scenarioType:
      "agrivoltaic",

    status:
      "draft",

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

      ...overrides,
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

describe(
  "Phase 9B scenario environmental resolver",
  () => {
    it(
      "converts a scenario year into a historical annual request",
      () => {
        const request =
          resolveScenarioEnvironmentalRequest(
            createScenario(),
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

        expect(
          request.source,
        ).toBe(
          "open_meteo",
        );

        expect(
          request.mode,
        ).toBe(
          "historical",
        );

        expect(
          request.startDate,
        ).toBe(
          "2025-01-01",
        );

        expect(
          request.endDate,
        ).toBe(
          "2025-12-31",
        );

        expect(
          request.coordinate.latitude,
        ).toBe(
          23.8103,
        );

        expect(
          request.timezone,
        ).toBe(
          "Asia/Dhaka",
        );
      },
    );

    it(
      "prefers scenario coordinates over site coordinates",
      () => {
        const request =
          resolveScenarioEnvironmentalRequest(
            createScenario({
              latitude:
                24.1,

              longitude:
                90.8,
            }),
            {
              siteCoordinate: {
                latitude:
                  23.8103,

                longitude:
                  90.4125,
              },
            },
          );

        expect(
          request.coordinate,
        ).toEqual({
          latitude:
            24.1,

          longitude:
            90.8,
        });
      },
    );

    it(
      "prefers an explicit date range over year",
      () => {
        const request =
          resolveScenarioEnvironmentalRequest(
            createScenario({
              year:
                2025,

              startDate:
                "2025-06-01",

              endDate:
                "2025-06-30",
            }),
            {
              siteCoordinate: {
                latitude:
                  23.8103,

                longitude:
                  90.4125,
              },
            },
          );

        expect(
          request.startDate,
        ).toBe(
          "2025-06-01",
        );

        expect(
          request.endDate,
        ).toBe(
          "2025-06-30",
        );
      },
    );

    it(
      "rejects missing date information",
      () => {
        expect(() =>
          resolveScenarioEnvironmentalRequest(
            createScenario({
              year:
                null,

              startDate:
                null,

              endDate:
                null,
            }),
            {
              siteCoordinate: {
                latitude:
                  23.8103,

                longitude:
                  90.4125,
              },
            },
          ),
        ).toThrow(
          /requires either/i,
        );
      },
    );

    it(
      "rejects unsupported Open-Meteo modes",
      () => {
        expect(() =>
          resolveScenarioEnvironmentalRequest(
            createScenario({
              mode:
                "sensor",
            }),
            {
              siteCoordinate: {
                latitude:
                  23.8103,

                longitude:
                  90.4125,
              },
            },
          ),
        ).toThrow(
          /not supported/i,
        );
      },
    );
  },
);
