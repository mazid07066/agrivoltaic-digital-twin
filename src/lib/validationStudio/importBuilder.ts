import {
  canonicalUnitForVariable,
  convertValidationValue,
} from "./units";

import {
  deriveDatasetVariables,
  localTimestampInZoneToAbsolute,
  requireAbsoluteTimestamp,
} from "./canonical";

import type {
  ValidationImportBuildInput,
} from "./importTypes";

import type {
  ValidationStudioDataset,
  ValidationStudioObservation,
  ValidationStudioVariable,
  ValidationTransformation,
  ValidationVariableProvenance,
} from "./types";

function parseNumber(
  value:
    string | undefined,
): number | null {
  if (
    value === undefined ||
    value.trim() === ""
  ) {
    return null;
  }

  const parsed =
    Number(
      value,
    );

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : null;
}

export function buildValidationDatasetFromRows(
  input:
    ValidationImportBuildInput,
): ValidationStudioDataset {
  const observations:
    ValidationStudioObservation[] =
    [];

  const transformations:
    ValidationTransformation[] =
    [];

  const variableProvenance:
    ValidationVariableProvenance[] =
    [];

  for (
    const [
      variable,
      column,
    ] of Object.entries(
      input.mapping
        .variableColumns,
    )
  ) {
    if (
      !column
    ) {
      continue;
    }

    const canonicalVariable =
      variable as
        ValidationStudioVariable;

    const canonicalUnit =
      canonicalUnitForVariable(
        canonicalVariable,
      );

    const originalUnit =
      input.mapping.units[
        canonicalVariable
      ] ??
      canonicalUnit;

    variableProvenance.push({
      variable:
        canonicalVariable,

      originalColumn:
        column,

      originalUnit,

      canonicalUnit,

      sourceClassification:
        input.sourceType ===
        "measured"
          ? "measured"
          : "modeled",
    });

    transformations.push({
      kind:
        "column_mapping",

      description:
        `${column} mapped to ${canonicalVariable}.`,

      from:
        column,

      to:
        canonicalVariable,
    });

    if (
      originalUnit !==
      canonicalUnit
    ) {
      transformations.push({
        kind:
          "unit_conversion",

        description:
          `${canonicalVariable}: ${originalUnit} converted to ${canonicalUnit}.`,

        from:
          originalUnit,

        to:
          canonicalUnit,
      });
    }
  }

  const timestampMode =
    input.mapping
      .timestampMode ??
    "absolute";

  if (
    timestampMode ===
    "local_with_timezone"
  ) {
    transformations.push({
      kind:
        "timezone_conversion",

      description:
        input.mapping
          .timezoneColumn
          ? `Local timestamp converted using timezone column "${input.mapping.timezoneColumn}".`
          : `Local timestamp converted using timezone "${input.mapping.timezoneValue ?? input.timezone}".`,

      from:
        input.mapping
          .timestampColumn,

      to:
        "UTC absolute timestamp",
    });
  }

  for (
    const row of
    input.rows
  ) {
    const originalTimestamp =
      row[
        input.mapping
          .timestampColumn
      ];

    if (
      !originalTimestamp
    ) {
      throw new Error(
        `Validation row is missing timestamp column "${input.mapping.timestampColumn}".`,
      );
    }

    let timestamp:
      string;

    if (
      timestampMode ===
      "absolute"
    ) {
      timestamp =
        requireAbsoluteTimestamp(
          originalTimestamp,
        );
    } else {
      const timezone =
        input.mapping
          .timezoneColumn
          ? row[
              input.mapping
                .timezoneColumn
            ]
          : input.mapping
              .timezoneValue ??
            input.timezone;

      if (
        !timezone ||
        timezone.trim() ===
          ""
      ) {
        throw new Error(
          `A timezone is required for local timestamp "${originalTimestamp}".`,
        );
      }

      timestamp =
        localTimestampInZoneToAbsolute(
          originalTimestamp,
          timezone.trim(),
        );
    }

    const values:
      ValidationStudioObservation["values"] =
      {};

    for (
      const [
        variable,
        column,
      ] of Object.entries(
        input.mapping
          .variableColumns,
      )
    ) {
      if (
        !column
      ) {
        continue;
      }

      const canonicalVariable =
        variable as
          ValidationStudioVariable;

      const numeric =
        parseNumber(
          row[
            column
          ],
        );

      if (
        numeric ===
        null
      ) {
        values[
          canonicalVariable
        ] =
          null;

        continue;
      }

      const canonicalUnit =
        canonicalUnitForVariable(
          canonicalVariable,
        );

      const sourceUnit =
        input.mapping.units[
          canonicalVariable
        ] ??
        canonicalUnit;

      values[
        canonicalVariable
      ] =
        convertValidationValue(
          numeric,
          sourceUnit,
          canonicalUnit,
        );
    }

    observations.push({
      timestamp,

      originalTimestamp,

      values,
    });
  }

  if (
    observations.length ===
    0
  ) {
    throw new Error(
      "Validation import produced no observations.",
    );
  }

  observations.sort(
    (
      left,
      right,
    ) =>
      left.timestamp.localeCompare(
        right.timestamp,
      ),
  );

  const variables =
    deriveDatasetVariables(
      observations,
    );

  if (
    variables.length ===
    0
  ) {
    throw new Error(
      "Validation import contains no mapped comparison variables.",
    );
  }

  return {
    id:
      input.id,

    name:
      input.name,

    sourceType:
      input.sourceType,

    sourceLabel:
      input.sourceLabel,

    fileName:
      input.fileName,

    runId:
      null,

    timezone:
      input.timezone,

    intervalMinutes:
      input.intervalMinutes,

    startTimestamp:
      observations[0]!
        .timestamp,

    endTimestamp:
      observations[
        observations.length -
        1
      ]!.timestamp,

    observations,

    variables,

    variableProvenance,

    transformations,

    metadata: {
      importedRowCount:
        observations.length,

      timestampMode,
    },
  };
}
