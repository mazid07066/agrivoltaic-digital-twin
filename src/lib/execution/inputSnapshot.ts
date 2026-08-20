import {
  createSiteProfileSnapshot,
} from "@/lib/projects/siteSnapshot";

import type {
  EnvironmentalDataset,
} from "@/lib/environment/types";

import type {
  SiteVersionSnapshot,
} from "@/lib/projects/types";

import type {
  Scenario,
} from "@/lib/scenarios/types";

import {
  createEnvironmentalExecutionIdentity,
  createScenarioConfigurationSnapshot,
  createScenarioExecutionIdentity,
  createSimulationEngineIdentity,
  createSiteExecutionIdentity,
} from "./identity";

import {
  createExecutionFingerprint,
} from "./fingerprint";

import type {
  SimulationExecutionInputSnapshot,
} from "./types";

function resolveSimulationDate(
  scenario:
    Scenario,

  siteVersion:
    SiteVersionSnapshot,

  environment:
    EnvironmentalDataset,
): string {
  const site =
    siteVersion.configuration;

  const environmentalDate =
    environment.startTime
      .slice(
        0,
        10,
      );

  /*
   * A Scenario may intentionally use a weather period
   * that differs from the site's saved UI simulationDate.
   *
   * Phase 9C execution therefore uses the environmental
   * dataset's first date as the authoritative run date.
   */
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      environmentalDate,
    )
  ) {
    return environmentalDate;
  }

  return site.simulationDate;
}

export function createSimulationExecutionInputSnapshot(
  scenario:
    Scenario,

  siteVersion:
    SiteVersionSnapshot,

  environment:
    EnvironmentalDataset,
): SimulationExecutionInputSnapshot {
  if (
    siteVersion.siteId !==
    scenario.siteId
  ) {
    throw new Error(
      "Scenario site and site-version snapshot do not match.",
    );
  }

  const simulationDate =
    resolveSimulationDate(
      scenario,
      siteVersion,
      environment,
    );

  const snapshotWithoutFingerprint =
    {
      schema:
        "agritwin-execution-input-v1" as const,

      inputFingerprint:
        null,

      simulationDate,

      engine:
        createSimulationEngineIdentity(
          siteVersion.configuration,
        ),

      scenario:
        createScenarioExecutionIdentity(
          scenario,
        ),

      site:
        createSiteExecutionIdentity(
          scenario,
          siteVersion,
        ),

      scenarioConfiguration:
        createScenarioConfigurationSnapshot(
          scenario,
        ),

      siteConfiguration:
        createSiteProfileSnapshot(
          siteVersion.configuration,
        ),

      environment:
        createEnvironmentalExecutionIdentity(
          environment,
        ),
    };

  const inputFingerprint =
    createExecutionFingerprint({
      ...snapshotWithoutFingerprint,

      inputFingerprint:
        undefined,
    });

  return {
    ...snapshotWithoutFingerprint,

    inputFingerprint,
  };
}
