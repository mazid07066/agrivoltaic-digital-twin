import type {
  CreateScenarioInput,
  Scenario,
  UpdateScenarioInput,
} from "@/lib/scenarios/types";

export interface ScenarioListOptions {
  projectId: string;
  siteId?: string | null;
  includeArchived?: boolean;
}

export interface ScenarioRepository {
  listScenarios(
    options: ScenarioListOptions,
  ): Promise<Scenario[]>;

  getScenario(
    scenarioId: string,
  ): Promise<Scenario | null>;

  createScenario(
    input: CreateScenarioInput,
  ): Promise<Scenario>;

  updateScenario(
    scenarioId: string,
    input: UpdateScenarioInput,
  ): Promise<Scenario>;

  duplicateScenario(
    scenarioId: string,
    name?: string,
  ): Promise<Scenario>;

  archiveScenario(
    scenarioId: string,
  ): Promise<Scenario>;
}
