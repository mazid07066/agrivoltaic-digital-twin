import type {
  Scenario,
  ScenarioAgriculturalConfig,
  ScenarioEconomicConfig,
  ScenarioMetadata,
  ScenarioPolicyConfig,
  ScenarioTechnicalConfig,
  ScenarioWeatherConfig,
} from "./types";

export interface ScenarioDatabaseRow {
  id: string;

  project_id: string;
  site_id: string;

  name: string;
  description: string | null;

  configuration: Record<string, unknown> | null;

  status: string;

  scenario_type: string;

  is_baseline: boolean;

  parent_scenario_id: string | null;

  scenario_version: number;

  technical_config: ScenarioTechnicalConfig | null;

  agricultural_config: ScenarioAgriculturalConfig | null;

  weather_config: ScenarioWeatherConfig | null;

  policy_config: ScenarioPolicyConfig | null;

  economic_config: ScenarioEconomicConfig | null;

  metadata: ScenarioMetadata | null;

  created_by: string | null;

  created_at: string;
  updated_at: string;

  archived_at: string | null;
}

function asObject<T extends object>(
  value: T | null | undefined,
): T {
  return (value ?? {}) as T;
}

export function mapScenarioRow(
  row: ScenarioDatabaseRow,
): Scenario {
  return {
    id: row.id,

    projectId: row.project_id,
    siteId: row.site_id,

    name: row.name,
    description: row.description,

    scenarioType: row.scenario_type,

    status: row.status as Scenario["status"],

    isBaseline: row.is_baseline,

    parentScenarioId: row.parent_scenario_id,

    scenarioVersion: row.scenario_version,

    configuration: asObject(row.configuration),

    technicalConfig: asObject(row.technical_config),

    agriculturalConfig: asObject(
      row.agricultural_config,
    ),

    weatherConfig: asObject(row.weather_config),

    policyConfig: asObject(row.policy_config),

    economicConfig: asObject(row.economic_config),

    metadata: asObject(row.metadata),

    createdBy: row.created_by,

    createdAt: row.created_at,
    updatedAt: row.updated_at,

    archivedAt: row.archived_at,
  };
}
