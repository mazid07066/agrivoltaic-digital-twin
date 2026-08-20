export type EnvironmentalSource =
  | "open_meteo"
  | "sensor"
  | "uploaded_dataset"
  | "synthetic"
  | "manual";

export type EnvironmentalMode =
  | "historical"
  | "forecast"
  | "typical"
  | "sensor"
  | "dataset";

export interface GeographicCoordinate {
  latitude: number;
  longitude: number;
}

export interface EnvironmentalProvenance {
  source: EnvironmentalSource;

  mode: EnvironmentalMode;

  provider?: string | null;

  requestedCoordinate:
    GeographicCoordinate;

  resolvedCoordinate?:
    GeographicCoordinate | null;

  /**
   * Approximate great-circle distance between
   * the requested site coordinate and the
   * environmental provider grid coordinate.
   */
  resolvedGridDistanceKm?:
    number | null;

  timezone: string;

  retrievedAt: string;

  datasetId?: string | null;

  providerModel?: string | null;

  providerElevationM?: number | null;

  /**
   * Stable SHA-256 identity of the normalized
   * environmental request.
   */
  requestFingerprint?:
    string | null;

  /**
   * SHA-256 identity of the normalized
   * environmental dataset content.
   */
  datasetFingerprint?:
    string | null;

  rawSourceMetadata?:
    Record<string, unknown>;
}

export interface EnvironmentalHourlyPoint {
  timestamp: string;

  ghiWm2: number | null;
  dniWm2: number | null;
  dhiWm2: number | null;

  gtiWm2?: number | null;

  temperatureC: number | null;

  relativeHumidityPct:
    number | null;

  cloudCoverPct:
    number | null;

  windSpeedMs:
    number | null;

  windDirectionDeg?:
    number | null;

  precipitationMm:
    number | null;

  pressureHpa?:
    number | null;

  et0Mm?:
    number | null;

  soilTemperatureC?:
    number | null;

  soilMoistureM3M3?:
    number | null;

  additionalValues?:
    Record<string, unknown>;
}

export interface EnvironmentalDailySummary {
  date: string;

  sunrise?: string | null;
  sunset?: string | null;

  maximumTemperatureC?:
    number | null;

  minimumTemperatureC?:
    number | null;

  totalPrecipitationMm?:
    number | null;

  maximumWindSpeedMs?:
    number | null;

  averageCloudCoverPct?:
    number | null;

  dailyGhiKwhM2?:
    number | null;
}

export interface EnvironmentalQuality {
  recordCount: number;

  missingValueCount: number;

  warnings: string[];

  expectedHourlyRecordCount?:
    number | null;

  coveragePercent?:
    number | null;
}

export interface EnvironmentalDataset {
  schemaVersion: 1;

  provenance:
    EnvironmentalProvenance;

  startTime: string;
  endTime: string;

  hourly:
    EnvironmentalHourlyPoint[];

  daily?:
    EnvironmentalDailySummary[];

  quality:
    EnvironmentalQuality;
}
