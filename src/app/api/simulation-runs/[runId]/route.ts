import {
  NextResponse,
} from "next/server";

import {
  loadSimulationRun,
} from "@/lib/execution/runReader.server";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

interface RouteContext {
  params:
    Promise<{
      runId:
        string;
    }>;
}

export async function GET(
  _request:
    Request,

  context:
    RouteContext,
) {
  try {
    const {
      runId,
    } =
      await context.params;

    const result =
      await loadSimulationRun(
        runId,
      );

    return NextResponse.json({
      ok:
        true,

      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok:
          false,

        error:
          error instanceof Error
            ? error.message
            : "Simulation run could not be loaded.",
      },
      {
        status:
          400,
      },
    );
  }
}
