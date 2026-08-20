import type {
  EnvironmentalDataset,
} from "@/lib/environment/types";

import type {
  ProjectRepository,
} from "@/lib/repositories/ProjectRepository";

import type {
  ScenarioRepository,
} from "@/lib/repositories/ScenarioRepository";

import type {
  Scenario,
} from "@/lib/scenarios/types";

import type {
  SiteVersionSnapshot,
} from "@/lib/projects/types";

import {
  createSimulationExecutionInputSnapshot,
} from "./inputSnapshot";

import type {
  ResolvedSimulationExecutionInput,
} from "./types";

export interface ExecutionEnvironmentContext {
  siteCoordinate: {
    latitude: number;
    longitude: number;
  };

  siteTimezone:
    string | null;
}

export type ExecutionEnvironmentLoader = (
  scenario: Scenario,
  context: ExecutionEnvironmentContext,
) => Promise<EnvironmentalDataset>;

export interface ResolveExecutionInputDependencies {
  scenarioRepository:
    Pick<
      ScenarioRepository,
      "getScenario"
    >;

  projectRepository:
    Pick<
      ProjectRepository,
      | "listProjects"
      | "getSiteVersion"
    >;

  environmentLoader:
    ExecutionEnvironmentLoader;
}

function ensureScenarioId(
  scenarioId: string,
): string {
  const value =
    scenarioId.trim();

  if (!value) {
    throw new Error(
      "Scenario ID is required for execution.",
    );
  }

  return value;
}

function createEnvironmentContext(
  siteVersion:
    SiteVersionSnapshot,
): ExecutionEnvironmentContext {
  const location =
    siteVersion
      .configuration
      .location;

  const latitude =
    location.latitude;

  const longitude =
    location.longitude;

  if (
    !Number.isFinite(
      latitude,
    ) ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new Error(
      "The execution site does not contain a valid latitude.",
    );
  }

  if (
    !Number.isFinite(
      longitude,
    ) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error(
      "The execution site does not contain a valid longitude.",
    );
  }

  return {
    siteCoordinate: {
      latitude,
      longitude,
    },

    siteTimezone:
      location.timezone ||
      null,
  };
}

export async function resolveSimulationExecutionInputWithDependencies(
  scenarioId: string,
  dependencies:
    ResolveExecutionInputDependencies,
): Promise<ResolvedSimulationExecutionInput> {
  const id =
    ensureScenarioId(
      scenarioId,
    );

  const scenario =
    await dependencies
      .scenarioRepository
      .getScenario(
        id,
      );

  if (!scenario) {
    throw new Error(
      "Scenario was not found.",
    );
  }

  if (
    scenario.status ===
    "archived"
  ) {
    throw new Error(
      "Archived scenarios cannot be executed.",
    );
  }

  const projects =
    await dependencies
      .projectRepository
      .listProjects();

  const project =
    projects.find(
      (candidate) =>
        candidate.id ===
        scenario.projectId,
    );

  if (!project) {
    throw new Error(
      "Scenario project was not found.",
    );
  }

  const site =
    project.sites.find(
      (candidate) =>
        candidate.id ===
        scenario.siteId,
    );

  if (!site) {
    throw new Error(
      "Scenario site was not found in its project.",
    );
  }

  if (
    site.projectId !==
    scenario.projectId
  ) {
    throw new Error(
      "Scenario site does not belong to the scenario project.",
    );
  }

  if (
    site.status ===
    "archived"
  ) {
    throw new Error(
      "Archived sites cannot be used for new simulation runs.",
    );
  }

  if (
    !site.activeVersionId
  ) {
    throw new Error(
      "Scenario site does not have an active immutable site version.",
    );
  }

  const siteVersion =
    await dependencies
      .projectRepository
      .getSiteVersion(
        site.activeVersionId,
      );

  if (!siteVersion) {
    throw new Error(
      "The active site version could not be loaded.",
    );
  }

  if (
    siteVersion.siteId !==
    scenario.siteId
  ) {
    throw new Error(
      "Loaded site version does not belong to the scenario site.",
    );
  }

  if (
    siteVersion.id !==
    site.activeVersionId
  ) {
    throw new Error(
      "Loaded site version does not match the active site version.",
    );
  }

  const environmentContext =
    createEnvironmentContext(
      siteVersion,
    );

  const environment =
    await dependencies
      .environmentLoader(
        scenario,
        environmentContext,
      );

  if (
    environment.hourly.length ===
    0
  ) {
    throw new Error(
      "Environmental dataset contains no hourly records.",
    );
  }

  if (
    environment.quality
      .recordCount !==
    environment.hourly.length
  ) {
    throw new Error(
      "Environmental record count does not match the normalized hourly dataset.",
    );
  }

  const inputSnapshot =
    createSimulationExecutionInputSnapshot(
      scenario,
      siteVersion,
      environment,
    );

  return {
    scenario,
    siteVersion,
    environment,
    inputSnapshot,
  };
}
