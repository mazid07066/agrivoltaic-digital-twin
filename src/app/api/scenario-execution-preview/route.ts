import {
  NextResponse,
} from "next/server";

import {
  executeScenarioSimulation,
} from "@/lib/execution/executor.server";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

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

    const {
      resolvedInput,
      result,
    } =
      await executeScenarioSimulation(
        scenarioId,
      );

    return NextResponse.json({
      ok:
        true,

      execution: {
        inputFingerprint:
          resolvedInput
            .inputSnapshot
            .inputFingerprint,

        scenarioId:
          resolvedInput
            .scenario
            .id,

        scenarioVersion:
          resolvedInput
            .scenario
            .scenarioVersion,

        projectId:
          resolvedInput
            .scenario
            .projectId,

        siteId:
          resolvedInput
            .siteVersion
            .siteId,

        siteVersionId:
          resolvedInput
            .siteVersion
            .id,

        siteVersionNumber:
          resolvedInput
            .siteVersion
            .versionNumber,

        engineKind:
          result
            .engine
            .engineKind,

        engineVersion:
          result
            .engine
            .engineVersion,

        environmentSource:
          resolvedInput
            .environment
            .provenance
            .source,

        environmentMode:
          resolvedInput
            .environment
            .provenance
            .mode,

        environmentFingerprint:
          resolvedInput
            .environment
            .provenance
            .datasetFingerprint ??
          null,

        simulationDate:
          result
            .simulationDate,
      },

      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok:
          false,

        error:
          error instanceof Error
            ? error.message
            : "Scenario execution preview failed.",
      },
      {
        status:
          400,
      },
    );
  }
}
