import {
  describe,
  expect,
  it,
} from "vitest";

import {
  normalizeOpenMeteoResponse,
} from "../normalize";

import {
  buildOpenMeteoUrl,
} from "../request";

import type {
  EnvironmentalDataRequest,
} from "../../request";

const historicalRequest:
  EnvironmentalDataRequest = {
  source:
    "open_meteo",

  mode:
    "historical",

  coordinate: {
    latitude:
      23.8103,

    longitude:
      90.4125,
  },

  startDate:
    "2025-06-01",

  endDate:
    "2025-06-01",

  timezone:
    "Asia/Dhaka",
};

describe(
  "Phase 9B Open-Meteo adapter",
  () => {
    it(
      "builds a historical request",
      () => {
        const url =
          new URL(
            buildOpenMeteoUrl(
              historicalRequest,
            ),
          );

        expect(
          url.hostname,
        ).toBe(
          "archive-api.open-meteo.com",
        );

        expect(
          url.searchParams.get(
            "start_date",
          ),
        ).toBe(
          "2025-06-01",
        );

        expect(
          url.searchParams.get(
            "wind_speed_unit",
          ),
        ).toBe("ms");
      },
    );

    it(
      "builds a forecast request",
      () => {
        const url =
          new URL(
            buildOpenMeteoUrl({
              ...historicalRequest,

              mode:
                "forecast",
            }),
          );

        expect(
          url.hostname,
        ).toBe(
          "api.open-meteo.com",
        );
      },
    );

    it(
      "normalizes Open-Meteo hourly data",
      () => {
        const dataset =
          normalizeOpenMeteoResponse(
            historicalRequest,
            {
              latitude:
                23.796133,

              longitude:
                90.38055,

              timezone:
                "Asia/Dhaka",

              elevation:
                8,

              hourly: {
                time: [
                  "2025-06-01T12:00",
                ],

                shortwave_radiation: [
                  500,
                ],

                direct_normal_irradiance: [
                  250,
                ],

                diffuse_radiation: [
                  200,
                ],

                temperature_2m: [
                  30,
                ],

                relative_humidity_2m: [
                  75,
                ],

                cloud_cover: [
                  90,
                ],

                wind_speed_10m: [
                  4,
                ],

                wind_direction_10m: [
                  180,
                ],

                precipitation: [
                  0,
                ],

                surface_pressure: [
                  1002,
                ],

                et0_fao_evapotranspiration: [
                  0.3,
                ],
              },

              daily: {
                time: [
                  "2025-06-01",
                ],

                sunrise: [
                  "2025-06-01T05:11",
                ],

                sunset: [
                  "2025-06-01T18:41",
                ],

                temperature_2m_max: [
                  31,
                ],

                temperature_2m_min: [
                  26,
                ],

                precipitation_sum: [
                  5,
                ],

                wind_speed_10m_max: [
                  8,
                ],
              },
            },
          );

        expect(
          dataset
            .provenance
            .requestedCoordinate
            .latitude,
        ).toBe(
          23.8103,
        );

        expect(
          dataset
            .provenance
            .resolvedCoordinate
            ?.latitude,
        ).toBe(
          23.796133,
        );

        expect(
          dataset.hourly[0]
            ?.ghiWm2,
        ).toBe(
          500,
        );

        expect(
          dataset.hourly[0]
            ?.windSpeedMs,
        ).toBe(
          4,
        );

        expect(
          dataset.quality
            .recordCount,
        ).toBe(
          1,
        );
      },
    );
  },
);
