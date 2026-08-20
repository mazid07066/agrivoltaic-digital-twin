import type {
  ScenarioAgriculturalConfig,
  ScenarioEconomicConfig,
  ScenarioMetadata,
  ScenarioPolicyConfig,
  ScenarioTechnicalConfig,
  ScenarioWeatherConfig,
} from "./types";

export interface ScenarioConfigurationSnapshot {
  schemaVersion: 1;

  technical: ScenarioTechnicalConfig;

  agricultural: ScenarioAgriculturalConfig;

  weather: ScenarioWeatherConfig;

  policy: ScenarioPolicyConfig;

  economic: ScenarioEconomicConfig;

  metadata: ScenarioMetadata;
}

interface BuildScenarioConfigurationInput {
  technicalConfig?: ScenarioTechnicalConfig;
  agriculturalConfig?: ScenarioAgriculturalConfig;
  weatherConfig?: ScenarioWeatherConfig;
  policyConfig?: ScenarioPolicyConfig;
  economicConfig?: ScenarioEconomicConfig;
  metadata?: ScenarioMetadata;
}

export function createScenarioConfigurationSnapshot(
  input: BuildScenarioConfigurationInput,
): ScenarioConfigurationSnapshot {
  return {
    schemaVersion: 1,

    technical: input.technicalConfig ?? {},

    agricultural:
      input.agriculturalConfig ?? {},

    weather: input.weatherConfig ?? {},

    policy: input.policyConfig ?? {},

    economic: input.economicConfig ?? {},

    metadata: input.metadata ?? {},
  };
}
