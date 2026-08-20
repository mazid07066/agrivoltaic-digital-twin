export {
  createExecutionFingerprint,
} from "./fingerprint";

export {
  createSimulationExecutionInputSnapshot,
} from "./inputSnapshot";

export {
  createEnvironmentalExecutionIdentity,
  createScenarioConfigurationSnapshot,
  createScenarioExecutionIdentity,
  createSimulationEngineIdentity,
  createSiteExecutionIdentity,
  resolveSimulationEngineKind,
} from "./identity";

export {
  canonicalHourlySimulationPointSchema,
  canonicalSimulationSummarySchema,
  environmentalExecutionIdentitySchema,
  executionIdentitySchema,
  simulationEngineIdentitySchema,
  simulationEngineKindSchema,
  simulationExecutionStatusSchema,
} from "./schema";

export {
  CONTROLLER_VERSION,
  EXECUTION_CONTRACT_VERSION,
  LAND_ENGINE_VERSION,
  ROOFTOP_ENGINE_VERSION,
  WEATHER_ADAPTER_VERSION,
} from "./versions";

export type {
  CanonicalHourlySimulationPoint,
  CanonicalSimulationSummary,
  CanonicalSpatialResultKind,
  CanonicalSpatialSimulationResult,
  EnvironmentalExecutionIdentity,
  FailedSimulationExecution,
  ResolvedSimulationExecutionInput,
  ScenarioConfigurationSnapshot,
  ScenarioExecutionIdentity,
  SimulationEngineIdentity,
  SimulationEngineKind,
  SimulationExecutionInputSnapshot,
  SimulationExecutionOutcome,
  SimulationExecutionResult,
  SimulationExecutionStatus,
  SiteExecutionIdentity,
} from "./types";

export {
  createExecutionInputPreview,
} from "./preview";

export {
  resolveSimulationExecutionInputWithDependencies,
} from "./resolveInput";

export type {
  ExecutionEnvironmentContext,
  ExecutionEnvironmentLoader,
  ResolveExecutionInputDependencies,
} from "./resolveInput";

export {
  environmentalDatasetToWeatherResponse,
} from "./environmentWeatherBridge";

export {
  executeLandSimulation,
} from "./landAdapter";

export {
  executeRooftopSimulation,
} from "./rooftopAdapter";

export {
  executeResolvedSimulation,
} from "./executeResolved";

export {
  mapPersistedSimulationRun,
  mapSimulationHourlyRow,
  mapSimulationSpatialRow,
} from "./persistedRunMapper";

export {
  verifyPersistedSimulationRun,
} from "./reproducibility";

export type {
  PersistedSimulationRun,
  ReproducibilityCheck,
  SimulationRunReproducibilityReport,
} from "./persistedRunTypes";

export {
  createHourlyResultInserts,
  createSimulationRunInsert,
  createSpatialResultInserts,
  createWeatherSnapshot,
  localTimestampToUtcIso,
} from "./persistenceMapping";
