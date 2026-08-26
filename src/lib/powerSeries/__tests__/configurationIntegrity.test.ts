import {
  describe,
  expect,
  it,
} from "vitest";

import {
  simulatePowerDay,
} from "@/components/charts/PowerOutputTimeSeries";

import {
  createDefaultLandSiteProfile,
} from "@/lib/sites/defaults";

import type {
  WeatherHourlyPoint,
  WeatherRangeDay,
} from "@/types/weather";

function radiationAtHour(
  hour: number,
): number {
  if (
    hour < 6 ||
    hour > 18
  ) {
    return 0;
  }

  return Math.max(
    0,
    900 *
      Math.sin(
        (
          (hour - 6) /
          12
        ) *
          Math.PI,
      ),
  );
}

function hourlyWeather():
  WeatherHourlyPoint[] {
  return Array.from(
    {
      length: 24,
    },

    (
      _,
      hour,
    ) => {
      const ghi =
        radiationAtHour(
          hour,
        );

      return {
        time:
          `2025-03-21T${String(
            hour,
          ).padStart(
            2,
            "0",
          )}:00`,

        hour:
          `${String(
            hour,
          ).padStart(
            2,
            "0",
          )}:00`,

        shortwaveRadiation:
          ghi,

        directNormalIrradiance:
          ghi * 0.78,

        diffuseRadiation:
          ghi * 0.22,

        temperature:
          27,

        relativeHumidity:
          65,

        cloudCover:
          10,

        windSpeed:
          3,

        precipitation:
          0,
      };
    },
  );
}

const weatherDay:
  WeatherRangeDay = {
  date:
    "2025-03-21",

  source:
    "historical",

  weather: {
    summary: {
      date:
        "2025-03-21",

      latitude:
        23.8103,

      longitude:
        90.4125,

      timezone:
        "Asia/Dhaka",

      sunrise:
        "2025-03-21T06:02",

      sunset:
        "2025-03-21T18:10",

      maximumTemperature:
        31,

      minimumTemperature:
        23,

      totalPrecipitation:
        0,

      maximumWindSpeed:
        12,

      averageCloudCover:
        10,

      dailyGHI:
        6.8,

      source:
        "Open-Meteo",
    },

    hourly:
      hourlyWeather(),
  },
};

describe(
  "power-series active configuration integrity",
  () => {
    it(
      "uses the supplied Land plant capacity rather than the default plant",
      () => {
        const defaultSite =
          createDefaultLandSiteProfile(
            "2025-03-21",
          );

        const configuredSite = {
          ...defaultSite,

          id:
            "149-94-kwp-test-site",

          updatedAt:
            "2026-08-26T17:30:00.000Z",

          siteGeometry: {
            ...defaultSite.siteGeometry,

            fieldLengthM:
              56,

            fieldWidthM:
              100,
          },

          pvConfiguration: {
            ...defaultSite.pvConfiguration,

            numberOfRows:
              21,

            modulesPerRow:
              17,

            modulePower:
              420,
          },
        };

        const defaultResult =
          simulatePowerDay(
            {
              siteKind:
                "land",

              site:
                defaultSite,
            },

            weatherDay,
          );

        const configuredResult =
          simulatePowerDay(
            {
              siteKind:
                "land",

              site:
                configuredSite,
            },

            weatherDay,
          );

        const defaultCapacityKw =
          6 *
          10 *
          550 /
          1000;

        const configuredCapacityKw =
          21 *
          17 *
          420 /
          1000;

        const expectedRatio =
          configuredCapacityKw /
          defaultCapacityKw;

        const energyRatio =
          configuredResult
            .daily
            .dailyEnergyKWh /
          defaultResult
            .daily
            .dailyEnergyKWh;

        const defaultPeak =
          defaultResult
            .daily
            .peakPowerKw;

        const configuredPeak =
          configuredResult
            .daily
            .peakPowerKw;

        expect(
          defaultCapacityKw,
        ).toBeCloseTo(
          33,
          6,
        );

        expect(
          configuredCapacityKw,
        ).toBeCloseTo(
          149.94,
          6,
        );

        expect(
          expectedRatio,
        ).toBeCloseTo(
          4.5436,
          3,
        );

        expect(
          energyRatio,
        ).toBeCloseTo(
          expectedRatio,
          2,
        );

        expect(
          configuredPeak,
        ).toBeGreaterThan(
          defaultPeak *
            4.4,
        );

        expect(
          configuredResult
            .daily
            .dailyEnergyKWh,
        ).toBeGreaterThan(
          defaultResult
            .daily
            .dailyEnergyKWh *
            4.4,
        );
      },
    );
  },
);
