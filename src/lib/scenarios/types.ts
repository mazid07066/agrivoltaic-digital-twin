export type ScenarioStatus =
  | "draft"
  | "ready"
  | "active"
  | "archived";

export type ScenarioType =
  | "agrivoltaic"
  | "agriculture_baseline"
  | "pv_baseline"
  | "rooftop_pv"
  | "research"
  | "custom";

export type WeatherSource =
  | "open_meteo"
  | "sensor"
  | "uploaded_dataset"
  | "synthetic"
  | "manual";

export type WeatherMode =
  | "historical"
  | "forecast"
  | "typical"
  | "dataset"
  | "sensor";

export type TrackingMode =
  | "fixed"
  | "standard"
  | "reverse"
  | "custom";

export interface ScenarioTechnicalConfig {
  moduleId?: string | null;
  inverterId?: string | null;

  modulePowerW?: number | null;

  /**
   * Identical inverter units assigned to the array.
   */
  inverterCount?: number | null;

  /**
   * Electrical string design; independent of physical row layout.
   */
  modulesPerString?: number | null;
  stringsPerInverter?: number | null;
  stringsPerMppt?: number | null;

  minimumDesignTemperatureC?: number | null;
  maximumDesignCellTemperatureC?: number | null;
  bifacialCurrentFactor?: number | null;

  panelHeightM?: number | null;
  rowSpacingM?: number | null;

  tiltDeg?: number | null;
  azimuthDeg?: number | null;

  gcr?: number | null;

  trackingMode?: TrackingMode | null;

  rows?: number | null;
  modulesPerRow?: number | null;

  systemEfficiency?: number | null;

  additionalValues?: Record<string, unknown>;
}

export interface ScenarioAgriculturalConfig {
  cropId?: string | null;
  cropName?: string | null;

  season?: string | null;

  targetDliMolM2Day?: number | null;
  minimumDliMolM2Day?: number | null;

  minimumCropRetention?: number | null;

  yieldModel?: string | null;

  additionalValues?: Record<string, unknown>;
}

export interface ScenarioWeatherConfig {
  source?: WeatherSource | null;
  mode?: WeatherMode | null;

  startDate?: string | null;
  endDate?: string | null;

  year?: number | null;

  datasetId?: string | null;

  latitude?: number | null;
  longitude?: number | null;

  timezone?: string | null;

  additionalValues?: Record<string, unknown>;
}

export interface ScenarioPolicyConfig {
  minimumCropRetention?: number | null;

  maximumGcr?: number | null;

  minimumLer?: number | null;

  minimumPanelHeightM?: number | null;

  maximumDliReduction?: number | null;

  minimumRenewableEnergyKwh?: number | null;

  policyPreset?: string | null;

  additionalValues?: Record<string, unknown>;
}

export interface ScenarioEconomicConfig {
  currency?: string | null;

  capex?: number | null;
  annualOpex?: number | null;

  electricityTariffPerKwh?: number | null;

  cropPrice?: number | null;

  discountRate?: number | null;
  projectLifetimeYears?: number | null;

  additionalValues?: Record<string, unknown>;
}

export interface ScenarioMetadata {
  studyName?: string | null;
  researcher?: string | null;

  objective?: string | null;

  notes?: string | null;

  tags?: string[];

  provenance?: Record<string, unknown>;
}

export interface Scenario {
  id: string;

  projectId: string;
  siteId: string;

  name: string;
  description: string | null;

  scenarioType: ScenarioType | string;
  status: ScenarioStatus;

  isBaseline: boolean;

  parentScenarioId: string | null;

  scenarioVersion: number;

  /**
   * Existing Phase 8B configuration snapshot.
   * Retained for backwards compatibility.
   */
  configuration: Record<string, unknown>;

  technicalConfig: ScenarioTechnicalConfig;

  agriculturalConfig: ScenarioAgriculturalConfig;

  weatherConfig: ScenarioWeatherConfig;

  policyConfig: ScenarioPolicyConfig;

  economicConfig: ScenarioEconomicConfig;

  metadata: ScenarioMetadata;

  createdBy: string | null;

  createdAt: string;
  updatedAt: string;

  archivedAt: string | null;
}

export interface CreateScenarioInput {
  projectId: string;
  siteId: string;

  name: string;

  description?: string | null;

  scenarioType?: ScenarioType | string;

  status?: ScenarioStatus;

  isBaseline?: boolean;

  parentScenarioId?: string | null;

  configuration?: Record<string, unknown>;

  technicalConfig?: ScenarioTechnicalConfig;

  agriculturalConfig?: ScenarioAgriculturalConfig;

  weatherConfig?: ScenarioWeatherConfig;

  policyConfig?: ScenarioPolicyConfig;

  economicConfig?: ScenarioEconomicConfig;

  metadata?: ScenarioMetadata;
}

export interface UpdateScenarioInput {
  name?: string;

  description?: string | null;

  scenarioType?: ScenarioType | string;

  status?: ScenarioStatus;

  isBaseline?: boolean;

  parentScenarioId?: string | null;

  configuration?: Record<string, unknown>;

  technicalConfig?: ScenarioTechnicalConfig;

  agriculturalConfig?: ScenarioAgriculturalConfig;

  weatherConfig?: ScenarioWeatherConfig;

  policyConfig?: ScenarioPolicyConfig;

  economicConfig?: ScenarioEconomicConfig;

  metadata?: ScenarioMetadata;
}

export interface DuplicateScenarioInput {
  sourceScenarioId: string;

  name?: string;

  description?: string | null;
}
