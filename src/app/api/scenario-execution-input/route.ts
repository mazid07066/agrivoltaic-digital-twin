import {
  NextResponse,
} from "next/server";

import {
  createExecutionInputPreview,
} from "@/lib/execution/preview";

import {
  resolveSimulationExecutionInput,
} from "@/lib/execution/resolver.server";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export async function GET(
  request: Request,
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
          ok: false,

          error:
            "scenarioId is required.",
        },
        {
          status: 400,
        },
      );
    }

    const resolved =
      await resolveSimulationExecutionInput(
        scenarioId,
      );

    const preview =
      createExecutionInputPreview(
        resolved,
      );

    return NextResponse.json({
      ok: true,

      preview,

      inputSnapshot:
        resolved.inputSnapshot,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "Scenario execution input could not be resolved.",
      },
      {
        status: 400,
      },
    );
  }
}
