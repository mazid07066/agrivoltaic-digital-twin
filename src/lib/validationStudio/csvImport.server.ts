import {
  parse,
} from "csv-parse";

import {
  normalizeValidationColumnName,
  suggestValidationColumn,
} from "./columnMapping";

import type {
  ValidationCsvInspection,
} from "./importTypes";

import type {
  ValidationStudioSourceType,
} from "./types";

export async function inspectValidationCsvText(
  input: {
    text:
      string;

    fileName:
      string;

    sourceType:
      ValidationStudioSourceType;
  },
): Promise<ValidationCsvInspection> {
  const rows:
    Record<string, string>[] =
    [];

  const parser =
    parse(
      input.text,
      {
        columns:
          true,

        skip_empty_lines:
          true,

        trim:
          true,

        bom:
          true,
      },
    );

  for await (
    const rawRow of
    parser
  ) {
    rows.push(
      rawRow as
        Record<string, string>,
    );
  }

  if (
    rows.length ===
    0
  ) {
    throw new Error(
      "Validation CSV contains no data rows.",
    );
  }

  const headers =
    Object.keys(
      rows[0],
    );

  if (
    headers.length ===
    0
  ) {
    throw new Error(
      "Validation CSV contains no header columns.",
    );
  }

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
          rows
            .slice(
              0,
              5,
            )
            .map(
              (row) =>
                row[header] ?? "",
            ),
      }),
    );

  return {
    fileName:
      input.fileName,

    sourceType:
      input.sourceType,

    rowCount:
      rows.length,

    columns,

    suggestions:
      headers.map(
        suggestValidationColumn,
      ),

    rawRows:
      rows,
  };
}
