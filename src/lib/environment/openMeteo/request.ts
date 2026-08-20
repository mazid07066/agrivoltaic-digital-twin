import type {
  EnvironmentalDataRequest,
} from "../request";

const HISTORICAL_ENDPOINT =
  "https://archive-api.open-meteo.com/v1/archive";

const FORECAST_ENDPOINT =
  "https://api.open-meteo.com/v1/forecast";

const HOURLY_VARIABLES = [
  "shortwave_radiation",
  "direct_normal_irradiance",
  "diffuse_radiation",
  "temperature_2m",
  "relative_humidity_2m",
  "cloud_cover",
  "wind_speed_10m",
  "wind_direction_10m",
  "precipitation",
  "surface_pressure",
  "et0_fao_evapotranspiration",
];

const DAILY_VARIABLES = [
  "sunrise",
  "sunset",
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_sum",
  "wind_speed_10m_max",
];

export function buildOpenMeteoUrl(
  request: EnvironmentalDataRequest,
): string {
  if (
    request.source !== "open_meteo"
  ) {
    throw new Error(
      "Open-Meteo adapter received a non Open-Meteo source.",
    );
  }

  if (
    request.mode !== "historical" &&
    request.mode !== "forecast"
  ) {
    throw new Error(
      `Open-Meteo mode "${request.mode}" is not supported by this adapter.`,
    );
  }

  const endpoint =
    request.mode === "historical"
      ? HISTORICAL_ENDPOINT
      : FORECAST_ENDPOINT;

  const url =
    new URL(endpoint);

  url.searchParams.set(
    "latitude",
    String(
      request.coordinate.latitude,
    ),
  );

  url.searchParams.set(
    "longitude",
    String(
      request.coordinate.longitude,
    ),
  );

  url.searchParams.set(
    "hourly",
    HOURLY_VARIABLES.join(","),
  );

  url.searchParams.set(
    "daily",
    DAILY_VARIABLES.join(","),
  );

  url.searchParams.set(
    "timezone",
    request.timezone ??
      "auto",
  );

  url.searchParams.set(
    "wind_speed_unit",
    "ms",
  );

  if (
    request.mode === "historical"
  ) {
    url.searchParams.set(
      "start_date",
      request.startDate,
    );

    url.searchParams.set(
      "end_date",
      request.endDate,
    );
  } else {
    url.searchParams.set(
      "start_date",
      request.startDate,
    );

    url.searchParams.set(
      "end_date",
      request.endDate,
    );
  }

  return url.toString();
}
