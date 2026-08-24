import type {
  WeatherSeriesSource,
} from "./weather";

export type PowerSeriesMode =
  | "day"
  | "range";

export interface HourlyPowerPoint {
  hour:
    string;

  powerKw:
    number;
}

export interface DailyPowerPoint {
  date:
    string;

  dailyEnergyKWh:
    number;

  peakPowerKw:
    number;

  source:
    "historical"
    | "forecast";
}

export interface PowerSeriesSummary {
  dayCount:
    number;

  totalEnergyKWh:
    number;

  averageDailyEnergyKWh:
    number;

  peakDailyEnergyKWh:
    number;

  peakPowerKw:
    number;

  source:
    WeatherSeriesSource;
}
