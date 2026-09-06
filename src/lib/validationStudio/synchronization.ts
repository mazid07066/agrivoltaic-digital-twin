import {
  datasetTimestampSet,
  detectDuplicateTimestamps,
  timestampKey,
  validateDatasetBounds,
} from "./canonical";

import type {
  ValidationCompatibilityCheck,
  ValidationStudioDataset,
  ValidationStudioVariable,
  ValidationSynchronizationReport,
} from "./types";

function intersection<T>(
  sets:
    Set<T>[],
): Set<T> {
  if (
    sets.length ===
    0
  ) {
    return new Set<T>();
  }

  const [
    first,
    ...rest
  ] =
    sets;

  return new Set(
    [...first].filter(
      (value) =>
        rest.every(
          (set) =>
            set.has(
              value,
            ),
        ),
    ),
  );
}

function commonVariables(
  datasets:
    readonly ValidationStudioDataset[],
): ValidationStudioVariable[] {
  return [
    ...intersection(
      datasets.map(
        (dataset) =>
          new Set(
            dataset.variables,
          ),
      ),
    ),
  ].sort();
}

export function evaluateSynchronization(
  datasets:
    readonly ValidationStudioDataset[],
): ValidationSynchronizationReport {
  const checks:
    ValidationCompatibilityCheck[] =
    [];

  if (
    datasets.length <
    2
  ) {
    checks.push({
      key:
        "dataset_count",

      label:
        "Dataset count",

      level:
        "FAIL",

      message:
        "At least two datasets are required for cross-model comparison.",
    });

    return {
      ready:
        false,

      checks,

      commonVariables:
        [],

      commonTimestamps:
        [],

      startTimestamp:
        null,

      endTimestamp:
        null,
    };
  }

  checks.push({
    key:
      "dataset_count",

    label:
      "Dataset count",

    level:
      "PASS",

    message:
      `${datasets.length} datasets are available for comparison.`,
  });

  for (
    const dataset
    of datasets
  ) {
    validateDatasetBounds(
      dataset,
    );
  }

  const starts =
    datasets.map(
      (dataset) =>
        timestampKey(
          dataset.startTimestamp,
        ),
    );

  const ends =
    datasets.map(
      (dataset) =>
        timestampKey(
          dataset.endTimestamp,
        ),
    );

  const exactDateRange =
    new Set(
      starts,
    ).size === 1 &&
    new Set(
      ends,
    ).size === 1;

  checks.push({
    key:
      "date_range",

    label:
      "Date range",

    level:
      exactDateRange
        ? "PASS"
        : "FAIL",

    message:
      exactDateRange
        ? "All datasets use the same absolute start and end timestamps."
        : "Dataset date ranges differ. Comparison is blocked until the ranges are aligned explicitly.",
  });

  const timezones =
    new Set(
      datasets.map(
        (dataset) =>
          dataset.timezone.trim(),
      ),
    );

  const timezoneMatch =
    timezones.size ===
    1;

  checks.push({
    key:
      "timezone",

    label:
      "Timezone",

    level:
      timezoneMatch
        ? "PASS"
        : "FAIL",

    message:
      timezoneMatch
        ? `All datasets declare ${datasets[0].timezone}.`
        : "Dataset timezones differ. Apply and record an explicit timezone conversion before comparison.",
  });

  const resolutions =
    new Set(
      datasets.map(
        (dataset) =>
          dataset.intervalMinutes,
      ),
    );

  const resolutionMatch =
    resolutions.size ===
    1;

  checks.push({
    key:
      "resolution",

    label:
      "Sampling resolution",

    level:
      resolutionMatch
        ? "PASS"
        : "FAIL",

    message:
      resolutionMatch
        ? `All datasets use ${datasets[0].intervalMinutes}-minute observations.`
        : "Sampling resolutions differ. Explicit aggregation or resampling is required.",
  });

  const duplicateSummary =
    datasets.map(
      (dataset) => ({
        dataset:
          dataset.name,

        duplicates:
          detectDuplicateTimestamps(
            dataset.observations,
          ),
      }),
    );

  const duplicateCount =
    duplicateSummary.reduce(
      (
        sum,
        item,
      ) =>
        sum +
        item.duplicates.length,
      0,
    );

  checks.push({
    key:
      "duplicates",

    label:
      "Duplicate timestamps",

    level:
      duplicateCount === 0
        ? "PASS"
        : "FAIL",

    message:
      duplicateCount === 0
        ? "No duplicate timestamps were detected."
        : `${duplicateCount} duplicate timestamp(s) were detected across the datasets.`,
  });

  const timestampSets =
    datasets.map(
      datasetTimestampSet,
    );

  const commonTimestampSet =
    intersection(
      timestampSets,
    );

  const exactTimestampAlignment =
    timestampSets.every(
      (set) =>
        set.size ===
          timestampSets[0].size &&
        [...set].every(
          (timestamp) =>
            timestampSets[0].has(
              timestamp,
            ),
        ),
    );

  checks.push({
    key:
      "timestamps",

    label:
      "Timestamp alignment",

    level:
      exactTimestampAlignment
        ? "PASS"
        : "FAIL",

    message:
      exactTimestampAlignment
        ? `${commonTimestampSet.size} timestamps align exactly across all datasets.`
        : `${commonTimestampSet.size} timestamps are common, but the complete timestamp sets do not match.`,
  });

  const sharedVariables =
    commonVariables(
      datasets,
    );

  checks.push({
    key:
      "variables",

    label:
      "Comparable variables",

    level:
      sharedVariables.length >
      0
        ? "PASS"
        : "FAIL",

    message:
      sharedVariables.length >
      0
        ? `Common variables: ${sharedVariables.join(", ")}.`
        : "The datasets do not currently share a canonical comparison variable.",
  });

  const ready =
    checks.every(
      (check) =>
        check.level !==
        "FAIL",
    );

  return {
    ready,

    checks,

    commonVariables:
      sharedVariables,

    commonTimestamps:
      [
        ...commonTimestampSet,
      ].sort(),

    startTimestamp:
      exactDateRange
        ? starts[0]
        : null,

    endTimestamp:
      exactDateRange
        ? ends[0]
        : null,
  };
}
