import {
  NextResponse,
} from "next/server";

import {
  createProjectRepository,
  createScenarioRepository,
} from "@/lib/repositories/index.server";

import {
  loadScenarioEnvironment,
} from "@/lib/environment/service.server";

import {
  summarizeEnvironmentalDataset,
} from "@/lib/environment/summary";

import type {
  SiteProfile,
} from "@/lib/sites/schema";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

function getSiteEnvironmentContext(
  siteProfile: SiteProfile,
) {
  const {
    latitude,
    longitude,
    timezone,
  } = siteProfile.location;

  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new Error(
      "The selected site does not contain a valid latitude.",
    );
  }

  if (
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error(
      "The selected site does not contain a valid longitude.",
    );
  }

  return {
    siteCoordinate: {
      latitude,
      longitude,
    },

    siteTimezone:
      timezone || null,
  };
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

    const scenarioRepository =
      createScenarioRepository();

    const projectRepository =
      createProjectRepository();

    // --------------------------------------------------------
    // 1. Load scenario
    // --------------------------------------------------------

    const scenario =
      await scenarioRepository
        .getScenario(
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

    // --------------------------------------------------------
    // 2. Find scenario project
    // --------------------------------------------------------

    const projects =
      await projectRepository
        .listProjects();

    const project =
      projects.find(
        (item) =>
          item.id ===
          scenario.projectId,
      );

    if (!project) {
      return NextResponse.json(
        {
          ok: false,

          error:
            "Scenario project was not found.",
        },
        {
          status: 404,
        },
      );
    }

    // --------------------------------------------------------
    // 3. Find scenario site summary
    // --------------------------------------------------------

    const site =
      project.sites.find(
        (item) =>
          item.id ===
          scenario.siteId,
      );

    if (!site) {
      return NextResponse.json(
        {
          ok: false,

          error:
            "Scenario site was not found.",
        },
        {
          status: 404,
        },
      );
    }

    // --------------------------------------------------------
    // 4. Resolve immutable active site version
    //
    // ProjectSiteSummary intentionally does not contain the
    // full SiteProfile. The active version is the authoritative
    // configuration snapshot for environmental resolution.
    // --------------------------------------------------------

    if (!site.activeVersionId) {
      return NextResponse.json(
        {
          ok: false,

          error:
            "The scenario site does not have an active site version.",
        },
        {
          status: 409,
        },
      );
    }

    const siteVersion =
      await projectRepository
        .getSiteVersion(
          site.activeVersionId,
        );

    if (!siteVersion) {
      return NextResponse.json(
        {
          ok: false,

          error:
            "The active site version could not be loaded.",
        },
        {
          status: 404,
        },
      );
    }

    // --------------------------------------------------------
    // 5. Build environmental context from SiteProfile.location
    // --------------------------------------------------------

    const context =
      getSiteEnvironmentContext(
        siteVersion.configuration,
      );

    // --------------------------------------------------------
    // 6. Resolve scenario weather settings and load dataset
    // --------------------------------------------------------

    const dataset =
      await loadScenarioEnvironment(
        scenario,
        context,
      );

    // --------------------------------------------------------
    // 7. Produce compact preview metrics
    // --------------------------------------------------------

    const summary =
      summarizeEnvironmentalDataset(
        dataset,
      );

    return NextResponse.json({
      ok: true,

      scenario: {
        id:
          scenario.id,

        name:
          scenario.name,

        projectId:
          scenario.projectId,

        siteId:
          scenario.siteId,

        siteVersionId:
          siteVersion.id,

        siteVersionNumber:
          siteVersion.versionNumber,

        weatherConfig:
          scenario.weatherConfig,
      },

      site: {
        id:
          site.id,

        name:
          site.name,

        siteType:
          site.siteType,

        activeVersionId:
          site.activeVersionId,

        location:
          siteVersion
            .configuration
            .location,
      },

      summary,

      dataset,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "Scenario environmental preview failed.",
      },
      {
        status: 400,
      },
    );
  }
}
