import {
  describe,
  expect,
  it,
} from "vitest";

import {
  planOpenMeteoRange,
} from "../range";

const todayDate =
  "2026-08-24";

describe(
  "Open-Meteo date-range planning",
  () => {
    it(
      "uses forecast data for the current date",
      () => {
        const plan =
          planOpenMeteoRange({
            startDate:
              "2026-08-24",

            endDate:
              "2026-08-24",

            todayDate,
          });

        expect(plan.source).toBe(
          "forecast",
        );

        expect(plan.segments).toEqual([
          {
            source:
              "forecast",

            startDate:
              "2026-08-24",

            endDate:
              "2026-08-24",
          },
        ]);
      },
    );

    it(
      "uses historical data for an older past range",
      () => {
        const plan =
          planOpenMeteoRange({
            startDate:
              "2021-01-01",

            endDate:
              "2021-12-31",

            todayDate,
          });

        expect(plan.source).toBe(
          "historical",
        );

        expect(plan.segments).toEqual([
          {
            source:
              "historical",

            startDate:
              "2021-01-01",

            endDate:
              "2021-12-31",
          },
        ]);
      },
    );

    it(
      "uses forecast data for recent past through future",
      () => {
        const plan =
          planOpenMeteoRange({
            startDate:
              "2026-08-20",

            endDate:
              "2026-09-01",

            todayDate,
          });

        expect(plan.source).toBe(
          "forecast",
        );

        expect(plan.segments).toEqual([
          {
            source:
              "forecast",

            startDate:
              "2026-08-20",

            endDate:
              "2026-09-01",
          },
        ]);
      },
    );

    it(
      "splits a past-to-current range without a date gap",
      () => {
        const plan =
          planOpenMeteoRange({
            startDate:
              "2026-08-01",

            endDate:
              "2026-08-24",

            todayDate,
          });

        expect(plan.source).toBe(
          "mixed",
        );

        expect(plan.segments).toEqual([
          {
            source:
              "historical",

            startDate:
              "2026-08-01",

            endDate:
              "2026-08-18",
          },
          {
            source:
              "forecast",

            startDate:
              "2026-08-19",

            endDate:
              "2026-08-24",
          },
        ]);
      },
    );

    it(
      "rejects unavailable future dates",
      () => {
        expect(() =>
          planOpenMeteoRange({
            startDate:
              "2026-08-24",

            endDate:
              "2026-09-09",

            todayDate,
          }),
        ).toThrow(
          "currently available only through 2026-09-08",
        );
      },
    );

    it(
      "rejects reversed ranges",
      () => {
        expect(() =>
          planOpenMeteoRange({
            startDate:
              "2026-08-10",

            endDate:
              "2026-08-01",

            todayDate,
          }),
        ).toThrow(
          "Start date must not be later",
        );
      },
    );

    it(
      "rejects invalid calendar dates",
      () => {
        expect(() =>
          planOpenMeteoRange({
            startDate:
              "2026-02-30",

            endDate:
              "2026-03-01",

            todayDate,
          }),
        ).toThrow(
          "valid calendar date",
        );
      },
    );

    it(
      "rejects dates before historical coverage",
      () => {
        expect(() =>
          planOpenMeteoRange({
            startDate:
              "1939-12-31",

            endDate:
              "1940-01-01",

            todayDate,
          }),
        ).toThrow(
          "available from 1940-01-01",
        );
      },
    );
  },
);
