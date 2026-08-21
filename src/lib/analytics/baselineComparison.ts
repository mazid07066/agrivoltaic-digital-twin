import type {
  AnalyticsMetricKey,
  MetricComparison,
  MetricDefinition,
  RunComparisonResult,
  ComparableRunRecord,
} from "./types";

export const ANALYTICS_METRICS:
  MetricDefinition[] = [
    {
      key:
        "installedCapacityKw",

      label:
        "Installed capacity",

      unit:
        "kWp",

      direction:
        "neutral",
    },

    {
      key:
        "dailyEnergyKwh",

      label:
        "Daily energy",

      unit:
        "kWh",

      direction:
        "benefit",
    },

    {
      key:
        "specificYieldKwhPerKw",

      label:
        "Specific yield",

      unit:
        "kWh/kWp",

      direction:
        "benefit",
    },

    {
      key:
        "openFieldDliMolM2",

      label:
        "Open-field DLI",

      unit:
        "mol/m²/day",

      direction:
        "neutral",
    },

    {
      key:
        "cropDliMolM2",

      label:
        "Crop DLI",

      unit:
        "mol/m²/day",

      direction:
        "benefit",
    },

    {
      key:
        "estimatedCropYieldPercent",

      label:
        "Estimated crop yield",

      unit:
        "%",

      direction:
        "benefit",
    },

    {
      key:
        "landEquivalentRatio",

      label:
        "Land Equivalent Ratio",

      unit:
        null,

      direction:
        "benefit",
    },

    {
      key:
        "groundCoverageRatioPercent",

      label:
        "Ground coverage ratio",

      unit:
        "%",

      direction:
        "neutral",
    },

    {
      key:
        "usableAreaPercent",

      label:
        "Usable roof area",

      unit:
        "%",

      direction:
        "benefit",
    },

    {
      key:
        "moduleCount",

      label:
        "Module count",

      unit:
        null,

      direction:
        "neutral",
    },
  ];

function value(
  record:
    ComparableRunRecord,

  key:
    AnalyticsMetricKey,
): number | null {
  const candidate =
    record.summary[
      key
    ];

  return (
    typeof candidate ===
      "number" &&
    Number.isFinite(candidate)
  )
    ? candidate
    : null;
}

function compareMetric(
  definition:
    MetricDefinition,

  reference:
    ComparableRunRecord,

  alternative:
    ComparableRunRecord,
): MetricComparison {
  const referenceValue =
    value(
      reference,
      definition.key,
    );

  const alternativeValue =
    value(
      alternative,
      definition.key,
    );

  const available =
    referenceValue !== null &&
    alternativeValue !== null;

  if (!available) {
    return {
      key:
        definition.key,

      label:
        definition.label,

      unit:
        definition.unit,

      direction:
        definition.direction,

      referenceValue,

      alternativeValue,

      absoluteDelta:
        null,

      relativeChangePercent:
        null,

      available:
        false,
    };
  }

  const absoluteDelta =
    alternativeValue -
    referenceValue;

  const relativeChangePercent =
    referenceValue === 0
      ? null
      : (
          absoluteDelta /
          Math.abs(
            referenceValue,
          )
        ) * 100;

  return {
    key:
      definition.key,

    label:
      definition.label,

    unit:
      definition.unit,

    direction:
      definition.direction,

    referenceValue,

    alternativeValue,

    absoluteDelta,

    relativeChangePercent,

    available:
      true,
  };
}

export function comparePersistedRunRecords(
  reference:
    ComparableRunRecord,

  alternative:
    ComparableRunRecord,
): RunComparisonResult {
  if (
    reference.identity.runId ===
    alternative.identity.runId
  ) {
    throw new Error(
      "Reference and alternative runs must be different.",
    );
  }

  const metrics =
    ANALYTICS_METRICS.map(
      (
        definition,
      ) =>
        compareMetric(
          definition,
          reference,
          alternative,
        ),
    );

  return {
    schema:
      "agritwin-run-comparison-v1",

    reference,

    alternative,

    metrics,

    comparableMetricCount:
      metrics.filter(
        (metric) =>
          metric.available,
      ).length,

    unavailableMetricCount:
      metrics.filter(
        (metric) =>
          !metric.available,
      ).length,
  };
}
