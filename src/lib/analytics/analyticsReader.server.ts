import "server-only";

import {
  createSupabaseServerClient,
} from "@/lib/database/server";

import {
  loadSimulationRun,
} from "@/lib/execution/runReader.server";

import {
  createComparableRunRecord,
} from "./comparisonRecord";

import type {
  ComparableRunRecord,
} from "./types";

export interface AnalyticsRunListEntry {
  runId:
    string;

  scenarioId:
    string | null;

  scenarioName:
    string;

  scenarioType:
    string;

  isBaseline:
    boolean;

  projectId:
    string;

  siteId:
    string;

  siteName:
    string;

  siteType:
    string;

  engineKind:
    string;

  simulationDate:
    string;

  engineVersion:
    string;

  environmentFingerprint:
    string | null;

  createdAt:
    string;

  status:
    string;
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

  return supabase;
}

export async function listAnalyticsRuns(
  limit = 100,
): Promise<
  AnalyticsRunListEntry[]
> {
  const supabase =
    await authenticatedClient();

  const safeLimit =
    Math.min(
      Math.max(
        Math.floor(
          limit,
        ),
        1,
      ),
      250,
    );

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "simulation_runs",
      )
      .select(
        "id,scenario_id,status,simulation_date,engine_version,input_snapshot,created_at",
      )
      .eq(
        "status",
        "completed",
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
      `Unable to load analytics runs: ${error.message}`,
    );
  }

  return (
    data ??
    []
  ).map(
    (
      row,
    ) => {
      const input =
        row.input_snapshot as unknown as {
          scenario?: {
            scenarioName?:
              string;

            scenarioType?:
              string;

            isBaseline?:
              boolean;
          };

          site?: {
            projectId?:
              string;

            siteId?:
              string;

            siteName?:
              string;

            siteType?:
              string;
          };

          engine?: {
            engineKind?:
              string;
          };

          environment?: {
            datasetFingerprint?:
              string | null;
          };
        };

      return {
        runId:
          row.id,

        scenarioId:
          row.scenario_id,

        scenarioName:
          input.scenario
            ?.scenarioName ??
          "Unnamed scenario",

        scenarioType:
          input.scenario
            ?.scenarioType ??
          "unknown",

        isBaseline:
          input.scenario
            ?.isBaseline ??
          false,

        projectId:
          input.site
            ?.projectId ??
          "unknown",

        siteId:
          input.site
            ?.siteId ??
          "unknown",

        siteName:
          input.site
            ?.siteName ??
          "Unknown site",

        siteType:
          input.site
            ?.siteType ??
          "unknown",

        engineKind:
          input.engine
            ?.engineKind ??
          "unknown",

        simulationDate:
          row.simulation_date,

        engineVersion:
          row.engine_version,

        environmentFingerprint:
          input.environment
            ?.datasetFingerprint ??
          null,

        createdAt:
          row.created_at,

        status:
          row.status,
      };
    },
  );
}

export async function loadComparableRun(
  runId:
    string,
): Promise<
  ComparableRunRecord
> {
  const loaded =
    await loadSimulationRun(
      runId,
    );

  return createComparableRunRecord(
    loaded.run,
    loaded.reproducibility,
  );
}
