import type {
  ScenarioAgriculturalConfig,
  ScenarioEconomicConfig,
  ScenarioMetadata,
  ScenarioPolicyConfig,
  ScenarioTechnicalConfig,
  ScenarioWeatherConfig,
} from "./types";

export const DEFAULT_TECHNICAL_CONFIG: ScenarioTechnicalConfig = {
  moduleId: null,
  inverterId: null,

  modulePowerW: null,

  inverterCount: null,

  modulesPerString: null,
  stringsPerInverter: null,
  stringsPerMppt: null,

  minimumDesignTemperatureC: null,
  maximumDesignCellTemperatureC: null,
  bifacialCurrentFactor: null,

  panelHeightM: null,
  rowSpacingM: null,

  tiltDeg: null,
  azimuthDeg: null,

  gcr: null,

  trackingMode: "fixed",

  rows: null,
  modulesPerRow: null,

  systemEfficiency: null,

  additionalValues: {},
};

export const DEFAULT_AGRICULTURAL_CONFIG: ScenarioAgriculturalConfig = {
  cropId: null,
  cropName: null,

  season: null,

  targetDliMolM2Day: null,
  minimumDliMolM2Day: null,

  minimumCropRetention: null,

  yieldModel: null,

  additionalValues: {},
};

export const DEFAULT_WEATHER_CONFIG: ScenarioWeatherConfig = {
  source: "open_meteo",
  mode: "historical",

  startDate: null,
  endDate: null,

  year: null,

  datasetId: null,

  latitude: null,
  longitude: null,

  timezone: null,

  additionalValues: {},
};

export const DEFAULT_POLICY_CONFIG: ScenarioPolicyConfig = {
  minimumCropRetention: 0.8,

  maximumGcr: 0.4,

  minimumLer: 1.1,

  minimumPanelHeightM: null,

  maximumDliReduction: null,

  minimumRenewableEnergyKwh: null,

  policyPreset: "balanced",

  additionalValues: {},
};

export const DEFAULT_ECONOMIC_CONFIG: ScenarioEconomicConfig = {
  currency: "BDT",

  capex: null,
  annualOpex: null,

  electricityTariffPerKwh: null,

  cropPrice: null,

  discountRate: null,
  projectLifetimeYears: null,

  additionalValues: {},
};

export const DEFAULT_SCENARIO_METADATA: ScenarioMetadata = {
  studyName: null,
  researcher: null,

  objective: null,

  notes: null,

  tags: [],

  provenance: {},
};
