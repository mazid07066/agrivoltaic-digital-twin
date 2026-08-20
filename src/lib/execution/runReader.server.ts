import "server-only";

import {
  createSupabaseServerClient,
} from "@/lib/database/server";

import {
  mapPersistedSimulationRun,
} from "./persistedRunMapper";

import {
  verifyPersistedSimulationRun,
} from "./reproducibility";

import type {
  PersistedSimulationRun,
  SimulationRunReproducibilityReport,
} from "./persistedRunTypes";

function requiredId(
  value:
    string,

  label:
    string,
): string {
  const id =
    value.trim();

  if (!id) {
    throw new Error(
      `${label} is required.`,
    );
  }

  return id;
}

async function authenticatedClient() {
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

  return {
    supabase,
    user,
  };
}

export interface LoadedSimulationRun {
  run:
    PersistedSimulationRun;

  reproducibility:
    SimulationRunReproducibilityReport;
}

export interface SimulationRunHistoryEntry {
  id:
    string;

  projectId:
    string;

  siteId:
    string;

  siteVersionId:
    string;

  scenarioId:
    string | null;

  status:
    | "queued"
    | "running"
    | "completed"
    | "failed"
    | "cancelled";

  simulationDate:
    string;

  engineVersion:
    string;

  controllerVersion:
    string | null;

  weatherAdapterVersion:
    string | null;

  startedAt:
    string | null;

  completedAt:
    string | null;

  createdAt:
    string;

  errorMessage:
    string | null;
}

export async function listScenarioSimulationRuns(
  scenarioId:
    string,

  limit = 20,
): Promise<
  SimulationRunHistoryEntry[]
> {
  const id =
    requiredId(
      scenarioId,
      "Scenario ID",
    );

  const {
    supabase,
  } =
    await authenticatedClient();

  const safeLimit =
    Math.min(
      Math.max(
        Math.floor(
          limit,
        ),
        1,
      ),
      100,
    );

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "simulation_runs",
      )
      .select("*")
      .eq(
        "scenario_id",
        id,
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        },
      )
      .limit(
        safeLimit,
      );

  if (error) {
    throw new Error(
      `Unable to load scenario simulation history: ${error.message}`,
    );
  }

  return (
    data ??
    []
  ).map(
    (
      row,
    ): SimulationRunHistoryEntry => ({
      id:
        row.id,

      projectId:
        row.project_id,

      siteId:
        row.site_id,

      siteVersionId:
        row.site_version_id,

      scenarioId:
        row.scenario_id,

      status:
        row.status as
          SimulationRunHistoryEntry["status"],

      simulationDate:
        row.simulation_date,

      engineVersion:
        row.engine_version,

      controllerVersion:
        row.controller_version,

      weatherAdapterVersion:
        row.weather_adapter_version,

      startedAt:
        row.started_at,

      completedAt:
        row.completed_at,

      createdAt:
        row.created_at,

      errorMessage:
        row.error_message,
    }),
  );
}

export async function loadSimulationRun(
  simulationRunId:
    string,
): Promise<
  LoadedSimulationRun
> {
  const id =
    requiredId(
      simulationRunId,
      "Simulation run ID",
    );

  const {
    supabase,
  } =
    await authenticatedClient();

  const {
    data:
      run,

    error:
      runError,
  } =
    await supabase
      .from(
        "simulation_runs",
      )
      .select("*")
      .eq(
        "id",
        id,
      )
      .maybeSingle();

  if (
    runError
  ) {
    throw new Error(
      `Unable to load simulation run: ${runError.message}`,
    );
  }

  if (!run) {
    throw new Error(
      "Simulation run was not found.",
    );
  }

  const [
    hourlyResponse,
    spatialResponse,
  ] =
    await Promise.all([
      supabase
        .from(
          "simulation_hourly_results",
        )
        .select("*")
        .eq(
          "simulation_run_id",
          id,
        )
        .order(
          "hour_index",
          {
            ascending:
              true,
          },
        ),

      supabase
        .from(
          "simulation_spatial_results",
        )
        .select("*")
        .eq(
          "simulation_run_id",
          id,
        )
        .order(
          "created_at",
          {
            ascending:
              true,
          },
        ),
    ]);

  if (
    hourlyResponse.error
  ) {
    throw new Error(
      `Unable to load hourly simulation results: ${hourlyResponse.error.message}`,
    );
  }

  if (
    spatialResponse.error
  ) {
    throw new Error(
      `Unable to load spatial simulation results: ${spatialResponse.error.message}`,
    );
  }

  const persistedRun =
    mapPersistedSimulationRun(
      run,

      hourlyResponse.data ??
        [],

      spatialResponse.data ??
        [],
    );

  return {
    run:
      persistedRun,

    reproducibility:
      verifyPersistedSimulationRun(
        persistedRun,
      ),
  };
}
