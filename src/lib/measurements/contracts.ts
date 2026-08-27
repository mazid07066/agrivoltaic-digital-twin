export type MeasurementVariableKey =
  | "ghi"
  | "dni"
  | "dhi"
  | "ambientTemperature"
  | "relativeHumidity"
  | "windSpeed"
  | "windDirection"
  | "atmosphericPressure"
  | "precipitation";

export type MeasurementQualityStatus =
  | "valid"
  | "flagged"
  | "invalid"
  | "missing";

export interface MeasurementStationIdentity {
  id: string;
  name: string;
  hostInstitution: string | null;
  equipment: string | null;
  latitude: number;
  longitude: number;
  elevationM: number | null;
  timezone: string;
}

export interface MeasurementSensorIdentity {
  variable: MeasurementVariableKey;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  heightM: number | null;
  orientation: string | null;
  activeFrom: string | null;
  activeTo: string | null;
}

export interface MeasurementSourceResource {
  id: string;
  role: string;
  name: string;
  format: string;
  url: string;
  localPath: string | null;
  fileSizeBytes: number | null;
  sha256: string | null;
  acquired: boolean;
  immutable: boolean;
}

export interface MeasurementDatasetManifest {
  schemaVersion: 1;
  datasetId: string;
  title: string;
  publisher: string;
  serviceProvider: string | null;
  officialDatasetId: string;
  officialSourceUrl: string;
  licence: {
    id: string;
    title: string;
    url: string;
  };
  citation: string;
  retrievedAt: string;
  manifestCreatedAt: string;
  station: MeasurementStationIdentity;
  sensors: MeasurementSensorIdentity[];
  measurementPeriod: {
    start: string;
    end: string;
    sourceResolution: string;
    expectedIntervalSeconds: number;
  };
  resources: MeasurementSourceResource[];
  scientificBoundaries: {
    validationScope: "environmental_reconstruction";
    isDhakaValidation: false;
    dhakaApplicationClassification: "spatial_transfer";
    fullDigitalTwinValidation: false;
    modelTrainingPerformed: false;
  };
}

export interface BronzeMeasurementValue {
  rawValue: string | null;
  originalUnit: string | null;
  rawQcFlag: string | null;
}

export interface SilverMeasurementValue {
  value: number | null;
  normalizedUnit: string;
  qualityStatus: MeasurementQualityStatus;
  rawQcFlag: string | null;
  qcComponents: string[];
  missingValueReason: string | null;
}

export interface BronzeMeasurementRecord {
  schemaVersion: 1;
  datasetId: string;
  stationId: string;
  sourceFileSha256: string;
  sourceRowNumber: number;
  originalTimestamp: string;
  values: Partial<
    Record<MeasurementVariableKey, BronzeMeasurementValue>
  >;
}

export interface SilverMeasurementRecord {
  schemaVersion: 1;
  datasetId: string;
  stationId: string;
  sourceFileSha256: string;
  sourceRowNumber: number;
  originalTimestamp: string;
  timestampUtc: string;
  timestampLocal: string;
  values: Partial<
    Record<MeasurementVariableKey, SilverMeasurementValue>
  >;
}
