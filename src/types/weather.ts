export interface WeatherHourlyPoint {
  time: string;
  hour: string;
  shortwaveRadiation: number;
  directNormalIrradiance: number;
  diffuseRadiation: number;
  temperature: number;
  relativeHumidity: number;
  cloudCover: number;
  windSpeed: number;
  precipitation: number;
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
  averageCloudCover: number;
  dailyGHI: number;
  source: "Open-Meteo";
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
  | "mixed";

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
}

export interface WeatherRangeDay {
  date:
    string;

  source:
    | "historical"
    | "forecast";

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
