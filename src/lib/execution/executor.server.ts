import "server-only";

import {
  resolveSimulationExecutionInput,
} from "./resolver.server";

import {
  executeResolvedSimulation,
} from "./executeResolved";

import type {
  ResolvedSimulationExecutionInput,
  SimulationExecutionResult,
} from "./types";

export interface ExecutedScenarioSimulation {
  resolvedInput:
    ResolvedSimulationExecutionInput;

  result:
    SimulationExecutionResult;
}

export async function executeScenarioSimulation(
  scenarioId:
    string,
): Promise<ExecutedScenarioSimulation> {
  const resolvedInput =
    await resolveSimulationExecutionInput(
      scenarioId,
    );

  const result =
    executeResolvedSimulation(
      resolvedInput,
    );

  return {
    resolvedInput,
    result,
  };
}
