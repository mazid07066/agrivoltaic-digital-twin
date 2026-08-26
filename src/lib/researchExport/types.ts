import type {
  FlatRoofSiteProfile,
  LandAgrivoltaicSiteProfile,
} from "@/lib/sites/schema";

import type {
  DailyPowerPoint,
  PowerSeriesMode,
  PowerSeriesSummary,
} from "@/types/powerSeries";

export interface ResearchHourlyPowerRow {
  date: string;
  hour: string;
  timestampLocal: string;
  timezone: string;
  source: "historical" | "forecast";
  powerKw: number;
}

export interface ResearchWeatherRow {
  date: string;
  hour: string;
  timestampLocal: string;
  timezone: string;
  source: "historical" | "forecast";
  ghiWM2: number;
  dniWM2: number;
  dhiWM2: number;
  temperatureC: number;
  relativeHumidityPercent: number;
  cloudCoverPercent: number;
  windSpeed: number;
  precipitationMm: number;
}

export interface ResearchExportPayload {
  schema: "agritwin-research-export-v1";
  generatedAt: string;
  siteKind: "land" | "rooftop";
  site:
    | LandAgrivoltaicSiteProfile
    | FlatRoofSiteProfile;
  mode: PowerSeriesMode;
  startDate: string;
  endDate: string;
  summary: PowerSeriesSummary;
  dailyPower: DailyPowerPoint[];
  hourlyPower: ResearchHourlyPowerRow[];
  weather: ResearchWeatherRow[];
  warnings: string[];
}
