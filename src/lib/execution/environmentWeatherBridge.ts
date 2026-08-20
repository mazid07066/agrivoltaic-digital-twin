import type {
  EnvironmentalDataset,
  EnvironmentalHourlyPoint,
} from "@/lib/environment/types";

import type {
  WeatherHourlyPoint,
  WeatherResponse,
} from "@/types/weather";

function finiteOrZero(
  value:
    number | null | undefined,
): number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  )
    ? value
    : 0;
}

function finiteOrDefault(
  value:
    number | null | undefined,

  fallback:
    number,
): number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  )
    ? value
    : fallback;
}

function timestampHour(
  timestamp: string,
  index: number,
): string {
  const match =
    timestamp.match(
      /T(\d{2}):(\d{2})/,
    );

  if (match) {
    return `${match[1]}:${match[2]}`;
  }

  return `${String(index).padStart(
    2,
    "0",
  )}:00`;
}

function toLegacyHourlyPoint(
  point:
    EnvironmentalHourlyPoint,

  index:
    number,
): WeatherHourlyPoint {
  return {
    time:
      point.timestamp,

    hour:
      timestampHour(
        point.timestamp,
        index,
      ),

    shortwaveRadiation:
      finiteOrZero(
        point.ghiWm2,
      ),

    directNormalIrradiance:
      finiteOrZero(
        point.dniWm2,
      ),

    diffuseRadiation:
      finiteOrZero(
        point.dhiWm2,
      ),

    temperature:
      finiteOrDefault(
        point.temperatureC,
        25,
      ),

    relativeHumidity:
      finiteOrZero(
        point.relativeHumidityPct,
      ),

    cloudCover:
      finiteOrZero(
        point.cloudCoverPct,
      ),

    windSpeed:
      finiteOrZero(
        point.windSpeedMs,
      ),

    precipitation:
      finiteOrZero(
        point.precipitationMm,
      ),
  };
}

function average(
  values:
    number[],
): number {
  if (
    values.length === 0
  ) {
    return 0;
  }

  return (
    values.reduce(
      (
        sum,
        value,
      ) =>
        sum + value,
      0,
    ) /
    values.length
  );
}

function maximum(
  values:
    number[],
): number {
  if (
    values.length === 0
  ) {
    return 0;
  }

  return Math.max(
    ...values,
  );
}

function minimum(
  values:
    number[],
): number {
  if (
    values.length === 0
  ) {
    return 0;
  }

  return Math.min(
    ...values,
  );
}

function inferSunrise(
  hourly:
    WeatherHourlyPoint[],
): string {
  const firstDaylight =
    hourly.find(
      (point) =>
        point.shortwaveRadiation >
        0,
    );

  return (
    firstDaylight?.time ??
    hourly[0]?.time ??
    ""
  );
}

function inferSunset(
  hourly:
    WeatherHourlyPoint[],
): string {
  const daylight =
    hourly.filter(
      (point) =>
        point.shortwaveRadiation >
        0,
    );

  return (
    daylight[
      daylight.length - 1
    ]?.time ??
    hourly[
      hourly.length - 1
    ]?.time ??
    ""
  );
}

export function environmentalDatasetToWeatherResponse(
  dataset:
    EnvironmentalDataset,
): WeatherResponse {
  if (
    dataset.hourly.length ===
    0
  ) {
    throw new Error(
      "Environmental dataset contains no records for simulation.",
    );
  }

  if (
    dataset.hourly.length <
    24
  ) {
    throw new Error(
      "The current simulation engines require at least 24 hourly environmental records.",
    );
  }

  /*
   * Phase 7B and Phase 8C engines currently operate
   * on a single 24-hour simulation day.
   *
   * For multi-day or annual Phase 9B datasets, 9C
   * execution selects the first 24 normalized records.
   *
   * Explicit multi-day execution orchestration will be
   * introduced above this bridge rather than modifying
   * the verified engines.
   */
  const selected =
    dataset.hourly.slice(
      0,
      24,
    );

  const hourly =
    selected.map(
      toLegacyHourlyPoint,
    );

  const temperatures =
    hourly.map(
      (point) =>
        point.temperature,
    );

  const precipitation =
    hourly.map(
      (point) =>
        point.precipitation,
    );

  const windSpeeds =
    hourly.map(
      (point) =>
        point.windSpeed,
    );

  const cloudCover =
    hourly.map(
      (point) =>
        point.cloudCover,
    );

  /*
   * Hourly mean GHI in W/m² integrated for one-hour
   * intervals gives Wh/m². Divide by 1000 for kWh/m²/day.
   */
  const dailyGHI =
    hourly.reduce(
      (
        sum,
        point,
      ) =>
        sum +
        point.shortwaveRadiation,
      0,
    ) /
    1000;

  const requested =
    dataset.provenance
      .requestedCoordinate;

  const resolved =
    dataset.provenance
      .resolvedCoordinate ??
    requested;

  return {
    summary: {
      date:
        dataset.startTime.slice(
          0,
          10,
        ),

      latitude:
        resolved.latitude,

      longitude:
        resolved.longitude,

      timezone:
        dataset.provenance
          .timezone,

      sunrise:
        inferSunrise(
          hourly,
        ),

      sunset:
        inferSunset(
          hourly,
        ),

      maximumTemperature:
        maximum(
          temperatures,
        ),

      minimumTemperature:
        minimum(
          temperatures,
        ),

      totalPrecipitation:
        precipitation.reduce(
          (
            sum,
            value,
          ) =>
            sum + value,
          0,
        ),

      maximumWindSpeed:
        maximum(
          windSpeeds,
        ),

      averageCloudCover:
        average(
          cloudCover,
        ),

      dailyGHI,

      source:
        "Open-Meteo",
    },

    hourly,
  };
}
