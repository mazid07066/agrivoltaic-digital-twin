import {
  createElectricalSimulationResult,
} from "@/lib/electrical/adapters/executionElectricalAdapter";

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

  let scientificResult:
    SimulationExecutionResult;

  switch (
    engineKind
  ) {
    case "land":
      scientificResult =
        executeLandSimulation(
          input,
        );
      break;

    case "rooftop":
      scientificResult =
        executeRooftopSimulation(
          input,
        );
      break;

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

  /*
   * Phase 9E electrical processing is deliberately
   * downstream of the verified scientific PV engines.
   *
   * Neither the Phase 7B land engine nor the Phase 8C
   * rooftop engine is modified by the electrical model.
   */
  return {
    ...scientificResult,

    electrical:
      createElectricalSimulationResult(
        scientificResult,
      ),
  };
}
