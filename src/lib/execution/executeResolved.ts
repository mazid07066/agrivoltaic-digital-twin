import {
  executeLandSimulation,
} from "./landAdapter";

import {
  executeRooftopSimulation,
} from "./rooftopAdapter";

import type {
  ResolvedSimulationExecutionInput,
  SimulationExecutionResult,
} from "./types";

export function executeResolvedSimulation(
  input:
    ResolvedSimulationExecutionInput,
): SimulationExecutionResult {
  const engineKind =
    input.inputSnapshot
      .engine
      .engineKind;

  switch (
    engineKind
  ) {
    case "land":
      return executeLandSimulation(
        input,
      );

    case "rooftop":
      return executeRooftopSimulation(
        input,
      );

    default: {
      const exhaustiveCheck:
        never =
        engineKind;

      throw new Error(
        `Unsupported simulation engine: ${String(
          exhaustiveCheck,
        )}`,
      );
    }
  }
}
