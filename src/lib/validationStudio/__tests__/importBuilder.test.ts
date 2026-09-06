import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildValidationDatasetFromRows,
} from "@/lib/validationStudio";

describe(
  "Phase 12 validation dataset import",
  () => {
    it(
      "builds canonical observations and records unit conversion provenance",
      () => {
        const dataset =
          buildValidationDatasetFromRows({
            id:
              "pvlib-test",

            name:
              "PVlib Test",

            sourceType:
              "pvlib",

            sourceLabel:
              "PVlib",

            fileName:
              "pvlib.csv",

            timezone:
              "Asia/Dhaka",

            intervalMinutes:
              60,

            mapping: {
              timestampColumn:
                "DateTime",

              variableColumns: {
                poaWm2:
                  "POA",

                acPowerKw:
                  "P_AC_W",
              },

              units: {
                poaWm2:
                  "W/m2",

                acPowerKw:
                  "W",
              },
            },

            rows: [
              {
                DateTime:
                  "2018-01-01T00:00:00+06:00",

                POA:
                  "500",

                P_AC_W:
                  "125000",
              },

              {
                DateTime:
                  "2018-01-01T01:00:00+06:00",

                POA:
                  "600",

                P_AC_W:
                  "130000",
              },
            ],
          });

        expect(
          dataset.observations,
        ).toHaveLength(
          2,
        );

        expect(
          dataset.observations[0]
            .values
            .acPowerKw,
        ).toBeCloseTo(
          125,
          12,
        );

        expect(
          dataset.variables,
        ).toContain(
          "poaWm2",
        );

        expect(
          dataset.transformations.some(
            (item) =>
              item.kind ===
              "unit_conversion",
          ),
        ).toBe(
          true,
        );
      },
    );
  },
);
