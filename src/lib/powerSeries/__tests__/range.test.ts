import {
  describe,
  expect,
  it,
} from "vitest";

import {
  chunkDateRange,
  summarizePowerSeries,
} from "../range";

describe(
  "power-series range helpers",
  () => {
    it(
      "splits a long range into contiguous request batches",
      () => {
        expect(
          chunkDateRange({
            startDate:
              "2026-01-01",

            endDate:
              "2026-03-05",

            maximumDays:
              31,
          }),
        ).toEqual([
          {
            startDate:
              "2026-01-01",

            endDate:
              "2026-01-31",
          },
          {
            startDate:
              "2026-02-01",

            endDate:
              "2026-03-03",
          },
          {
            startDate:
              "2026-03-04",

            endDate:
              "2026-03-05",
          },
        ]);
      },
    );

    it(
      "keeps a one-day request in one batch",
      () => {
        expect(
          chunkDateRange({
            startDate:
              "2026-08-24",

            endDate:
              "2026-08-24",
          }),
        ).toEqual([
          {
            startDate:
              "2026-08-24",

            endDate:
              "2026-08-24",
          },
        ]);
      },
    );

    it(
      "summarizes mixed historical and forecast power",
      () => {
        const summary =
          summarizePowerSeries([
            {
              date:
                "2026-08-23",

              dailyEnergyKWh:
                100,

              peakPowerKw:
                20,

              source:
                "historical",
            },
            {
              date:
                "2026-08-24",

              dailyEnergyKWh:
                120,

              peakPowerKw:
                25,

              source:
                "forecast",
            },
          ]);

        expect(
          summary.dayCount,
        ).toBe(
          2,
        );

        expect(
          summary.totalEnergyKWh,
        ).toBe(
          220,
        );

        expect(
          summary.averageDailyEnergyKWh,
        ).toBe(
          110,
        );

        expect(
          summary.peakDailyEnergyKWh,
        ).toBe(
          120,
        );

        expect(
          summary.peakPowerKw,
        ).toBe(
          25,
        );

        expect(
          summary.source,
        ).toBe(
          "mixed",
        );
      },
    );
  },
);
