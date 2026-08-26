export const VALIDATION_EXCHANGE_SCHEMA =
  "agritwin-validation-exchange-v1" as const;

export type ValidationExchangeSchema =
  typeof VALIDATION_EXCHANGE_SCHEMA;

export type ValidationSiteKind =
  | "land"
  | "rooftop";

export type ValidationWeatherPeriod =
  | "historical"
  | "forecast"
  | "mixed";

export type ValidationPowerResolution =
  | "hourly"
  | "daily";

export type ValidationQualityFlag =
  | "provider"
  | "interpolated"
  | "provider_missing"
  | "not_available";

export interface ValidationSoftwareVersion {
  name: string;
  version: string;
}

export interface ValidationExchangeManifest {
  schema: ValidationExchangeSchema;
  packageId: string;
  createdAt: string;
  runId: string | null;
  inputFingerprint: string;
  environmentFingerprint: string | null;
  sourceCommit: string | null;
  siteKind: ValidationSiteKind;
  siteId: string;
  siteVersionId: string | null;
  scenarioId: string | null;
  simulationDate: string;
  startDate: string;
  endDate: string;
  timezone: string;
  weatherPeriod: ValidationWeatherPeriod;
  moduleProfileId: string | null;
  inverterProfileId: string | null;
  software: ValidationSoftwareVersion[];
  files: ValidationExchangeFile[];
}

export interface ValidationExchangeFile {
  path: string;
  mediaType: string;
  description: string;
  rowCount: number | null;
  sha256: string | null;
}

export interface ValidationWeatherRow {
  timestampUtc: string;
  timestampLocal: string;
  timezone: string;
  source: string;
  sourcePeriod:
    | "historical"
    | "forecast";
  ghiWM2: number | null;
  dniWM2: number | null;
  dhiWM2: number | null;
  temperatureC: number | null;
  relativeHumidityPercent: number | null;
  windSpeedMS: number | null;
  precipitationMm: number | null;
  pressurePa: number | null;
  qualityFlag: ValidationQualityFlag;
}

export interface ValidationHourlyPowerRow {
  resolution: "hourly";
  timestampUtc: string;
  timestampLocal: string;
  timezone: string;
  sourcePeriod:
    | "historical"
    | "forecast";
  pvPowerKw: number;
  pvDcPowerKw: number | null;
  pvAcPowerKw: number | null;
  poaIrradianceWM2: number | null;
  moduleTemperatureC: number | null;
  inverterState: string | null;
}

export interface ValidationDailyPowerRow {
  resolution: "daily";
  date: string;
  timezone: string;
  sourcePeriod:
    | "historical"
    | "forecast"
    | "mixed";
  dailyEnergyKWh: number;
  peakPowerKw: number;
  sampleCount: number;
}

export type ValidationPowerRow =
  | ValidationHourlyPowerRow
  | ValidationDailyPowerRow;

export interface ValidationElectricalTopologyRow {
  inverterIndex: number;
  inverterProfileId: string;
  mpptIndex: number;
  stringIndex: number;
  modulesPerString: number;
  stringModuleCount: number;
  moduleProfileId: string;
  allocationStatus:
    | "assigned"
    | "inactive";
}

export interface ValidationPhysicalTopologyRow {
  rowIndex: number;
  moduleIndex: number;
  xM: number;
  yM: number;
  zM: number;
  tiltDeg: number;
  azimuthDeg: number;
  trackingMode: string;
  rowSpacingM: number;
  panelHeightM: number;
  fieldLengthM: number | null;
  fieldWidthM: number | null;
}
