import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildCumulativeEnergySeries,
  buildDailyEnergySeries,
  buildParityPairs,
  buildResidualSeries,
} from "../comparison";

import type {
  ComparisonPoint,
} from "../comparison";

import type {
  ValidationStudioDataset,
} from "../types";

const datasets:
  ValidationStudioDataset[] =
  [
    {
      id:
        "reference",

      name:
        "Reference",

      sourceType:
        "agritwin",

      sourceLabel:
        "AgriTwin",

      fileName:
        null,

      runId:
        null,

      timezone:
        "Asia/Dhaka",

      intervalMinutes:
        60,

      startTimestamp:
        "2026-01-01T00:00:00.000Z",

      endTimestamp:
        "2026-01-01T01:00:00.000Z",

      observations:
        [],

      variables: [
        "acPowerKw",
      ],

      variableProvenance:
        [],

      transformations:
        [],

      metadata:
        {},
    },
    {
      id:
        "candidate",

      name:
        "Candidate",

      sourceType:
        "pvlib",

      sourceLabel:
        "PVlib",

      fileName:
        null,

      runId:
        null,

      timezone:
        "Asia/Dhaka",

      intervalMinutes:
        60,

      startTimestamp:
        "2026-01-01T00:00:00.000Z",

      endTimestamp:
        "2026-01-01T01:00:00.000Z",

      observations:
        [],

      variables: [
        "acPowerKw",
      ],

      variableProvenance:
        [],

      transformations:
        [],

      metadata:
        {},
    },
  ];

const series:
  ComparisonPoint[] =
  [
    {
      timestamp:
        "2026-01-01T00:00:00.000Z",

      values: {
        reference:
          10,

        candidate:
          12,
      },
    },
    {
      timestamp:
        "2026-01-01T01:00:00.000Z",

      values: {
        reference:
          20,

        candidate:
          18,
      },
    },
  ];

describe(
  "advanced comparison helpers",
  () => {
    it(
      "builds candidate minus reference residuals",
      () => {
        const result =
          buildResidualSeries(
            series,
            "reference",
            [
              "candidate",
            ],
          );

        expect(
          result[0]!
            .values
            .candidate,
        ).toBe(
          2,
        );

        expect(
          result[1]!
            .values
            .candidate,
        ).toBe(
          -2,
        );
      },
    );

    it(
      "builds parity pairs from synchronized values",
      () => {
        expect(
          buildParityPairs(
            series,
            "reference",
            "candidate",
          ),
        ).toEqual([
          {
            reference:
              10,

            candidate:
              12,

            timestamp:
              "2026-01-01T00:00:00.000Z",
          },
          {
            reference:
              20,

            candidate:
              18,

            timestamp:
              "2026-01-01T01:00:00.000Z",
          },
        ]);
      },
    );

    it(
      "integrates hourly kW into daily kWh",
      () => {
        const daily =
          buildDailyEnergySeries(
            series,
            datasets,
            "acPowerKw",
          );

        expect(
          daily,
        ).toHaveLength(
          1,
        );

        expect(
          daily[0]!
            .values
            .reference,
        ).toBe(
          30,
        );

        expect(
          daily[0]!
            .values
            .candidate,
        ).toBe(
          30,
        );
      },
    );

    it(
      "builds cumulative energy from daily energy",
      () => {
        const daily:
          ComparisonPoint[] =
          [
            {
              timestamp:
                "2026-01-01",

              values: {
                reference:
                  30,

                candidate:
                  29,
              },
            },
            {
              timestamp:
                "2026-01-02",

              values: {
                reference:
                  32,

                candidate:
                  31,
              },
            },
          ];

        const cumulative =
          buildCumulativeEnergySeries(
            daily,
            datasets,
          );

        expect(
          cumulative[1]!
            .values
            .reference,
        ).toBe(
          62,
        );

        expect(
          cumulative[1]!
            .values
            .candidate,
        ).toBe(
          60,
        );
      },
    );
  },
);

describe(
  "visualization reduction",
  () => {
    it(
      "reduces large series deterministically while preserving endpoints",
      async () => {
        const {
          reduceComparisonForVisualization,
        } =
          await import(
            "../comparison"
          );

        const source =
          Array.from(
            {
              length:
                10000,
            },
            (
              _,
              index,
            ) =>
              index,
          );

        const reduced =
          reduceComparisonForVisualization(
            source,
            1000,
          );

        expect(
          reduced.length,
        ).toBeLessThanOrEqual(
          1000,
        );

        expect(
          reduced[0],
        ).toBe(
          0,
        );

        expect(
          reduced[
            reduced.length -
              1
          ],
        ).toBe(
          9999,
        );
      },
    );
  },
);
