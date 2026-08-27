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

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function physicsPersistenceSummary(
  result: SimulationExecutionResult,
  resolved: Awaited<ReturnType<typeof resolveSimulationExecutionInput>>,
) {
  const physicsPoints = result.hourly
    .map((point) => point.additionalValues.physics)
    .filter(isRecord);
  const modelMode =
    resolved.inputSnapshot.siteConfiguration.pvConfiguration
      .physicsConfiguration?.mode ?? "legacy_parity";
  const lossEnergyKwh: Record<string, number> = {};
  let maximumAbsoluteResidualW = 0;
  let balancePassed = true;
  for (const physics of physicsPoints) {
    const losses = Array.isArray(physics.losses) ? physics.losses : [];
    for (const candidate of losses) {
      if (!isRecord(candidate) || typeof candidate.id !== "string") continue;
      const powerW =
        typeof candidate.lossPowerW === "number" ? candidate.lossPowerW : 0;
      lossEnergyKwh[candidate.id] =
        (lossEnergyKwh[candidate.id] ?? 0) + powerW / 1000;
    }
    const balance = isRecord(physics.energyBalance) ? physics.energyBalance : null;
    const residual =
      balance && typeof balance.balanceResidualW === "number"
        ? Math.abs(balance.balanceResidualW)
        : 0;
    maximumAbsoluteResidualW = Math.max(maximumAbsoluteResidualW, residual);
    if (balance?.withinTolerance === false) balancePassed = false;
  }

  const physicsConfiguration =
    resolved.inputSnapshot.siteConfiguration.pvConfiguration.physicsConfiguration;
  return {
    modelMode,
    physicsModelVersion:
      modelMode === "legacy_parity" ? null : "agritwin-phase9h-9l-physics-v1",
    explicitLossSummary:
      physicsPoints.length > 0
        ? {
            schema: "agritwin-explicit-loss-summary-v1",
            timestepHours: 1,
            lossEnergyKwh,
          }
        : null,
    energyBalanceSummary:
      physicsPoints.length > 0
        ? {
            schema: "agritwin-energy-balance-summary-v1",
            passed: balancePassed,
            maximumAbsoluteResidualW,
          }
        : null,
    parameterSourceManifest:
      physicsConfiguration
        ? {
            schema: "agritwin-parameter-source-manifest-v1",
            losses: physicsConfiguration.losses,
            inverterCurve: {
              sourceCategory: "calibrated",
              sourceReference: "SMA STP 50-40 manufacturer efficiency data",
            },
            moduleDatasheet: {
              sourceCategory: "manufacturer",
              profileId:
                resolved.inputSnapshot.siteConfiguration.pvConfiguration
                  .moduleProfileId,
            },
          }
        : null,
  };
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

    const physicsSummary =
      physicsPersistenceSummary(
        result,
        resolved,
      );

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

          simulation_model_mode:
            physicsSummary.modelMode,

          physics_model_version:
            physicsSummary.physicsModelVersion,

          explicit_loss_summary:
            physicsSummary.explicitLossSummary
              ? physicsSummary.explicitLossSummary as unknown as Json
              : null,

          energy_balance_summary:
            physicsSummary.energyBalanceSummary
              ? physicsSummary.energyBalanceSummary as unknown as Json
              : null,

          parameter_source_manifest:
            physicsSummary.parameterSourceManifest
              ? physicsSummary.parameterSourceManifest as unknown as Json
              : null,

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
