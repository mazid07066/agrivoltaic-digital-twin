import {
  NextResponse,
} from "next/server";

import {
  executeAndPersistScenarioSimulation,
} from "@/lib/execution/persistentExecutor.server";

import {
  listScenarioSimulationRuns,
} from "@/lib/execution/runReader.server";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

interface RequestBody {
  scenarioId?:
    unknown;
}

export async function GET(
  request:
    Request,
) {
  try {
    const url =
      new URL(
        request.url,
      );

    const scenarioId =
      url.searchParams.get(
        "scenarioId",
      );

    if (!scenarioId) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "scenarioId is required.",
        },
        {
          status:
            400,
        },
      );
    }

    const runs =
      await listScenarioSimulationRuns(
        scenarioId,
      );

    return NextResponse.json({
      ok:
        true,

      runs,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok:
          false,

        error:
          error instanceof Error
            ? error.message
            : "Simulation run history could not be loaded.",
      },
      {
        status:
          400,
      },
    );
  }
}

export async function POST(
  request:
    Request,
) {
  try {
    const body =
      (await request.json()) as
        RequestBody;

    if (
      typeof body.scenarioId !==
        "string" ||
      !body.scenarioId.trim()
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "scenarioId is required.",
        },
        {
          status:
            400,
        },
      );
    }

    const persisted =
      await executeAndPersistScenarioSimulation(
        body.scenarioId,
      );

    return NextResponse.json({
      ok:
        true,

      simulationRunId:
        persisted
          .simulationRunId,

      result:
        persisted.result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok:
          false,

        error:
          error instanceof Error
            ? error.message
            : "Scenario simulation could not be persisted.",
      },
      {
        status:
          400,
      },
    );
  }
}
