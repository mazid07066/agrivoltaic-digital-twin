import type {
  EnvironmentalMode,
  EnvironmentalSource,
  GeographicCoordinate,
} from "./types";

export interface EnvironmentalDataRequest {
  source: EnvironmentalSource;

  mode: EnvironmentalMode;

  coordinate:
    GeographicCoordinate;

  startDate: string;
  endDate: string;

  timezone?: string;

  datasetId?: string | null;
}
