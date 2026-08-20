import type {
  EnvironmentalMode,
} from "../types";

export type DatasetColumnUnit =
  | "W/m2"
  | "C"
  | "%"
  | "m/s"
  | "km/h"
  | "mm"
  | "hPa"
  | "degree"
  | "unknown";

export interface LocalDatasetColumnMap {
  timestamp: string;

  ghi?: string | null;
  dni?: string | null;
  dhi?: string | null;

  temperature?: string | null;

  relativeHumidity?: string | null;

  cloudCover?: string | null;

  windSpeed?: string | null;
  windDirection?: string | null;

  precipitation?: string | null;

  pressure?: string | null;

  et0?: string | null;
}

export interface LocalDatasetUnits {
  ghi?: DatasetColumnUnit;
  dni?: DatasetColumnUnit;
  dhi?: DatasetColumnUnit;

  temperature?: DatasetColumnUnit;

  relativeHumidity?: DatasetColumnUnit;

  cloudCover?: DatasetColumnUnit;

  windSpeed?: DatasetColumnUnit;
  windDirection?: DatasetColumnUnit;

  precipitation?: DatasetColumnUnit;

  pressure?: DatasetColumnUnit;

  et0?: DatasetColumnUnit;
}

export interface LocalEnvironmentalDatasetDefinition {
  id: string;

  name: string;

  description?: string | null;

  /**
   * Path relative to data/environment.
   *
   * Absolute paths are deliberately not allowed.
   */
  filename: string;

  format: "csv";

  parser:
    | "standard_csv"
    | "solar_mem";

  timezone: string;

  mode: EnvironmentalMode;

  columnMap:
    LocalDatasetColumnMap;

  units:
    LocalDatasetUnits;

  metadata?: Record<
    string,
    unknown
  >;
}
