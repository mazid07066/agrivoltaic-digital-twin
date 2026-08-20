import {
  NextResponse,
} from "next/server";

import {
  createScenarioRepository,
} from "@/lib/repositories/index.server";

import type {
  CreateScenarioInput,
  UpdateScenarioInput,
} from "@/lib/scenarios/types";

export const runtime = "nodejs";

export const dynamic =
  "force-dynamic";

type ScenarioAction =
  | "create"
  | "update"
  | "duplicate"
  | "archive";

interface ScenarioRequest {
  action?: ScenarioAction;

  scenarioId?: string;

  name?: string;

  input?:
    | CreateScenarioInput
    | UpdateScenarioInput;
}

function errorResponse(
  error: unknown,
) {
  return NextResponse.json(
    {
      ok: false,

      error:
        error instanceof Error
          ? error.message
          : "Unknown scenario error.",
    },
    {
      status: 400,
    },
  );
}

export async function GET(
  request: Request,
) {
  try {
    const url =
      new URL(request.url);

    const scenarioId =
      url.searchParams.get(
        "scenarioId",
      );

    const repository =
      createScenarioRepository();

    if (scenarioId) {
      const scenario =
        await repository.getScenario(
          scenarioId,
        );

      if (!scenario) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Scenario was not found.",
          },
          {
            status: 404,
          },
        );
      }

      return NextResponse.json({
        ok: true,
        scenario,
      });
    }

    const projectId =
      url.searchParams.get(
        "projectId",
      );

    if (!projectId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "projectId is required.",
        },
        {
          status: 400,
        },
      );
    }

    const siteId =
      url.searchParams.get(
        "siteId",
      );

    const includeArchived =
      url.searchParams.get(
        "includeArchived",
      ) === "true";

    const scenarios =
      await repository.listScenarios({
        projectId,
        siteId,
        includeArchived,
      });

    return NextResponse.json({
      ok: true,
      scenarios,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: Request,
) {
  try {
    const body =
      (await request.json()) as
        ScenarioRequest;

    const repository =
      createScenarioRepository();

    switch (body.action) {
      case "create": {
        if (!body.input) {
          throw new Error(
            "Scenario input is required.",
          );
        }

        const scenario =
          await repository.createScenario(
            body.input as CreateScenarioInput,
          );

        return NextResponse.json({
          ok: true,
          scenario,
        });
      }

      case "update": {
        if (!body.scenarioId) {
          throw new Error(
            "Scenario ID is required.",
          );
        }

        if (!body.input) {
          throw new Error(
            "Scenario update input is required.",
          );
        }

        const scenario =
          await repository.updateScenario(
            body.scenarioId,
            body.input as UpdateScenarioInput,
          );

        return NextResponse.json({
          ok: true,
          scenario,
        });
      }

      case "duplicate": {
        if (!body.scenarioId) {
          throw new Error(
            "Scenario ID is required.",
          );
        }

        const scenario =
          await repository.duplicateScenario(
            body.scenarioId,
            body.name,
          );

        return NextResponse.json({
          ok: true,
          scenario,
        });
      }

      case "archive": {
        if (!body.scenarioId) {
          throw new Error(
            "Scenario ID is required.",
          );
        }

        const scenario =
          await repository.archiveScenario(
            body.scenarioId,
          );

        return NextResponse.json({
          ok: true,
          scenario,
        });
      }

      default:
        return NextResponse.json(
          {
            ok: false,
            error:
              "Unsupported scenario action.",
          },
          {
            status: 400,
          },
        );
    }
  } catch (error) {
    return errorResponse(error);
  }
}
