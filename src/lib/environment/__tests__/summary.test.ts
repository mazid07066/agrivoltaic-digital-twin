import {
  describe,
  expect,
  it,
} from "vitest";

import {
  summarizeEnvironmentalDataset,
} from "../summary";

import type {
  EnvironmentalDataset,
} from "../types";

describe(
  "Phase 9B environmental preview summary",
  () => {
    it(
      "summarizes hourly environmental records",
      () => {
        const dataset:
          EnvironmentalDataset = {
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
          },

          startTime:
            "2025-06-01T00:00",

          endTime:
            "2025-06-01T01:00",

          hourly: [
            {
              timestamp:
                "2025-06-01T00:00",

              ghiWm2:
                0,

              dniWm2:
                0,

              dhiWm2:
                0,

              temperatureC:
                26,

              relativeHumidityPct:
                90,

              cloudCoverPct:
                100,

              windSpeedMs:
                3,

              precipitationMm:
                1,
            },

            {
              timestamp:
                "2025-06-01T01:00",

              ghiWm2:
                500,

              dniWm2:
                300,

              dhiWm2:
                200,

              temperatureC:
                30,

              relativeHumidityPct:
                70,

              cloudCoverPct:
                50,

              windSpeedMs:
                5,

              precipitationMm:
                2,
            },
          ],

          quality: {
            recordCount:
              2,

            missingValueCount:
              0,

            warnings:
              [],
          },
        };

        const summary =
          summarizeEnvironmentalDataset(
            dataset,
          );

        expect(
          summary.recordCount,
        ).toBe(2);

        expect(
          summary.averageGhiWm2,
        ).toBe(250);

        expect(
          summary.maximumDniWm2,
        ).toBe(300);

        expect(
          summary.averageTemperatureC,
        ).toBe(28);

        expect(
          summary.totalPrecipitationMm,
        ).toBe(3);

        expect(
          summary.maximumWindSpeedMs,
        ).toBe(5);
      },
    );
  },
);
