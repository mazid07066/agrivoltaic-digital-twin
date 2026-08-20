import "server-only";

import {
  loadScenarioEnvironment,
} from "@/lib/environment/service.server";

import {
  createProjectRepository,
  createScenarioRepository,
} from "@/lib/repositories/index.server";

import {
  resolveSimulationExecutionInputWithDependencies,
} from "./resolveInput";

import type {
  ResolvedSimulationExecutionInput,
} from "./types";

export async function resolveSimulationExecutionInput(
  scenarioId: string,
): Promise<ResolvedSimulationExecutionInput> {
  const scenarioRepository =
    createScenarioRepository();

  const projectRepository =
    createProjectRepository();

  return resolveSimulationExecutionInputWithDependencies(
    scenarioId,
    {
      scenarioRepository,

      projectRepository,

      environmentLoader:
        loadScenarioEnvironment,
    },
  );
}
