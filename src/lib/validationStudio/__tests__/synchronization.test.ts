import {
  describe,
  expect,
  it,
} from "vitest";

import {
  evaluateSynchronization,
} from "@/lib/validationStudio";

import type {
  ValidationStudioDataset,
} from "@/lib/validationStudio";

function dataset(
  overrides:
    Partial<ValidationStudioDataset> =
      {},
): ValidationStudioDataset {
  return {
    id:
      "source-a",

    name:
      "AgriTwin",

    sourceType:
      "agritwin",

    sourceLabel:
      "AgriTwin DT",

    fileName:
      null,

    runId:
      "run-1",

    timezone:
      "Asia/Dhaka",

    intervalMinutes:
      60,

    startTimestamp:
      "2018-01-01T00:00:00+06:00",

    endTimestamp:
      "2018-01-01T02:00:00+06:00",

    observations:
      [
        {
          timestamp:
            "2018-01-01T00:00:00+06:00",

          values: {
            acPowerKw:
              0,
          },
        },

        {
          timestamp:
            "2018-01-01T01:00:00+06:00",

          values: {
            acPowerKw:
              10,
          },
        },

        {
          timestamp:
            "2018-01-01T02:00:00+06:00",

          values: {
            acPowerKw:
              20,
          },
        },
      ],

    variables:
      [
        "acPowerKw",
      ],

    variableProvenance:
      [],

    transformations:
      [],

    metadata:
      {},

    ...overrides,
  };
}

describe(
  "Phase 12 validation synchronization",
  () => {
    it(
      "accepts exactly aligned cross-model datasets",
      () => {
        const agritwin =
          dataset();

        const pvlib =
          dataset({
            id:
              "source-b",

            name:
              "PVlib",

            sourceType:
              "pvlib",

            runId:
              null,
          });

        const report =
          evaluateSynchronization(
            [
              agritwin,
              pvlib,
            ],
          );

        expect(
          report.ready,
        ).toBe(
          true,
        );

        expect(
          report.commonTimestamps,
        ).toHaveLength(
          3,
        );

        expect(
          report.commonVariables,
        ).toContain(
          "acPowerKw",
        );
      },
    );

    it(
  "allows different source date ranges when exact timestamps overlap",
  () => {
    const report =
      evaluateSynchronization(
        [
          dataset(),

          dataset({
            id:
              "source-b",

            name:
              "PVlib",

            endTimestamp:
              "2018-01-01T03:00:00+06:00",
          }),
        ],
      );

    expect(
      report.ready,
    ).toBe(
      true,
    );

    expect(
      report.checks.find(
        (check) =>
          check.key ===
          "date_range",
      )?.level,
    ).toBe(
      "PASS",
    );

    expect(
      report.checks.find(
        (check) =>
          check.key ===
          "timestamps",
      )?.level,
    ).toBe(
      "PASS",
    );

    expect(
      report.commonTimestamps,
    ).toHaveLength(
      3,
    );

    expect(
      report.startTimestamp,
    ).toBe(
      report.commonTimestamps[
        0
      ],
    );

    expect(
      report.endTimestamp,
    ).toBe(
      report.commonTimestamps[
        report.commonTimestamps.length -
          1
      ],
    );
  },
);

it(
      "blocks silent timezone mismatch",
      () => {
        const utc =
          dataset({
            id:
              "source-b",

            name:
              "Simulink",

            sourceType:
              "simulink",

            timezone:
              "UTC",

            startTimestamp:
              "2017-12-31T18:00:00Z",

            endTimestamp:
              "2017-12-31T20:00:00Z",

            observations:
              [
                {
                  timestamp:
                    "2017-12-31T18:00:00Z",

                  values: {
                    acPowerKw:
                      0,
                  },
                },

                {
                  timestamp:
                    "2017-12-31T19:00:00Z",

                  values: {
                    acPowerKw:
                      10,
                  },
                },

                {
                  timestamp:
                    "2017-12-31T20:00:00Z",

                  values: {
                    acPowerKw:
                      20,
                  },
                },
              ],
          });

        const report =
          evaluateSynchronization(
            [
              dataset(),
              utc,
            ],
          );

        expect(
          report.ready,
        ).toBe(
          false,
        );

        expect(
          report.checks.find(
            (check) =>
              check.key ===
              "timezone",
          )?.level,
        ).toBe(
          "FAIL",
        );
      },
    );

    it(
  "uses exact timestamp intersection when timestamps are missing",
  () => {
    const incomplete =
      dataset({
        id:
          "source-b",

        name:
          "Measured",

        sourceType:
          "measured",

        observations:
          [
            {
              timestamp:
                "2018-01-01T00:00:00+06:00",

              values: {
                acPowerKw:
                  0,
              },
            },

            {
              timestamp:
                "2018-01-01T02:00:00+06:00",

              values: {
                acPowerKw:
                  20,
              },
            },
          ],
      });

    const report =
      evaluateSynchronization(
        [
          dataset(),
          incomplete,
        ],
      );

    expect(
      report.ready,
    ).toBe(
      true,
    );

    expect(
      report.checks.find(
        (check) =>
          check.key ===
          "timestamps",
      )?.level,
    ).toBe(
      "PASS",
    );

    expect(
      report.commonTimestamps,
    ).toHaveLength(
      2,
    );

    expect(
      report.startTimestamp,
    ).toBe(
      report.commonTimestamps[
        0
      ],
    );

    expect(
      report.endTimestamp,
    ).toBe(
      report.commonTimestamps[
        1
      ],
    );
  },
);

it(
      "rejects duplicate timestamps",
      () => {
        const duplicated =
          dataset({
            id:
              "source-b",

            observations:
              [
                {
                  timestamp:
                    "2018-01-01T00:00:00+06:00",

                  values: {
                    acPowerKw:
                      1,
                  },
                },

                {
                  timestamp:
                    "2018-01-01T00:00:00+06:00",

                  values: {
                    acPowerKw:
                      2,
                  },
                },

                {
                  timestamp:
                    "2018-01-01T02:00:00+06:00",

                  values: {
                    acPowerKw:
                      3,
                  },
                },
              ],
          });

        const report =
          evaluateSynchronization(
            [
              dataset(),
              duplicated,
            ],
          );

        expect(
          report.ready,
        ).toBe(
          false,
        );

        expect(
          report.checks.find(
            (check) =>
              check.key ===
              "duplicates",
          )?.level,
        ).toBe(
          "FAIL",
        );
      },
    );
  },
);
