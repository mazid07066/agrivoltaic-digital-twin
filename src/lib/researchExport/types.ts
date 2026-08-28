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
  source: "historical" | "forecast" | "measured";
  powerKw: number;
}

export interface ResearchWeatherRow {
  date: string;
  hour: string;
  timestampLocal: string;
  timezone: string;
  source: "historical" | "forecast" | "measured";
  ghiWM2: number;
  dniWM2: number;
  dhiWM2: number;
  temperatureC: number;
  relativeHumidityPercent: number;
  cloudCoverPercent: number | null;
  windSpeed: number;
  precipitationMm: number;
  pressureHpa?: number | null;
  windDirectionDeg?: number | null;
  qualityStatus?: "complete" | "partial" | "invalid";
  validSourceMinutes?: number;
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
  weatherProvider?: "open_meteo" | "feni_measured";
  weatherDatasetId?: string;
  weatherStation?: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    elevationM: number;
  };
  weatherApplicationClassification?: "co_located" | "spatial_transfer";
}
