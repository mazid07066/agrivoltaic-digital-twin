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
    const dataset of
    datasets
  ) {
    validateDatasetBounds(
      dataset,
    );
  }

  /*
   * Source ranges are provenance information only.
   *
   * Different source start/end dates do not prevent comparison.
   * The actual comparison period is derived from the exact
   * canonical timestamps common to every dataset.
   */
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
    ).size ===
      1 &&
    new Set(
      ends,
    ).size ===
      1;

  checks.push({
    key:
      "date_range",

    label:
      "Source date ranges",

    level:
      "PASS",

    message:
      exactDateRange
        ? "All source datasets declare the same start and end timestamps."
        : "Source date ranges differ. Validation will use only exact timestamps shared by every dataset; no date-range truncation, interpolation or extrapolation is applied.",
  });

  /*
   * Timezone declarations remain an explicit compatibility
   * requirement for this Phase 12 workflow. Timestamps themselves
   * are compared only after canonical absolute-time conversion.
   */
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
        : "Dataset timezone declarations differ. Resolve and record the timezone basis before comparison.",
  });

  /*
   * Different declared sampling intervals are allowed.
   *
   * No resampling occurs here. For example, hourly and 30-minute
   * datasets can be compared at timestamps that exist exactly in
   * both datasets.
   */
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
      "PASS",

    message:
      resolutionMatch
        ? `All datasets declare ${datasets[0].intervalMinutes}-minute observations.`
        : `Source sampling intervals differ (${[
            ...resolutions,
          ]
            .sort(
              (
                left,
                right,
              ) =>
                left -
                right,
            )
            .join(
              ", ",
            )} minutes). Comparison uses exact common timestamps only; no resampling is applied.`,
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
      duplicateCount ===
      0
        ? "PASS"
        : "FAIL",

    message:
      duplicateCount ===
      0
        ? "No duplicate timestamps were detected."
        : `${duplicateCount} duplicate timestamp(s) were detected across the datasets.`,
  });

  /*
   * This is the authoritative Phase 12 alignment policy:
   *
   *      exact canonical timestamp intersection
   *
   * There is no nearest-neighbour matching, rounding,
   * interpolation, extrapolation or automatic resampling.
   */
  const timestampSets =
    datasets.map(
      datasetTimestampSet,
    );

  const commonTimestampSet =
    intersection(
      timestampSets,
    );

  const commonTimestamps =
    [
      ...commonTimestampSet,
    ].sort();

  checks.push({
    key:
      "timestamps",

    label:
      "Timestamp overlap",

    level:
      commonTimestamps.length >
      0
        ? "PASS"
        : "FAIL",

    message:
      commonTimestamps.length >
      0
        ? `${commonTimestamps.length} exact canonical timestamp(s) are shared by all datasets. Only these observations will be compared.`
        : "The datasets do not contain any exact canonical timestamps in common.",
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

    commonTimestamps,

    /*
     * The comparison bounds are the bounds of the exact
     * intersection, not the declared bounds of any one source.
     */
    startTimestamp:
      commonTimestamps[0] ??
      null,

    endTimestamp:
      commonTimestamps[
        commonTimestamps.length -
          1
      ] ??
      null,
  };
}
