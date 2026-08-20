import type {
  EnvironmentalDataset,
} from "@/lib/environment/types";

import type {
  SiteVersionSnapshot,
} from "@/lib/projects/types";

import type {
  Scenario,
} from "@/lib/scenarios/types";

import type {
  SiteProfile,
} from "@/lib/sites/schema";

import type {
  EnvironmentalExecutionIdentity,
  ScenarioConfigurationSnapshot,
  ScenarioExecutionIdentity,
  SimulationEngineIdentity,
  SimulationEngineKind,
  SiteExecutionIdentity,
} from "./types";

import {
  CONTROLLER_VERSION,
  EXECUTION_CONTRACT_VERSION,
  LAND_ENGINE_VERSION,
  ROOFTOP_ENGINE_VERSION,
  WEATHER_ADAPTER_VERSION,
} from "./versions";

export function resolveSimulationEngineKind(
  site:
    SiteProfile,
): SimulationEngineKind {
  const siteType =
    site.siteType;

  switch (
    siteType
  ) {
    case "land_agrivoltaic":
      return "land";

    case "flat_roof":
      return "rooftop";

    default:
      throw new Error(
        `Unsupported execution site type: ${String(
          siteType,
        )}`,
      );
  }
}

export function createSimulationEngineIdentity(
  site:
    SiteProfile,
): SimulationEngineIdentity {
  const engineKind =
    resolveSimulationEngineKind(
      site,
    );

  if (
    engineKind ===
    "land"
  ) {
    return {
      executionContractVersion:
        EXECUTION_CONTRACT_VERSION,

      engineKind,

      engineVersion:
        LAND_ENGINE_VERSION,

      controllerVersion:
        CONTROLLER_VERSION,

      weatherAdapterVersion:
        WEATHER_ADAPTER_VERSION,

      moduleCatalogueVersion:
        null,
    };
  }

  return {
    executionContractVersion:
      EXECUTION_CONTRACT_VERSION,

    engineKind,

    engineVersion:
      ROOFTOP_ENGINE_VERSION,

    controllerVersion:
      null,

    weatherAdapterVersion:
      WEATHER_ADAPTER_VERSION,

    moduleCatalogueVersion:
      null,
  };
}

export function createScenarioExecutionIdentity(
  scenario:
    Scenario,
): ScenarioExecutionIdentity {
  return {
    scenarioId:
      scenario.id,

    scenarioVersion:
      scenario.scenarioVersion,

    scenarioName:
      scenario.name,

    scenarioType:
      scenario.scenarioType,

    isBaseline:
      scenario.isBaseline,
  };
}

export function createSiteExecutionIdentity(
  scenario:
    Scenario,

  siteVersion:
    SiteVersionSnapshot,
): SiteExecutionIdentity {
  const site =
    siteVersion.configuration;

  return {
    projectId:
      scenario.projectId,

    siteId:
      siteVersion.siteId,

    siteVersionId:
      siteVersion.id,

    siteVersionNumber:
      siteVersion.versionNumber,

    siteSchemaVersion:
      siteVersion.schemaVersion,

    siteType:
      site.siteType,

    siteName:
      site.name,
  };
}

export function createScenarioConfigurationSnapshot(
  scenario:
    Scenario,
): ScenarioConfigurationSnapshot {
  return {
    technicalConfig:
      structuredClone(
        scenario.technicalConfig,
      ),

    agriculturalConfig:
      structuredClone(
        scenario.agriculturalConfig,
      ),

    weatherConfig:
      structuredClone(
        scenario.weatherConfig,
      ),

    policyConfig:
      structuredClone(
        scenario.policyConfig,
      ),

    economicConfig:
      structuredClone(
        scenario.economicConfig,
      ),

    metadata:
      structuredClone(
        scenario.metadata,
      ),
  };
}

export function createEnvironmentalExecutionIdentity(
  environment:
    EnvironmentalDataset,
): EnvironmentalExecutionIdentity {
  const provenance =
    environment.provenance;

  return {
    source:
      provenance.source,

    mode:
      provenance.mode,

    datasetId:
      provenance.datasetId ??
      null,

    requestFingerprint:
      provenance.requestFingerprint ??
      null,

    datasetFingerprint:
      provenance.datasetFingerprint ??
      null,

    requestedCoordinate:
      structuredClone(
        provenance
          .requestedCoordinate,
      ),

    resolvedCoordinate:
      provenance
        .resolvedCoordinate
        ? structuredClone(
            provenance
              .resolvedCoordinate,
          )
        : null,

    timezone:
      provenance.timezone,

    startTime:
      environment.startTime,

    endTime:
      environment.endTime,

    recordCount:
      environment.quality
        .recordCount,

    expectedRecordCount:
      environment.quality
        .expectedHourlyRecordCount ??
      null,

    coveragePercent:
      environment.quality
        .coveragePercent ??
      null,

    missingRequiredValueCount:
      environment.quality
        .missingValueCount,

    warnings: [
      ...environment
        .quality
        .warnings,
    ],
  };
}
