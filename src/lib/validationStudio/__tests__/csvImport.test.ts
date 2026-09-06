import {
  describe,
  expect,
  it,
} from "vitest";

import {
  inspectValidationCsvText,
} from "@/lib/validationStudio/csvImport.server";

describe(
  "Phase 12 validation CSV inspection",
  () => {
    it(
      "discovers columns and suggests common PV validation mappings",
      async () => {
        const result =
          await inspectValidationCsvText({
            fileName:
              "pvlib.csv",

            sourceType:
              "pvlib",

            text: [
              "DateTime,GHI,POA_Global,P_DC,P_AC,CellTemp",
              "2018-01-01T00:00:00+06:00,0,0,0,0,24.5",
              "2018-01-01T01:00:00+06:00,10,12,8,7,24.2",
            ].join(
              "\n",
            ),
          });

        expect(
          result.rowCount,
        ).toBe(
          2,
        );

        expect(
          result.columns.map(
            (column) =>
              column.name,
          ),
        ).toEqual(
          [
            "DateTime",
            "GHI",
            "POA_Global",
            "P_DC",
            "P_AC",
            "CellTemp",
          ],
        );

        expect(
          result.suggestions.find(
            (item) =>
              item.column ===
              "DateTime",
          )?.variable,
        ).toBe(
          "timestamp",
        );

        expect(
          result.suggestions.find(
            (item) =>
              item.column ===
              "P_AC",
          )?.variable,
        ).toBe(
          "acPowerKw",
        );

        expect(
          result.suggestions.find(
            (item) =>
              item.column ===
              "CellTemp",
          )?.variable,
        ).toBe(
          "moduleTemperatureC",
        );
      },
    );

    it(
      "rejects an empty CSV",
      async () => {
        await expect(
          inspectValidationCsvText({
            fileName:
              "empty.csv",

            sourceType:
              "external",

            text:
              "DateTime,P_AC\n",
          }),
        ).rejects.toThrow(
          "contains no data rows",
        );
      },
    );
  },
);
