import type {
  CanonicalHourlySimulationPoint,
  CanonicalSpatialSimulationResult,
  SimulationExecutionInputSnapshot,
} from "./types";

export interface PersistedSimulationRun {
  id: string;

  projectId: string;
  siteId: string;
  siteVersionId: string;
  scenarioId: string | null;

  status:
    | "queued"
    | "running"
    | "completed"
    | "failed"
    | "cancelled";

  simulationDate: string;

  engineVersion: string;
  controllerVersion: string | null;
  siteSchemaVersion: number;
  moduleCatalogueVersion: string | null;
  weatherAdapterVersion: string | null;

  inputSnapshot:
    SimulationExecutionInputSnapshot;

  weatherSnapshot:
    unknown | null;

  resultSummary:
    unknown | null;

  warnings:
    unknown;

  errorMessage:
    string | null;

  requestedBy:
    string | null;

  startedAt:
    string | null;

  completedAt:
    string | null;

  createdAt:
    string;

  hourly:
    CanonicalHourlySimulationPoint[];

  spatial:
    CanonicalSpatialSimulationResult[];
}

export interface ReproducibilityCheck {
  key: string;
  label: string;
  passed: boolean;
  expected:
    string | number | null;
  actual:
    string | number | null;
}

export interface SimulationRunReproducibilityReport {
  runId: string;

  verified: boolean;

  inputFingerprint:
    string | null;

  recomputedInputFingerprint:
    string | null;

  checks:
    ReproducibilityCheck[];

  warnings:
    string[];
}
