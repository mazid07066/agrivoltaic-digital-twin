import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  FlatRoofSiteProfile,
  LandAgrivoltaicSiteProfile,
} from "@/lib/sites/schema";

import type {
  WeatherRangeDay,
} from "@/types/weather";

const {
  landSimulation,
  rooftopSimulation,
} = vi.hoisted(
  () => ({
    landSimulation:
      vi.fn(),

    rooftopSimulation:
      vi.fn(),
  }),
);

vi.mock(
  "@/lib/sites/adapters/landAgrivoltaic",
  () => ({
    runLandAgrivoltaicSimulation:
      landSimulation,
  }),
);

vi.mock(
  "@/lib/rooftop/simulation",
  () => ({
    runFlatRoofSimulation:
      rooftopSimulation,
  }),
);

import {
  simulatePowerDay,
} from "@/components/charts/PowerOutputTimeSeries";

const weatherDay:
  WeatherRangeDay = {
  date:
    "2026-08-24",

  source:
    "forecast",

  weather: {
    summary: {
      date:
        "2026-08-24",

      latitude:
        23.81,

      longitude:
        90.41,

      timezone:
        "Asia/Dhaka",

      sunrise:
        "2026-08-24T05:35",

      sunset:
        "2026-08-24T18:25",

      maximumTemperature:
        34,

      minimumTemperature:
        26,

      totalPrecipitation:
        0,

      maximumWindSpeed:
        12,

      averageCloudCover:
        30,

      dailyGHI:
        5.5,

      source:
        "Open-Meteo",
    },

    hourly:
      [],
  },
};

describe(
  "land and rooftop power-series calculations",
  () => {
    beforeEach(
      () => {
        landSimulation.mockReset();
        rooftopSimulation.mockReset();
      },
    );

    it(
      "derives a land daily-energy and hourly-power series",
      () => {
        landSimulation.mockReturnValue({
          dailyEnergyKWh:
            120,

          hourly: [
            {
              hour:
                "11:00",

              pvPower:
                24,
            },
            {
              hour:
                "12:00",

              pvPower:
                30,
            },
          ],
        });

        const site =
          {
            simulationDate:
              "2026-01-01",

            location: {
              latitude:
                23.81,

              longitude:
                90.41,
            },
          } as LandAgrivoltaicSiteProfile;

        const result =
          simulatePowerDay(
            {
              siteKind:
                "land",

              site,
            },
            weatherDay,
          );

        expect(
          landSimulation,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            simulationDate:
              "2026-08-24",
          }),
          weatherDay.weather,
        );

        expect(
          result.daily.dailyEnergyKWh,
        ).toBe(
          120,
        );

        expect(
          result.daily.peakPowerKw,
        ).toBe(
          30,
        );

        expect(
          result.hourly,
        ).toEqual([
          {
            hour:
              "11:00",

            powerKw:
              24,
          },
          {
            hour:
              "12:00",

            powerKw:
              30,
          },
        ]);
      },
    );

    it(
      "derives a rooftop daily-energy and hourly-power series",
      () => {
        rooftopSimulation.mockReturnValue({
          dailyEnergyKWh:
            90,

          hourly: [
            {
              hour:
                "11:00",

              dcPowerKW:
                18,
            },
            {
              hour:
                "12:00",

              dcPowerKW:
                22,
            },
          ],
        });

        const site =
          {
            simulationDate:
              "2026-01-01",

            location: {
              latitude:
                23.81,

              longitude:
                90.41,
            },
          } as FlatRoofSiteProfile;

        const result =
          simulatePowerDay(
            {
              siteKind:
                "rooftop",

              site,
            },
            weatherDay,
          );

        expect(
          rooftopSimulation,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            simulationDate:
              "2026-08-24",
          }),
          weatherDay.weather,
        );

        expect(
          result.daily.dailyEnergyKWh,
        ).toBe(
          90,
        );

        expect(
          result.daily.peakPowerKw,
        ).toBe(
          22,
        );

        expect(
          result.daily.source,
        ).toBe(
          "forecast",
        );
      },
    );
  },
);
