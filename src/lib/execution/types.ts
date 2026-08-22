import type {
  ElectricalSimulationResult,
} from "@/lib/electrical/types";

import type {
  EnvironmentalDataset,
  EnvironmentalMode,
  EnvironmentalSource,
  GeographicCoordinate,
} from "@/lib/environment/types";

import type {
  SiteVersionSnapshot,
} from "@/lib/projects/types";

import type {
  Scenario,
} from "@/lib/scenarios/types";

import type {
  SiteProfile,
} from "@/lib/sites/schema";

export type SimulationExecutionStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type SimulationEngineKind =
  | "land"
  | "rooftop";

export interface SimulationEngineIdentity {
  executionContractVersion:
    string;

  engineKind:
    SimulationEngineKind;

  engineVersion:
    string;

  controllerVersion:
    string | null;

  weatherAdapterVersion:
    string | null;

  moduleCatalogueVersion:
    string | null;
}

export interface ScenarioExecutionIdentity {
  scenarioId:
    string;

  scenarioVersion:
    number;

  scenarioName:
    string;

  scenarioType:
    string;

  isBaseline:
    boolean;
}

export interface SiteExecutionIdentity {
  projectId:
    string;

  siteId:
    string;

  siteVersionId:
    string;

  siteVersionNumber:
    number;

  siteSchemaVersion:
    number;

  siteType:
    SiteProfile["siteType"];

  siteName:
    string;
}

export interface EnvironmentalExecutionIdentity {
  source:
    EnvironmentalSource;

  mode:
    EnvironmentalMode;

  datasetId:
    string | null;

  requestFingerprint:
    string | null;

  datasetFingerprint:
    string | null;

  requestedCoordinate:
    GeographicCoordinate;

  resolvedCoordinate:
    GeographicCoordinate | null;

  timezone:
    string;

  startTime:
    string;

  endTime:
    string;

  recordCount:
    number;

  expectedRecordCount:
    number | null;

  coveragePercent:
    number | null;

  missingRequiredValueCount:
    number;

  warnings:
    string[];
}

export interface ScenarioConfigurationSnapshot {
  technicalConfig:
    Scenario["technicalConfig"];

  agriculturalConfig:
    Scenario["agriculturalConfig"];

  weatherConfig:
    Scenario["weatherConfig"];

  policyConfig:
    Scenario["policyConfig"];

  economicConfig:
    Scenario["economicConfig"];

  metadata:
    Scenario["metadata"];
}

export interface SimulationExecutionInputSnapshot {
  schema:
    "agritwin-execution-input-v1";

  inputFingerprint:
    string | null;

  simulationDate:
    string;

  engine:
    SimulationEngineIdentity;

  scenario:
    ScenarioExecutionIdentity;

  site:
    SiteExecutionIdentity;

  scenarioConfiguration:
    ScenarioConfigurationSnapshot;

  siteConfiguration:
    SiteProfile;

  environment:
    EnvironmentalExecutionIdentity;
}

/**
 * Full in-memory execution context.
 *
 * The EnvironmentalDataset can contain thousands of records and
 * therefore is deliberately separate from the compact persisted
 * execution input snapshot.
 */
export interface ResolvedSimulationExecutionInput {
  scenario:
    Scenario;

  siteVersion:
    SiteVersionSnapshot;

  environment:
    EnvironmentalDataset;

  inputSnapshot:
    SimulationExecutionInputSnapshot;
}

export interface CanonicalHourlySimulationPoint {
  hourIndex:
    number;

  timestamp:
    string;

  solarAltitudeDeg:
    number | null;

  solarAzimuthDeg:
    number | null;

  ghiWm2:
    number | null;

  poaWm2:
    number | null;

  moduleTemperatureC:
    number | null;

  pvPowerKw:
    number | null;

  trackerAngleDeg:
    number | null;

  trackingState:
    string | null;

  openFieldDliIncrementMolM2:
    number | null;

  cropDliIncrementMolM2:
    number | null;

  additionalValues:
    Record<string, unknown>;
}

export type CanonicalSpatialResultKind =
  | "daily_dli_grid"
  | "hourly_shadow_grid"
  | "protected_zone_statistics"
  | "other";

export interface CanonicalSpatialSimulationResult {
  resultKind:
    CanonicalSpatialResultKind;

  hourIndex:
    number | null;

  gridDefinition:
    Record<string, unknown>;

  valuesData:
    unknown;

  statistics:
    Record<string, unknown> | null;
}

export interface CanonicalSimulationSummary {
  engineKind:
    SimulationEngineKind;

  siteType:
    SiteProfile["siteType"];

  installedCapacityKw:
    number | null;

  dailyEnergyKwh:
    number | null;

  specificYieldKwhPerKw:
    number | null;

  openFieldDliMolM2:
    number | null;

  cropDliMolM2:
    number | null;

  estimatedCropYieldPercent:
    number | null;

  landEquivalentRatio:
    number | null;

  groundCoverageRatioPercent:
    number | null;

  usableAreaPercent:
    number | null;

  moduleCount:
    number | null;

  additionalMetrics:
    Record<string, number | string | boolean | null>;
}

export interface SimulationExecutionResult {
  schema:
    "agritwin-execution-result-v1";

  status:
    "completed";

  engine:
    SimulationEngineIdentity;

  simulationDate:
    string;

  summary:
    CanonicalSimulationSummary;

  hourly:
    CanonicalHourlySimulationPoint[];

  spatial:
    CanonicalSpatialSimulationResult[];

  /**
   * Optional Phase 9E downstream electrical result.
   *
   * Historical Phase 9C/9D runs do not contain this field
   * and remain valid.
   */
  electrical?:
    ElectricalSimulationResult;

  warnings:
    string[];
}

export interface FailedSimulationExecution {
  schema:
    "agritwin-execution-result-v1";

  status:
    "failed";

  engine:
    SimulationEngineIdentity;

  simulationDate:
    string;

  errorMessage:
    string;

  warnings:
    string[];
}

export type SimulationExecutionOutcome =
  | SimulationExecutionResult
  | FailedSimulationExecution;
