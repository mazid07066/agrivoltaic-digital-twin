import writeXlsxFile from "write-excel-file/node";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  inspectValidationXlsx,
} from "@/lib/validationStudio/xlsxImport.server";

async function createWorkbook(): Promise<Buffer> {
  const inputsSheet = [
    [
      {
        value:
          "Input",
      },
      {
        value:
          "Value",
      },
    ],
    [
      {
        value:
          "Tilt",
      },
      {
        value:
          22,
      },
    ],
  ];

  const hourlyResultsSheet = [
    [
      {
        value:
          "DateTime",
      },
      {
        value:
          "GHI",
      },
      {
        value:
          "POA_Global",
      },
      {
        value:
          "P_DC",
      },
      {
        value:
          "P_AC",
      },
      {
        value:
          "CellTemp",
      },
    ],
    [
      {
        value:
          "2018-01-01T00:00:00+06:00",
      },
      {
        value:
          0,
      },
      {
        value:
          0,
      },
      {
        value:
          0,
      },
      {
        value:
          0,
      },
      {
        value:
          24.5,
      },
    ],
    [
      {
        value:
          "2018-01-01T01:00:00+06:00",
      },
      {
        value:
          10,
      },
      {
        value:
          12,
      },
      {
        value:
          8,
      },
      {
        value:
          7,
      },
      {
        value:
          24.2,
      },
    ],
  ];

  return writeXlsxFile(
    [
      {
        data:
          inputsSheet,

        sheet:
          "Inputs",
      },

      {
        data:
          hourlyResultsSheet,

        sheet:
          "Hourly Results",
      },
    ],
  ).toBuffer();
}

describe(
  "Phase 12 validation XLSX inspection",
  () => {
    it(
      "discovers workbook sheets and inspects a selected sheet",
      async () => {
        const workbook =
          await createWorkbook();

        const result =
          await inspectValidationXlsx({
            workbook,

            fileName:
              "simulink-validation.xlsx",

            sourceType:
              "simulink",

            sheet:
              "Hourly Results",
          });

        expect(
          result.sheets,
        ).toEqual(
          [
            {
              index:
                1,

              name:
                "Inputs",
            },

            {
              index:
                2,

              name:
                "Hourly Results",
            },
          ],
        );

        expect(
          result.selectedSheet,
        ).toBe(
          "Hourly Results",
        );

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
          result.rawRows[0],
        ).toMatchObject(
          {
            DateTime:
              "2018-01-01T00:00:00+06:00",

            GHI:
              "0",

            POA_Global:
              "0",

            P_DC:
              "0",

            P_AC:
              "0",

            CellTemp:
              "24.5",
          },
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
      "allows worksheet selection by one-based index",
      async () => {
        const workbook =
          await createWorkbook();

        const result =
          await inspectValidationXlsx({
            workbook,

            fileName:
              "simulink-validation.xlsx",

            sourceType:
              "simulink",

            sheet:
              2,
          });

        expect(
          result.selectedSheet,
        ).toBe(
          "Hourly Results",
        );

        expect(
          result.rowCount,
        ).toBe(
          2,
        );
      },
    );

    it(
      "rejects an unknown selected sheet",
      async () => {
        const workbook =
          await createWorkbook();

        await expect(
          inspectValidationXlsx({
            workbook,

            fileName:
              "validation.xlsx",

            sourceType:
              "external",

            sheet:
              "Does Not Exist",
          }),
        ).rejects.toThrow(
          "was not found",
        );
      },
    );
  },
);
