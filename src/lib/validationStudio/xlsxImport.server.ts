import type {
  Buffer,
} from "node:buffer";

import readXlsxFile from "read-excel-file/node";

import {
  normalizeValidationColumnName,
  suggestValidationColumn,
} from "./columnMapping";

import type {
  ValidationImportColumn,
} from "./importTypes";

import type {
  ValidationStudioSourceType,
} from "./types";

export interface ValidationXlsxSheet {
  index:
    number;

  name:
    string;
}

export interface ValidationXlsxInspection {
  fileName:
    string;

  sourceType:
    ValidationStudioSourceType;

  sheets:
    ValidationXlsxSheet[];

  selectedSheet:
    string;

  rowCount:
    number;

  columns:
    ValidationImportColumn[];

  suggestions:
    ReturnType<
      typeof suggestValidationColumn
    >[];

  rawRows:
    Record<string, string>[];
}

function cellText(
  value:
    unknown,
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    value instanceof Date
  ) {
    return value.toISOString();
  }

  return String(
    value,
  );
}

function rowsToRecords(
  rows:
    unknown[][],
): {
  headers:
    string[];

  records:
    Record<string, string>[];
} {
  if (
    rows.length ===
    0
  ) {
    throw new Error(
      "Validation XLSX sheet contains no rows.",
    );
  }

  const headerRow =
    rows[0];

  if (
    !headerRow
  ) {
    throw new Error(
      "Validation XLSX sheet contains no header row.",
    );
  }

  const headers =
    headerRow.map(
      (
        value,
        index,
      ) => {
        const text =
          cellText(
            value,
          ).trim();

        return text ||
          `Column_${index + 1}`;
      },
    );

  if (
    headers.length ===
    0
  ) {
    throw new Error(
      "Validation XLSX sheet contains no header columns.",
    );
  }

  const duplicateHeaders =
    headers.filter(
      (
        header,
        index,
      ) =>
        headers.indexOf(
          header,
        ) !==
        index,
    );

  if (
    duplicateHeaders.length >
    0
  ) {
    throw new Error(
      `Validation XLSX contains duplicate header column(s): ${[
        ...new Set(
          duplicateHeaders,
        ),
      ].join(", ")}`,
    );
  }

  const records =
    rows
      .slice(
        1,
      )
      .filter(
        (row) =>
          row.some(
            (value) =>
              cellText(
                value,
              ).trim() !== "",
          ),
      )
      .map(
        (row) => {
          const record:
            Record<
              string,
              string
            > =
            {};

          headers.forEach(
            (
              header,
              index,
            ) => {
              record[
                header
              ] =
                cellText(
                  row[
                    index
                  ],
                );
            },
          );

          return record;
        },
      );

  if (
    records.length ===
    0
  ) {
    throw new Error(
      "Validation XLSX sheet contains no data rows.",
    );
  }

  return {
    headers,
    records,
  };
}

export async function inspectValidationXlsx(
  input: {
    workbook:
      Buffer;

    fileName:
      string;

    sourceType:
      ValidationStudioSourceType;

    sheet?:
      string | number | null;
  },
): Promise<ValidationXlsxInspection> {
  const workbookSheets =
    await readXlsxFile(
      input.workbook,
    );

  if (
    workbookSheets.length ===
    0
  ) {
    throw new Error(
      "Validation XLSX workbook contains no worksheets.",
    );
  }

  const availableSheets =
    workbookSheets.map(
      (
        worksheet,
        index,
      ) => ({
        index:
          index + 1,

        name:
          worksheet.sheet,
      }),
    );

  const requestedSheet =
    input.sheet ??
    availableSheets[0]
      ?.name;

  if (
    requestedSheet ===
    undefined
  ) {
    throw new Error(
      "Validation XLSX workbook contains no selectable worksheet.",
    );
  }

  const selectedIndex =
    typeof requestedSheet ===
    "number"
      ? availableSheets.findIndex(
          (sheet) =>
            sheet.index ===
            requestedSheet,
        )
      : availableSheets.findIndex(
          (sheet) =>
            sheet.name ===
            requestedSheet,
        );

  if (
    selectedIndex <
    0
  ) {
    throw new Error(
      `Validation XLSX sheet "${String(
        requestedSheet,
      )}" was not found.`,
    );
  }

  const selectedSheet =
    availableSheets[
      selectedIndex
    ];

  const selectedWorkbookSheet =
    workbookSheets[
      selectedIndex
    ];

  if (
    !selectedSheet ||
    !selectedWorkbookSheet
  ) {
    throw new Error(
      "Validation XLSX selected worksheet could not be resolved.",
    );
  }

  const {
    headers,
    records,
  } =
    rowsToRecords(
      selectedWorkbookSheet
        .data as unknown[][],
    );

  const columns =
    headers.map(
      (header) => ({
        name:
          header,

        normalizedName:
          normalizeValidationColumnName(
            header,
          ),

        sampleValues:
          records
            .slice(
              0,
              5,
            )
            .map(
              (row) =>
                row[
                  header
                ] ?? "",
            ),
      }),
    );

  return {
    fileName:
      input.fileName,

    sourceType:
      input.sourceType,

    sheets:
      availableSheets,

    selectedSheet:
      selectedSheet.name,

    rowCount:
      records.length,

    columns,

    suggestions:
      headers.map(
        suggestValidationColumn,
      ),

    rawRows:
      records,
  };
}
