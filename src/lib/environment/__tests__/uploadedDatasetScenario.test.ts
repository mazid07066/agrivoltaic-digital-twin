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

const scenario:
  Scenario = {
  id:
    "11111111-1111-4111-8111-111111111111",

  projectId:
    "22222222-2222-4222-8222-222222222222",

  siteId:
    "33333333-3333-4333-8333-333333333333",

  name:
    "Solar-MEM environmental test",

  description:
    null,

  scenarioType:
    "research",

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
      "uploaded_dataset",

    mode:
      "dataset",

    startDate:
      "2017-06-08",

    endDate:
      "2017-06-08",

    year:
      2017,

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

describe(
  "Phase 9B uploaded-dataset scenario resolution",
  () => {
    it(
      "resolves Solar-MEM scenario configuration",
      () => {
        const request =
          resolveScenarioEnvironmentalRequest(
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

        expect(
          request.source,
        ).toBe(
          "uploaded_dataset",
        );

        expect(
          request.mode,
        ).toBe(
          "dataset",
        );

        expect(
          request.datasetId,
        ).toBe(
          "solar-mem-data-v1",
        );

        expect(
          request.startDate,
        ).toBe(
          "2017-06-08",
        );

        expect(
          request.endDate,
        ).toBe(
          "2017-06-08",
        );
      },
    );
  },
);
