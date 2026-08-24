import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildOpenMeteoRangeUrl,
  normalizeOpenMeteoRange,
} from "../openMeteoRange.server";

import type {
  OpenMeteoRangePayload,
} from "../openMeteoRange.server";

function payload():
  OpenMeteoRangePayload {
  const times =
    Array.from(
      {
        length:
          48,
      },
      (
        _,
        index,
      ) => {
        const day =
          index < 24
            ? "2026-08-01"
            : "2026-08-02";

        const hour =
          index % 24;

        return `${day}T${String(
          hour,
        ).padStart(
          2,
          "0",
        )}:00`;
      },
    );

  const radiation =
    times.map(
      (
        _,
        index,
      ) =>
        index % 24 >= 6 &&
        index % 24 <= 17
          ? 500
          : 0,
    );

  return {
    latitude:
      23.81,

    longitude:
      90.41,

    timezone:
      "Asia/Dhaka",

    hourly: {
      time:
        times,

      shortwave_radiation:
        radiation,

      direct_normal_irradiance:
        radiation.map(
          (
            value,
          ) =>
            value * 0.75,
        ),

      diffuse_radiation:
        radiation.map(
          (
            value,
          ) =>
            value * 0.25,
        ),

      temperature_2m:
        times.map(
          () =>
            30,
        ),

      relative_humidity_2m:
        times.map(
          () =>
            70,
        ),

      cloud_cover:
        times.map(
          () =>
            40,
        ),

      wind_speed_10m:
        times.map(
          () =>
            8,
        ),

      precipitation:
        times.map(
          () =>
            0,
        ),
    },

    daily: {
      time: [
        "2026-08-01",
        "2026-08-02",
      ],

      sunrise: [
        "2026-08-01T05:30",
        "2026-08-02T05:31",
      ],

      sunset: [
        "2026-08-01T18:40",
        "2026-08-02T18:39",
      ],

      temperature_2m_max: [
        34,
        35,
      ],

      temperature_2m_min: [
        26,
        27,
      ],

      precipitation_sum: [
        0,
        1,
      ],

      wind_speed_10m_max: [
        12,
        14,
      ],
    },
  };
}

describe(
  "Open-Meteo weather-range normalization",
  () => {
    it(
      "builds historical and forecast endpoint URLs",
      () => {
        const historical =
          buildOpenMeteoRangeUrl({
            latitude:
              23.81,

            longitude:
              90.41,

            segment: {
              source:
                "historical",

              startDate:
                "2021-01-01",

              endDate:
                "2021-01-31",
            },
          });

        const forecast =
          buildOpenMeteoRangeUrl({
            latitude:
              23.81,

            longitude:
              90.41,

            segment: {
              source:
                "forecast",

              startDate:
                "2026-08-24",

              endDate:
                "2026-09-01",
            },
          });

        expect(
          historical.hostname,
        ).toBe(
          "archive-api.open-meteo.com",
        );

        expect(
          forecast.hostname,
        ).toBe(
          "api.open-meteo.com",
        );

        expect(
          historical.searchParams.get(
            "start_date",
          ),
        ).toBe(
          "2021-01-01",
        );

        expect(
          forecast.searchParams.get(
            "end_date",
          ),
        ).toBe(
          "2026-09-01",
        );
      },
    );

    it(
      "normalizes multiple dates into 24-hour weather days",
      () => {
        const days =
          normalizeOpenMeteoRange(
            payload(),
            {
              source:
                "historical",

              startDate:
                "2026-08-01",

              endDate:
                "2026-08-02",
            },
          );

        expect(days).toHaveLength(
          2,
        );

        expect(
          days.every(
            (
              day,
            ) =>
              day.weather.hourly
                .length === 24,
          ),
        ).toBe(true);

        expect(
          days[0].source,
        ).toBe(
          "historical",
        );

        expect(
          days[0].weather
            .summary.dailyGHI,
        ).toBeCloseTo(
          6,
        );

        expect(
          days[1].weather
            .summary
            .maximumTemperature,
        ).toBe(
          35,
        );

        expect(
          days[0].weather
            .summary
            .averageCloudCover,
        ).toBe(
          40,
        );
      },
    );
  },
);
