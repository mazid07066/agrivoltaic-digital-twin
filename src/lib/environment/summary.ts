import type {
  EnvironmentalDataset,
} from "./types";

function finiteValues(
  values:
    Array<
      number | null | undefined
    >,
): number[] {
  return values.filter(
    (
      value,
    ): value is number =>
      typeof value === "number" &&
      Number.isFinite(value),
  );
}

function average(
  values: number[],
): number | null {
  if (
    values.length === 0
  ) {
    return null;
  }

  return (
    values.reduce(
      (
        total,
        value,
      ) =>
        total + value,
      0,
    ) /
    values.length
  );
}

function maximum(
  values: number[],
): number | null {
  if (
    values.length === 0
  ) {
    return null;
  }

  return Math.max(
    ...values,
  );
}

function minimum(
  values: number[],
): number | null {
  if (
    values.length === 0
  ) {
    return null;
  }

  return Math.min(
    ...values,
  );
}

function total(
  values: number[],
): number {
  return values.reduce(
    (
      sum,
      value,
    ) =>
      sum + value,
    0,
  );
}

export interface EnvironmentalPreviewSummary {
  recordCount: number;

  averageGhiWm2:
    number | null;

  maximumGhiWm2:
    number | null;

  maximumDniWm2:
    number | null;

  averageTemperatureC:
    number | null;

  minimumTemperatureC:
    number | null;

  maximumTemperatureC:
    number | null;

  totalPrecipitationMm:
    number;

  averageWindSpeedMs:
    number | null;

  maximumWindSpeedMs:
    number | null;

  averageCloudCoverPct:
    number | null;
}

export function summarizeEnvironmentalDataset(
  dataset:
    EnvironmentalDataset,
): EnvironmentalPreviewSummary {
  const ghi =
    finiteValues(
      dataset.hourly.map(
        (point) =>
          point.ghiWm2,
      ),
    );

  const dni =
    finiteValues(
      dataset.hourly.map(
        (point) =>
          point.dniWm2,
      ),
    );

  const temperature =
    finiteValues(
      dataset.hourly.map(
        (point) =>
          point.temperatureC,
      ),
    );

  const precipitation =
    finiteValues(
      dataset.hourly.map(
        (point) =>
          point.precipitationMm,
      ),
    );

  const wind =
    finiteValues(
      dataset.hourly.map(
        (point) =>
          point.windSpeedMs,
      ),
    );

  const cloud =
    finiteValues(
      dataset.hourly.map(
        (point) =>
          point.cloudCoverPct,
      ),
    );

  return {
    recordCount:
      dataset.hourly.length,

    averageGhiWm2:
      average(ghi),

    maximumGhiWm2:
      maximum(ghi),

    maximumDniWm2:
      maximum(dni),

    averageTemperatureC:
      average(
        temperature,
      ),

    minimumTemperatureC:
      minimum(
        temperature,
      ),

    maximumTemperatureC:
      maximum(
        temperature,
      ),

    totalPrecipitationMm:
      total(
        precipitation,
      ),

    averageWindSpeedMs:
      average(wind),

    maximumWindSpeedMs:
      maximum(wind),

    averageCloudCoverPct:
      average(cloud),
  };
}
