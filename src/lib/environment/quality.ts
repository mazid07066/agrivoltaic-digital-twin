import type {
  EnvironmentalHourlyPoint,
  EnvironmentalQuality,
} from "./types";

export type EnvironmentalQualityField =
  keyof EnvironmentalHourlyPoint;

export const DEFAULT_ENVIRONMENTAL_QUALITY_FIELDS:
  EnvironmentalQualityField[] = [
  "ghiWm2",
  "dniWm2",
  "dhiWm2",
  "temperatureC",
  "relativeHumidityPct",
  "cloudCoverPct",
  "windSpeedMs",
  "precipitationMm",
];

function calculateExpectedHourlyRecords(
  hourly:
    EnvironmentalHourlyPoint[],
): number | null {
  if (
    hourly.length === 0
  ) {
    return null;
  }

  if (
    hourly.length === 1
  ) {
    return 1;
  }

  const first =
    new Date(
      hourly[0].timestamp,
    );

  const last =
    new Date(
      hourly[
        hourly.length - 1
      ].timestamp,
    );

  if (
    Number.isNaN(
      first.getTime(),
    ) ||
    Number.isNaN(
      last.getTime(),
    )
  ) {
    return null;
  }

  const milliseconds =
    last.getTime() -
    first.getTime();

  const hours =
    Math.round(
      milliseconds /
        3_600_000,
    );

  return hours + 1;
}

export function assessEnvironmentalQuality(
  hourly:
    EnvironmentalHourlyPoint[],

  checkedFields:
    EnvironmentalQualityField[] =
      DEFAULT_ENVIRONMENTAL_QUALITY_FIELDS,
): EnvironmentalQuality {
  let missingValueCount =
    0;

  for (
    const point of
    hourly
  ) {
    for (
      const field of
      checkedFields
    ) {
      if (
        point[field] ===
          null ||
        point[field] ===
          undefined
      ) {
        missingValueCount +=
          1;
      }
    }
  }

  const warnings:
    string[] = [];

  if (
    hourly.length === 0
  ) {
    warnings.push(
      "Environmental dataset contains no hourly records.",
    );
  }

  if (
    missingValueCount > 0
  ) {
    warnings.push(
      `${missingValueCount} required environmental values are missing.`,
    );
  }

  const expectedHourlyRecordCount =
    calculateExpectedHourlyRecords(
      hourly,
    );

  let coveragePercent:
    number | null = null;

  if (
    expectedHourlyRecordCount !==
      null &&
    expectedHourlyRecordCount >
      0
  ) {
    coveragePercent =
      Math.min(
        100,

        (
          hourly.length /
          expectedHourlyRecordCount
        ) *
          100,
      );

    if (
      coveragePercent <
      99.9
    ) {
      warnings.push(
        `Environmental temporal coverage is ${coveragePercent.toFixed(2)}%.`,
      );
    }
  }

  return {
    recordCount:
      hourly.length,

    missingValueCount,

    warnings,

    expectedHourlyRecordCount,

    coveragePercent,
  };
}
