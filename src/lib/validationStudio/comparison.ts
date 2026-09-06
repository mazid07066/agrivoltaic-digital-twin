import type {
  ValidationStudioDataset,
  ValidationStudioVariable,
} from "./types";

export interface ComparisonPoint {
  timestamp:
    string;

  values:
    Record<
      string,
      number | null
    >;
}

export interface ValidationMetrics {
  count:
    number;

  mbe:
    number;

  mae:
    number;

  rmse:
    number;

  nrmsePercent:
    number;

  rSquared:
    number;

  correlation:
    number;

  energyErrorPercent:
    number;
}

export type ComparisonResolution =
  | "hourly"
  | "daily"
  | "monthly";

export type ComparisonRange =
  | "full"
  | "year"
  | "three_months"
  | "month"
  | "week";

function isAdditiveVariable(
  variable:
    ValidationStudioVariable,
): boolean {
  return variable ===
    "energyKWh";
}

export function buildComparisonSeries(
  datasets:
    ValidationStudioDataset[],

  variable:
    ValidationStudioVariable,
): ComparisonPoint[] {
  if (
    datasets.length ===
    0
  ) {
    return [];
  }

  const maps =
    datasets.map(
      (dataset) =>
        new Map(
          dataset.observations.map(
            (observation) => [
              observation.timestamp,
              observation.values[
                variable
              ] ??
                null,
            ],
          ),
        ),
    );

  const timestamps =
    datasets[0]!
      .observations
      .map(
        (observation) =>
          observation.timestamp,
      )
      .filter(
        (timestamp) =>
          maps.every(
            (map) =>
              map.has(
                timestamp,
              ),
          ),
      );

  return timestamps.map(
    (timestamp) => {
      const values:
        Record<
          string,
          number | null
        > =
        {};

      datasets.forEach(
        (
          dataset,
          index,
        ) => {
          values[
            dataset.id
          ] =
            maps[
              index
            ]?.get(
              timestamp,
            ) ??
            null;
        },
      );

      return {
        timestamp,
        values,
      };
    },
  );
}

function aggregationKey(
  timestamp:
    string,

  resolution:
    ComparisonResolution,
): string {
  const date =
    new Date(
      timestamp,
    );

  if (
    resolution ===
    "hourly"
  ) {
    return timestamp.slice(
      0,
      13,
    );
  }

  if (
    resolution ===
    "daily"
  ) {
    return timestamp.slice(
      0,
      10,
    );
  }

  return [
    date.getUTCFullYear(),
    String(
      date.getUTCMonth() +
      1,
    ).padStart(
      2,
      "0",
    ),
  ].join(
    "-",
  );
}

export function aggregateComparisonSeries(
  series:
    ComparisonPoint[],

  datasets:
    ValidationStudioDataset[],

  variable:
    ValidationStudioVariable,

  resolution:
    ComparisonResolution,
): ComparisonPoint[] {
  if (
    resolution ===
    "hourly"
  ) {
    return series;
  }

  const buckets =
    new Map<
      string,
      {
        timestamp:
          string;

        values:
          Record<
            string,
            number[]
          >;
      }
    >();

  for (
    const point of
    series
  ) {
    const key =
      aggregationKey(
        point.timestamp,
        resolution,
      );

    let bucket =
      buckets.get(
        key,
      );

    if (
      !bucket
    ) {
      bucket = {
        timestamp:
          resolution ===
          "daily"
            ? `${key}T00:00:00.000Z`
            : `${key}-01T00:00:00.000Z`,

        values:
          {},
      };

      buckets.set(
        key,
        bucket,
      );
    }

    for (
      const dataset of
      datasets
    ) {
      const value =
        point.values[
          dataset.id
        ];

      if (
        typeof value !==
          "number" ||
        !Number.isFinite(
          value,
        )
      ) {
        continue;
      }

      bucket.values[
        dataset.id
      ] ??=
        [];

      bucket.values[
        dataset.id
      ]!.push(
        value,
      );
    }
  }

  const additive =
    isAdditiveVariable(
      variable,
    );

  return [
    ...buckets.values(),
  ]
    .sort(
      (
        left,
        right,
      ) =>
        left.timestamp.localeCompare(
          right.timestamp,
        ),
    )
    .map(
      (bucket) => {
        const values:
          Record<
            string,
            number | null
          > =
          {};

        for (
          const dataset of
          datasets
        ) {
          const sourceValues =
            bucket.values[
              dataset.id
            ] ??
            [];

          if (
            sourceValues.length ===
            0
          ) {
            values[
              dataset.id
            ] =
              null;

            continue;
          }

          values[
            dataset.id
          ] =
            additive
              ? sourceValues.reduce(
                  (
                    sum,
                    value,
                  ) =>
                    sum +
                    value,
                  0,
                )
              : sourceValues.reduce(
                  (
                    sum,
                    value,
                  ) =>
                    sum +
                    value,
                  0,
                ) /
                sourceValues.length;
        }

        return {
          timestamp:
            bucket.timestamp,

          values,
        };
      },
    );
}

export function filterComparisonRange(
  series:
    ComparisonPoint[],

  range:
    ComparisonRange,
): ComparisonPoint[] {
  if (
    range ===
    "full" ||
    series.length ===
    0
  ) {
    return series;
  }

  const end =
    new Date(
      series[
        series.length -
        1
      ]!.timestamp,
    );

  const start =
    new Date(
      end,
    );

  switch (
    range
  ) {
    case "year":
      start.setUTCFullYear(
        start.getUTCFullYear() -
        1,
      );

      break;

    case "three_months":
      start.setUTCMonth(
        start.getUTCMonth() -
        3,
      );

      break;

    case "month":
      start.setUTCMonth(
        start.getUTCMonth() -
        1,
      );

      break;

    case "week":
      start.setUTCDate(
        start.getUTCDate() -
        7,
      );

      break;
  }

  const startMs =
    start.getTime();

  return series.filter(
    (point) =>
      new Date(
        point.timestamp,
      ).getTime() >=
      startMs,
  );
}

export function automaticComparisonResolution(
  series:
    ComparisonPoint[],
): ComparisonResolution {
  if (
    series.length <=
    14 *
      24
  ) {
    return "hourly";
  }

  if (
    series.length <=
    400 *
      24
  ) {
    return "daily";
  }

  return "monthly";
}

export function calculateValidationMetrics(
  reference:
    number[],

  candidate:
    number[],
): ValidationMetrics {
  const pairs =
    reference
      .map(
        (
          ref,
          index,
        ) => ({
          ref,

          candidate:
            candidate[
              index
            ],
        }),
      )
      .filter(
        (
          pair,
        ): pair is {
          ref:
            number;
          candidate:
            number;
        } =>
          Number.isFinite(
            pair.ref,
          ) &&
          Number.isFinite(
            pair.candidate,
          ),
      );

  const count =
    pairs.length;

  if (
    count ===
    0
  ) {
    return {
      count:
        0,

      mbe:
        Number.NaN,

      mae:
        Number.NaN,

      rmse:
        Number.NaN,

      nrmsePercent:
        Number.NaN,

      rSquared:
        Number.NaN,

      correlation:
        Number.NaN,

      energyErrorPercent:
        Number.NaN,
    };
  }

  const errors =
    pairs.map(
      (pair) =>
        pair.candidate -
        pair.ref,
    );

  const mbe =
    errors.reduce(
      (
        sum,
        value,
      ) =>
        sum +
        value,
      0,
    ) /
    count;

  const mae =
    errors.reduce(
      (
        sum,
        value,
      ) =>
        sum +
        Math.abs(
          value,
        ),
      0,
    ) /
    count;

  const rmse =
    Math.sqrt(
      errors.reduce(
        (
          sum,
          value,
        ) =>
          sum +
          value *
            value,
        0,
      ) /
        count,
    );

  const referenceMean =
    pairs.reduce(
      (
        sum,
        pair,
      ) =>
        sum +
        pair.ref,
      0,
    ) /
    count;

  const candidateMean =
    pairs.reduce(
      (
        sum,
        pair,
      ) =>
        sum +
        pair.candidate,
      0,
    ) /
    count;

  const denominator =
    pairs.reduce(
      (
        sum,
        pair,
      ) =>
        sum +
        (
          pair.ref -
          referenceMean
        ) **
          2,
      0,
    );

  const sse =
    pairs.reduce(
      (
        sum,
        pair,
      ) =>
        sum +
        (
          pair.candidate -
          pair.ref
        ) **
          2,
      0,
    );

  const rSquared =
    denominator >
    0
      ? 1 -
        sse /
          denominator
      : Number.NaN;

  const covariance =
    pairs.reduce(
      (
        sum,
        pair,
      ) =>
        sum +
        (
          pair.ref -
          referenceMean
        ) *
          (
            pair.candidate -
            candidateMean
          ),
      0,
    );

  const referenceVariance =
    pairs.reduce(
      (
        sum,
        pair,
      ) =>
        sum +
        (
          pair.ref -
          referenceMean
        ) **
          2,
      0,
    );

  const candidateVariance =
    pairs.reduce(
      (
        sum,
        pair,
      ) =>
        sum +
        (
          pair.candidate -
          candidateMean
        ) **
          2,
      0,
    );

  const correlation =
    referenceVariance >
      0 &&
    candidateVariance >
      0
      ? covariance /
        Math.sqrt(
          referenceVariance *
            candidateVariance,
        )
      : Number.NaN;

  const referenceTotal =
    pairs.reduce(
      (
        sum,
        pair,
      ) =>
        sum +
        pair.ref,
      0,
    );

  const candidateTotal =
    pairs.reduce(
      (
        sum,
        pair,
      ) =>
        sum +
        pair.candidate,
      0,
    );

  return {
    count,

    mbe,

    mae,

    rmse,

    nrmsePercent:
      referenceMean !==
      0
        ? rmse /
          Math.abs(
            referenceMean,
          ) *
          100
        : Number.NaN,

    rSquared,

    correlation,

    energyErrorPercent:
      referenceTotal !==
      0
        ? (
            candidateTotal -
            referenceTotal
          ) /
          Math.abs(
            referenceTotal,
          ) *
          100
        : Number.NaN,
  };
}

/* PHASE12_ADVANCED_COMPARISON */

export interface ParityPoint {
  reference:
    number;

  candidate:
    number;

  timestamp:
    string;
}

function localCalendarDate(
  timestamp:
    string,

  timezone:
    string,
): string {
  const formatter =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          timezone,

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      },
    );

  const parts =
    formatter.formatToParts(
      new Date(
        timestamp,
      ),
    );

  const year =
    parts.find(
      (part) =>
        part.type ===
        "year",
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type ===
        "month",
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type ===
        "day",
    )?.value;

  if (
    !year ||
    !month ||
    !day
  ) {
    throw new Error(
      `Unable to derive local calendar date for ${timestamp}.`,
    );
  }

  return `${year}-${month}-${day}`;
}

export function buildResidualSeries(
  series:
    ComparisonPoint[],

  referenceId:
    string,

  candidateIds:
    string[],
): ComparisonPoint[] {
  return series.map(
    (point) => {
      const reference =
        point.values[
          referenceId
        ];

      const values:
        Record<
          string,
          number | null
        > =
        {};

      for (
        const candidateId of
        candidateIds
      ) {
        const candidate =
          point.values[
            candidateId
          ];

        values[
          candidateId
        ] =
          typeof reference ===
            "number" &&
          Number.isFinite(
            reference,
          ) &&
          typeof candidate ===
            "number" &&
          Number.isFinite(
            candidate,
          )
            ? candidate -
              reference
            : null;
      }

      return {
        timestamp:
          point.timestamp,

        values,
      };
    },
  );
}

export function buildParityPairs(
  series:
    ComparisonPoint[],

  referenceId:
    string,

  candidateId:
    string,
): ParityPoint[] {
  const points:
    ParityPoint[] =
    [];

  for (
    const point of
    series
  ) {
    const reference =
      point.values[
        referenceId
      ];

    const candidate =
      point.values[
        candidateId
      ];

    if (
      typeof reference !==
        "number" ||
      !Number.isFinite(
        reference,
      ) ||
      typeof candidate !==
        "number" ||
      !Number.isFinite(
        candidate,
      )
    ) {
      continue;
    }

    points.push({
      reference,
      candidate,
      timestamp:
        point.timestamp,
    });
  }

  return points;
}

export function supportsEnergyComparison(
  variable:
    ValidationStudioVariable,
): boolean {
  return (
    variable ===
      "acPowerKw" ||
    variable ===
      "dcPowerKw" ||
    variable ===
      "energyKWh"
  );
}

export function buildDailyEnergySeries(
  series:
    ComparisonPoint[],

  datasets:
    ValidationStudioDataset[],

  variable:
    ValidationStudioVariable,
): ComparisonPoint[] {
  if (
    !supportsEnergyComparison(
      variable,
    )
  ) {
    return [];
  }

  if (
    datasets.length ===
    0
  ) {
    return [];
  }

  const timezone =
    datasets[0]!
      .timezone;

  const buckets =
    new Map<
      string,
      Record<
        string,
        {
          sum:
            number;

          count:
            number;
        }
      >
    >();

  for (
    const point of
    series
  ) {
    const dateKey =
      localCalendarDate(
        point.timestamp,
        timezone,
      );

    let bucket =
      buckets.get(
        dateKey,
      );

    if (
      !bucket
    ) {
      bucket =
        {};

      buckets.set(
        dateKey,
        bucket,
      );
    }

    for (
      const dataset of
      datasets
    ) {
      const value =
        point.values[
          dataset.id
        ];

      if (
        typeof value !==
          "number" ||
        !Number.isFinite(
          value,
        )
      ) {
        continue;
      }

      bucket[
        dataset.id
      ] ??= {
        sum:
          0,

        count:
          0,
      };

      const contribution =
        variable ===
        "energyKWh"
          ? value
          : value *
            (
              dataset.intervalMinutes /
              60
            );

      bucket[
        dataset.id
      ]!.sum +=
        contribution;

      bucket[
        dataset.id
      ]!.count +=
        1;
    }
  }

  return [
    ...buckets.entries(),
  ]
    .sort(
      (
        left,
        right,
      ) =>
        left[0].localeCompare(
          right[0],
        ),
    )
    .map(
      (
        [
          dateKey,
          bucket,
        ],
      ) => {
        const values:
          Record<
            string,
            number | null
          > =
          {};

        for (
          const dataset of
          datasets
        ) {
          const entry =
            bucket[
              dataset.id
            ];

          values[
            dataset.id
          ] =
            entry &&
            entry.count >
              0
              ? entry.sum
              : null;
        }

        return {
          timestamp:
            dateKey,

          values,
        };
      },
    );
}

export function buildCumulativeEnergySeries(
  dailySeries:
    ComparisonPoint[],

  datasets:
    ValidationStudioDataset[],
): ComparisonPoint[] {
  const running:
    Record<
      string,
      number
    > =
    {};

  for (
    const dataset of
    datasets
  ) {
    running[
      dataset.id
    ] =
      0;
  }

  return dailySeries.map(
    (point) => {
      const values:
        Record<
          string,
          number | null
        > =
        {};

      for (
        const dataset of
        datasets
      ) {
        const value =
          point.values[
            dataset.id
          ];

        if (
          typeof value ===
            "number" &&
          Number.isFinite(
            value,
          )
        ) {
          running[
            dataset.id
          ] +=
            value;

          values[
            dataset.id
          ] =
            running[
              dataset.id
            ]!;
        } else {
          values[
            dataset.id
          ] =
            null;
        }
      }

      return {
        timestamp:
          point.timestamp,

        values,
      };
    },
  );
}

/**
 * Reduce a comparison series only for rendering/export.
 *
 * Scientific calculations must continue to use the original
 * synchronized series. This function performs deterministic
 * uniform sampling and preserves the first and last points.
 */
export function reduceComparisonForVisualization<T>(
  points:
    T[],

  maximumPoints =
    4000,
): T[] {
  if (
    maximumPoints <
    2
  ) {
    throw new Error(
      "maximumPoints must be at least 2.",
    );
  }

  if (
    points.length <=
    maximumPoints
  ) {
    return points;
  }

  const result:
    T[] =
    [];

  const step =
    (
      points.length -
      1
    ) /
    (
      maximumPoints -
      1
    );

  let previousIndex =
    -1;

  for (
    let index =
      0;
    index <
    maximumPoints;
    index +=
      1
  ) {
    const sourceIndex =
      Math.min(
        points.length -
          1,
        Math.round(
          index *
            step,
        ),
      );

    if (
      sourceIndex ===
      previousIndex
    ) {
      continue;
    }

    result.push(
      points[
        sourceIndex
      ]!,
    );

    previousIndex =
      sourceIndex;
  }

  return result;
}
