import type {
  WeatherRangePlan,
  WeatherRangeSegment,
  WeatherSeriesSource,
} from "@/types/weather";

export const OPEN_METEO_EARLIEST_DATE =
  "1940-01-01";

export const OPEN_METEO_RECENT_PAST_DAYS =
  5;

export const OPEN_METEO_MAX_FUTURE_DAYS =
  15;

function requireIsoDate(
  value: string,
  label: string,
): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(
      `${label} must use the YYYY-MM-DD format.`,
    );
  }

  const parsed =
    new Date(`${value}T00:00:00Z`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw new Error(
      `${label} must be a valid calendar date.`,
    );
  }

  return parsed;
}

export function addUtcDays(
  date: string,
  days: number,
): string {
  const parsed =
    requireIsoDate(date, "Date");

  parsed.setUTCDate(
    parsed.getUTCDate() + days,
  );

  return parsed
    .toISOString()
    .slice(0, 10);
}

function sourceForSegments(
  segments: WeatherRangeSegment[],
): WeatherSeriesSource {
  if (segments.length === 2) {
    return "mixed";
  }

  return segments[0]?.source ??
    "historical";
}

export function planOpenMeteoRange({
  startDate,
  endDate,
  todayDate,
}: {
  startDate: string;
  endDate: string;
  todayDate: string;
}): WeatherRangePlan {
  requireIsoDate(
    startDate,
    "Start date",
  );

  requireIsoDate(
    endDate,
    "End date",
  );

  requireIsoDate(
    todayDate,
    "Current date",
  );

  if (startDate > endDate) {
    throw new Error(
      "Start date must not be later than end date.",
    );
  }

  if (
    startDate <
    OPEN_METEO_EARLIEST_DATE
  ) {
    throw new Error(
      `Historical weather is available from ${OPEN_METEO_EARLIEST_DATE}.`,
    );
  }

  const latestForecastDate =
    addUtcDays(
      todayDate,
      OPEN_METEO_MAX_FUTURE_DAYS,
    );

  if (endDate > latestForecastDate) {
    throw new Error(
      `Forecast weather is currently available only through ${latestForecastDate}.`,
    );
  }

  const recentForecastStart =
    addUtcDays(
      todayDate,
      -OPEN_METEO_RECENT_PAST_DAYS,
    );

  const historicalEnd =
    addUtcDays(
      recentForecastStart,
      -1,
    );

  const segments:
    WeatherRangeSegment[] = [];

  if (startDate <= historicalEnd) {
    segments.push({
      source: "historical",
      startDate,
      endDate:
        endDate < historicalEnd
          ? endDate
          : historicalEnd,
    });
  }

  if (endDate >= recentForecastStart) {
    segments.push({
      source: "forecast",
      startDate:
        startDate > recentForecastStart
          ? startDate
          : recentForecastStart,
      endDate,
    });
  }

  return {
    schema:
      "agritwin-weather-range-plan-v1",

    requestedStartDate:
      startDate,

    requestedEndDate:
      endDate,

    earliestHistoricalDate:
      OPEN_METEO_EARLIEST_DATE,

    latestForecastDate,

    source:
      sourceForSegments(
        segments,
      ),

    segments,
  };
}
