export interface WeatherHourlyPoint {
  time: string;
  hour: string;
  shortwaveRadiation: number;
  directNormalIrradiance: number;
  diffuseRadiation: number;
  temperature: number;
  relativeHumidity: number;
  cloudCover: number | null;
  windSpeed: number;
  precipitation: number;
  pressure?: number | null;
  windDirection?: number | null;
  qualityStatus?: "complete" | "partial" | "invalid";
  validSourceMinutes?: number;
}

export interface WeatherSummary {
  date: string;
  latitude: number;
  longitude: number;
  timezone: string;
  sunrise: string;
  sunset: string;
  maximumTemperature: number;
  minimumTemperature: number;
  totalPrecipitation: number;
  maximumWindSpeed: number;
  averageCloudCover: number | null;
  dailyGHI: number;
  source: "Open-Meteo" | "World Bank/ESMAP Feni BDFE2";
}

export interface WeatherResponse {
  summary: WeatherSummary;
  hourly: WeatherHourlyPoint[];
}

export interface WeatherApiError {
  error: string;
  details?: string;
  retryable?: boolean;
}

export type WeatherSeriesSource =
  | "historical"
  | "forecast"
  | "measured"
  | "mixed";

export type WeatherProvider =
  | "open_meteo"
  | "feni_measured";

export interface WeatherRangeSegment {
  source:
    | "historical"
    | "forecast";

  startDate:
    string;

  endDate:
    string;
}

export interface WeatherRangePlan {
  schema:
    "agritwin-weather-range-plan-v1";

  requestedStartDate:
    string;

  requestedEndDate:
    string;

  earliestHistoricalDate:
    string;

  latestForecastDate:
    string;

  source:
    WeatherSeriesSource;

  segments:
    WeatherRangeSegment[];

  provider?: WeatherProvider;

  station?: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    elevationM: number;
  };

  target?: {
    latitude: number;
    longitude: number;
    classification: "co_located" | "spatial_transfer";
  };

  dataset?: {
    id: string;
    license: string;
    sourceTimezone: "UTC";
    applicationTimezone: "Asia/Dhaka";
    normalizedResolution: "1 hour";
    sha256: string;
  };
}

export interface WeatherRangeDay {
  date:
    string;

  source:
    | "historical"
    | "forecast"
    | "measured";

  weather:
    WeatherResponse;
}

export interface WeatherRangeResponse {
  schema:
    "agritwin-weather-range-v1";

  plan:
    WeatherRangePlan;

  days:
    WeatherRangeDay[];

  warnings:
    string[];
}
