import {
  addUtcDays,
} from "@/lib/weather/range";

import type {
  DailyPowerPoint,
  PowerSeriesSummary,
} from "@/types/powerSeries";

export interface DateRangeChunk {
  startDate:
    string;

  endDate:
    string;
}

export function chunkDateRange({
  startDate,
  endDate,
  maximumDays = 31,
}: {
  startDate:
    string;

  endDate:
    string;

  maximumDays?:
    number;
}): DateRangeChunk[] {
  if (
    !Number.isInteger(
      maximumDays,
    ) ||
    maximumDays < 1
  ) {
    throw new Error(
      "Maximum chunk size must be a positive integer.",
    );
  }

  if (startDate > endDate) {
    throw new Error(
      "Start date must not be later than end date.",
    );
  }

  const chunks:
    DateRangeChunk[] = [];

  let chunkStart =
    startDate;

  while (chunkStart <= endDate) {
    const proposedEnd =
      addUtcDays(
        chunkStart,
        maximumDays - 1,
      );

    const chunkEnd =
      proposedEnd < endDate
        ? proposedEnd
        : endDate;

    chunks.push({
      startDate:
        chunkStart,

      endDate:
        chunkEnd,
    });

    chunkStart =
      addUtcDays(
        chunkEnd,
        1,
      );
  }

  return chunks;
}

export function summarizePowerSeries(
  points:
    DailyPowerPoint[],
): PowerSeriesSummary {
  const sources =
    new Set(
      points.map(
        (
          point,
        ) =>
          point.source,
      ),
    );

  const totalEnergyKWh =
    points.reduce(
      (
        total,
        point,
      ) =>
        total +
        point.dailyEnergyKWh,
      0,
    );

  return {
    dayCount:
      points.length,

    totalEnergyKWh,

    averageDailyEnergyKWh:
      points.length > 0
        ? totalEnergyKWh /
          points.length
        : 0,

    peakDailyEnergyKWh:
      points.reduce(
        (
          maximum,
          point,
        ) =>
          Math.max(
            maximum,
            point.dailyEnergyKWh,
          ),
        0,
      ),

    peakPowerKw:
      points.reduce(
        (
          maximum,
          point,
        ) =>
          Math.max(
            maximum,
            point.peakPowerKw,
          ),
        0,
      ),

    source:
      sources.size > 1
        ? "mixed"
        : (
            points[0]?.source ??
            "historical"
          ),
  };
}
