import "server-only";

import type {
  Json,
} from "@/lib/database/database.types";

import {
  createSupabaseServerClient,
} from "@/lib/database/server";

import {
  executeResolvedSimulation,
} from "./executeResolved";

import {
  createHourlyResultInserts,
  createSimulationRunInsert,
  createSpatialResultInserts,
} from "./persistenceMapping";

import {
  resolveSimulationExecutionInput,
} from "./resolver.server";

import type {
  SimulationExecutionResult,
} from "./types";

export interface PersistedExecutionResult {
  simulationRunId:
    string;

  result:
    SimulationExecutionResult;
}

export async function executeAndPersistScenarioSimulation(
  scenarioId:
    string,
): Promise<PersistedExecutionResult> {
  const supabase =
    await createSupabaseServerClient();

  const {
    data: {
      user,
    },
  } =
    await supabase.auth
      .getUser();

  if (!user) {
    throw new Error(
      "Authentication is required.",
    );
  }

  /*
   * Resolve all immutable scientific inputs before
   * creating the simulation-run record.
   */
  const resolved =
    await resolveSimulationExecutionInput(
      scenarioId,
    );

  const runInsert =
    createSimulationRunInsert(
      resolved,
      user.id,
    );

  const {
    data: run,
    error: runError,
  } =
    await supabase
      .from(
        "simulation_runs",
      )
      .insert(
        runInsert,
      )
      .select(
        "id",
      )
      .single();

  if (runError) {
    throw new Error(
      `Unable to create simulation run: ${runError.message}`,
    );
  }

  const simulationRunId =
    run.id;

  try {
    const result =
      executeResolvedSimulation(
        resolved,
      );

    const hourlyRows =
      createHourlyResultInserts(
        simulationRunId,
        result,
        resolved.environment
          .provenance
          .timezone,
      );

    if (
      hourlyRows.length >
      0
    ) {
      const {
        error:
          hourlyError,
      } =
        await supabase
          .from(
            "simulation_hourly_results",
          )
          .insert(
            hourlyRows,
          );

      if (hourlyError) {
        throw new Error(
          `Unable to persist hourly simulation results: ${hourlyError.message}`,
        );
      }
    }

    const spatialRows =
      createSpatialResultInserts(
        simulationRunId,
        result,
      );

    if (
      spatialRows.length >
      0
    ) {
      const {
        error:
          spatialError,
      } =
        await supabase
          .from(
            "simulation_spatial_results",
          )
          .insert(
            spatialRows,
          );

      if (spatialError) {
        throw new Error(
          `Unable to persist spatial simulation results: ${spatialError.message}`,
        );
      }
    }

    const {
      error:
        completionError,
    } =
      await supabase
        .from(
          "simulation_runs",
        )
        .update({
          status:
            "completed",

          result_summary:
            result.summary as unknown as Json,

          electrical_summary:
            result.electrical
              ? result.electrical
                  .summary as unknown as Json
              : null,

          electrical_provenance:
            result.electrical
              ? result.electrical
                  .provenance as unknown as Json
              : null,

          electrical_operating_mode:
            result.electrical
              ?.operatingMode ??
            null,

          warnings:
            result.warnings as unknown as Json,

          completed_at:
            new Date()
              .toISOString(),

          error_message:
            null,
        })
        .eq(
          "id",
          simulationRunId,
        );

    if (completionError) {
      throw new Error(
        `Unable to complete simulation run: ${completionError.message}`,
      );
    }

    return {
      simulationRunId,
      result,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown simulation execution error.";

    /*
     * Preserve the run record and failure provenance
     * instead of deleting evidence of an attempted run.
     */
    await supabase
      .from(
        "simulation_runs",
      )
      .update({
        status:
          "failed",

        error_message:
          message,

        completed_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        simulationRunId,
      );

    throw error;
  }
}
