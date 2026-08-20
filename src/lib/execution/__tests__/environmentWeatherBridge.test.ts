import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  EnvironmentalDataset,
} from "@/lib/environment/types";

import {
  environmentalDatasetToWeatherResponse,
} from "../environmentWeatherBridge";

function createDataset():
  EnvironmentalDataset {
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
            `2017-06-08T${String(
              hour,
            ).padStart(
              2,
              "0",
            )}:00`,

          ghiWm2:
            hour >= 6 &&
            hour <= 18
              ? 500
              : 0,

          dniWm2:
            hour >= 6 &&
            hour <= 18
              ? 350
              : 0,

          dhiWm2:
            hour >= 6 &&
            hour <= 18
              ? 150
              : 0,

          temperatureC:
            30,

          relativeHumidityPct:
            70,

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
  "Phase 9C environmental weather bridge",
  () => {
    it(
      "converts canonical environment into the legacy weather contract",
      () => {
        const weather =
          environmentalDatasetToWeatherResponse(
            createDataset(),
          );

        expect(
          weather.hourly,
        ).toHaveLength(
          24,
        );

        expect(
          weather.summary.date,
        ).toBe(
          "2017-06-08",
        );

        expect(
          weather.summary.timezone,
        ).toBe(
          "Asia/Dhaka",
        );

        expect(
          weather.hourly[12]
            .shortwaveRadiation,
        ).toBe(
          500,
        );

        expect(
          weather.hourly[12]
            .directNormalIrradiance,
        ).toBe(
          350,
        );

        expect(
          weather.hourly[12]
            .diffuseRadiation,
        ).toBe(
          150,
        );

        expect(
          weather.hourly[12]
            .temperature,
        ).toBe(
          30,
        );

        expect(
          weather.hourly[12]
            .windSpeed,
        ).toBe(
          3,
        );
      },
    );

    it(
      "uses requested coordinates when a measurement dataset has no resolved grid coordinate",
      () => {
        const weather =
          environmentalDatasetToWeatherResponse(
            createDataset(),
          );

        expect(
          weather.summary.latitude,
        ).toBe(
          23.8103,
        );

        expect(
          weather.summary.longitude,
        ).toBe(
          90.4125,
        );
      },
    );

    it(
      "does not fabricate unavailable cloud cover",
      () => {
        const weather =
          environmentalDatasetToWeatherResponse(
            createDataset(),
          );

        expect(
          weather.hourly.every(
            (point) =>
              point.cloudCover ===
              0,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "rejects environmental datasets shorter than one simulation day",
      () => {
        const dataset =
          createDataset();

        dataset.hourly =
          dataset.hourly.slice(
            0,
            12,
          );

        expect(
          () =>
            environmentalDatasetToWeatherResponse(
              dataset,
            ),
        ).toThrow(
          /at least 24 hourly/,
        );
      },
    );

    it(
      "uses only one day when given a multi-day dataset",
      () => {
        const dataset =
          createDataset();

        dataset.hourly = [
          ...dataset.hourly,
          ...dataset.hourly.map(
            (
              point,
            ) => ({
              ...point,

              timestamp:
                point.timestamp.replace(
                  "2017-06-08",
                  "2017-06-09",
                ),
            }),
          ),
        ];

        const weather =
          environmentalDatasetToWeatherResponse(
            dataset,
          );

        expect(
          weather.hourly,
        ).toHaveLength(
          24,
        );

        expect(
          weather.summary.date,
        ).toBe(
          "2017-06-08",
        );
      },
    );
  },
);
