import type {
  WeatherHourlyPoint,
  WeatherRangeDay,
  WeatherRangeSegment,
  WeatherResponse,
} from "@/types/weather";

export interface OpenMeteoRangeHourly {
  time:
    string[];

  shortwave_radiation:
    Array<number | null>;

  direct_normal_irradiance:
    Array<number | null>;

  diffuse_radiation:
    Array<number | null>;

  temperature_2m:
    Array<number | null>;

  relative_humidity_2m:
    Array<number | null>;

  cloud_cover:
    Array<number | null>;

  wind_speed_10m:
    Array<number | null>;

  precipitation:
    Array<number | null>;
}

export interface OpenMeteoRangeDaily {
  time:
    string[];

  sunrise:
    string[];

  sunset:
    string[];

  temperature_2m_max:
    Array<number | null>;

  temperature_2m_min:
    Array<number | null>;

  precipitation_sum:
    Array<number | null>;

  wind_speed_10m_max:
    Array<number | null>;
}

export interface OpenMeteoRangePayload {
  latitude:
    number;

  longitude:
    number;

  timezone:
    string;

  hourly:
    OpenMeteoRangeHourly;

  daily:
    OpenMeteoRangeDaily;
}

const hourlyVariables = [
  "shortwave_radiation",
  "direct_normal_irradiance",
  "diffuse_radiation",
  "temperature_2m",
  "relative_humidity_2m",
  "cloud_cover",
  "wind_speed_10m",
  "precipitation",
].join(",");

const dailyVariables = [
  "sunrise",
  "sunset",
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_sum",
  "wind_speed_10m_max",
].join(",");

function numericValue(
  values:
    Array<number | null> |
    undefined,

  index:
    number,
): number {
  const value =
    values?.[index];

  return (
    typeof value === "number" &&
    Number.isFinite(value)
  )
    ? value
    : 0;
}

function average(
  values:
    number[],
): number {
  if (values.length === 0) {
    return 0;
  }

  return (
    values.reduce(
      (total, value) =>
        total + value,
      0,
    ) /
    values.length
  );
}

function emptyHourlyPoint(
  date:
    string,

  hour:
    number,
): WeatherHourlyPoint {
  const hourText =
    `${String(hour).padStart(2, "0")}:00`;

  return {
    time:
      `${date}T${hourText}`,

    hour:
      hourText,

    shortwaveRadiation:
      0,

    directNormalIrradiance:
      0,

    diffuseRadiation:
      0,

    temperature:
      0,

    relativeHumidity:
      0,

    cloudCover:
      0,

    windSpeed:
      0,

    precipitation:
      0,
  };
}

export function buildOpenMeteoRangeUrl({
  latitude,
  longitude,
  segment,
}: {
  latitude:
    number;

  longitude:
    number;

  segment:
    WeatherRangeSegment;
}): URL {
  const baseUrl =
    segment.source ===
    "historical"
      ? "https://archive-api.open-meteo.com/v1/archive"
      : "https://api.open-meteo.com/v1/forecast";

  const url =
    new URL(baseUrl);

  url.searchParams.set(
    "latitude",
    latitude.toString(),
  );

  url.searchParams.set(
    "longitude",
    longitude.toString(),
  );

  url.searchParams.set(
    "start_date",
    segment.startDate,
  );

  url.searchParams.set(
    "end_date",
    segment.endDate,
  );

  url.searchParams.set(
    "timezone",
    "auto",
  );

  url.searchParams.set(
    "wind_speed_unit",
    "ms",
  );

  url.searchParams.set(
    "hourly",
    hourlyVariables,
  );

  url.searchParams.set(
    "daily",
    dailyVariables,
  );

  return url;
}

export function normalizeOpenMeteoRange(
  payload:
    OpenMeteoRangePayload,

  segment:
    WeatherRangeSegment,
): WeatherRangeDay[] {
  const hourlyByDate =
    new Map<
      string,
      Map<string, WeatherHourlyPoint>
    >();

  payload.hourly.time.forEach(
    (
      time,
      index,
    ) => {
      const date =
        time.slice(0, 10);

      const hour =
        time.slice(11, 16);

      const day =
        hourlyByDate.get(date) ??
        new Map<
          string,
          WeatherHourlyPoint
        >();

      day.set(
        hour,
        {
          time,

          hour,

          shortwaveRadiation:
            numericValue(
              payload.hourly
                .shortwave_radiation,
              index,
            ),

          directNormalIrradiance:
            numericValue(
              payload.hourly
                .direct_normal_irradiance,
              index,
            ),

          diffuseRadiation:
            numericValue(
              payload.hourly
                .diffuse_radiation,
              index,
            ),

          temperature:
            numericValue(
              payload.hourly
                .temperature_2m,
              index,
            ),

          relativeHumidity:
            numericValue(
              payload.hourly
                .relative_humidity_2m,
              index,
            ),

          cloudCover:
            numericValue(
              payload.hourly
                .cloud_cover,
              index,
            ),

          windSpeed:
            numericValue(
              payload.hourly
                .wind_speed_10m,
              index,
            ),

          precipitation:
            numericValue(
              payload.hourly
                .precipitation,
              index,
            ),
        },
      );

      hourlyByDate.set(
        date,
        day,
      );
    },
  );

  return payload.daily.time.map(
    (
      date,
      dailyIndex,
    ) => {
      const availableHours =
        hourlyByDate.get(date) ??
        new Map<
          string,
          WeatherHourlyPoint
        >();

      /*
       * Both simulation engines currently use a fixed
       * 24-hour contract. Construct exactly one local
       * record per clock hour, including at DST boundaries.
       */
      const hourly =
        Array.from(
          {
            length:
              24,
          },
          (
            _,
            hour,
          ) => {
            const hourText =
              `${String(hour).padStart(2, "0")}:00`;

            return (
              availableHours.get(
                hourText,
              ) ??
              emptyHourlyPoint(
                date,
                hour,
              )
            );
          },
        );

      const dailyGHI =
        hourly.reduce(
          (
            total,
            point,
          ) =>
            total +
            point.shortwaveRadiation,
          0,
        ) /
        1000;

      const weather:
        WeatherResponse = {
        summary: {
          date,

          latitude:
            payload.latitude,

          longitude:
            payload.longitude,

          timezone:
            payload.timezone,

          sunrise:
            payload.daily
              .sunrise[
                dailyIndex
              ] ?? "",

          sunset:
            payload.daily
              .sunset[
                dailyIndex
              ] ?? "",

          maximumTemperature:
            numericValue(
              payload.daily
                .temperature_2m_max,
              dailyIndex,
            ),

          minimumTemperature:
            numericValue(
              payload.daily
                .temperature_2m_min,
              dailyIndex,
            ),

          totalPrecipitation:
            numericValue(
              payload.daily
                .precipitation_sum,
              dailyIndex,
            ),

          maximumWindSpeed:
            numericValue(
              payload.daily
                .wind_speed_10m_max,
              dailyIndex,
            ),

          averageCloudCover:
            average(
              hourly.map(
                (point) =>
                  point.cloudCover,
              ),
            ),

          dailyGHI,

          source:
            "Open-Meteo",
        },

        hourly,
      };

      return {
        date,

        source:
          segment.source,

        weather,
      };
    },
  );
}
