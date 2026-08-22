import {
  environmentalDatasetToWeatherResponse,
} from "./environmentWeatherBridge";

import {
  applyEquipmentScenarioOverrides,
} from "./scenarioOverrides";

import type {
  CanonicalHourlySimulationPoint,
  CanonicalSimulationSummary,
  ResolvedSimulationExecutionInput,
  SimulationExecutionResult,
} from "./types";

import {
  runFlatRoofSimulation,
} from "@/lib/rooftop/simulation";

import {
  isFlatRoofSiteProfile,
} from "@/lib/sites/migrations";

import type {
  FlatRoofSiteProfile,
} from "@/lib/sites/schema";

function runtimeSite(
  input:
    ResolvedSimulationExecutionInput,
): FlatRoofSiteProfile {
  const stored =
    input.siteVersion
      .configuration;

  if (
    !isFlatRoofSiteProfile(
      stored,
    )
  ) {
    throw new Error(
      "The resolved execution site is not a flat-roof SiteProfile.",
    );
  }

  /*
   * Never mutate the immutable database-backed
   * site-version snapshot.
   *
   * Phase 9C execution uses the environmental
   * dataset date as the runtime simulation date.
   */
  const runtime =
    applyEquipmentScenarioOverrides(
      stored,
      input.scenario,
    );

  return {
    ...runtime,

    simulationDate:
      input.inputSnapshot
        .simulationDate,
  };
}

function createHourlyResults(
  input:
    ResolvedSimulationExecutionInput,

  engineHourly:
    ReturnType<
      typeof runFlatRoofSimulation
    >["hourly"],
): CanonicalHourlySimulationPoint[] {
  return engineHourly.map(
    (
      point,
      hourIndex,
    ) => {
      const environmentalPoint =
        input.environment
          .hourly[
            hourIndex
          ];

      const timestamp =
        environmentalPoint
          ?.timestamp ??
        `${input.inputSnapshot.simulationDate}T${String(
          hourIndex,
        ).padStart(
          2,
          "0",
        )}:00`;

      return {
        hourIndex,

        timestamp,

        solarAltitudeDeg:
          point.solarAltitudeDeg,

        solarAzimuthDeg:
          point.solarAzimuthDeg,

        ghiWm2:
          point.ghi,

        poaWm2:
          point.poaIrradiance,

        moduleTemperatureC:
          point.moduleTemperatureC,

        pvPowerKw:
          point.dcPowerKW,

        trackerAngleDeg:
          null,

        trackingState:
          null,

        openFieldDliIncrementMolM2:
          null,

        cropDliIncrementMolM2:
          null,

        additionalValues: {
          ambientTemperatureC:
            point.ambientTemperatureC,

          angleOfIncidenceDeg:
            point.angleOfIncidenceDeg,
        },
      };
    },
  );
}

function createSummary(
  results:
    ReturnType<
      typeof runFlatRoofSimulation
    >,
): CanonicalSimulationSummary {
  return {
    engineKind:
      "rooftop",

    siteType:
      "flat_roof",

    installedCapacityKw:
      results.installedCapacityKW,

    dailyEnergyKwh:
      results.dailyEnergyKWh,

    specificYieldKwhPerKw:
      results.specificYieldKWhPerKW,

    openFieldDliMolM2:
      null,

    cropDliMolM2:
      null,

    estimatedCropYieldPercent:
      null,

    landEquivalentRatio:
      null,

    groundCoverageRatioPercent:
      null,

    usableAreaPercent:
      results.usableAreaPercent,

    moduleCount:
      results.moduleCount,

    additionalMetrics: {
      roofAreaM2:
        results.roofAreaM2,

      usableRoofAreaM2:
        results.usableRoofAreaM2,

      rows:
        results.rows,

      modulesPerRow:
        results.modulesPerRow,

      legacyEngineDataSource:
        results.dataSource,
    },
  };
}

function createWarnings(
  input:
    ResolvedSimulationExecutionInput,
): string[] {
  const warnings = [
    ...input.environment
      .quality
      .warnings,
  ];

  if (
    input.environment
      .hourly
      .length >
    24
  ) {
    warnings.push(
      "The current Phase 8C rooftop engine executes one simulation day at a time; only the first 24 hourly environmental records were used.",
    );
  }

  return Array.from(
    new Set(
      warnings,
    ),
  );
}

export function executeRooftopSimulation(
  input:
    ResolvedSimulationExecutionInput,
): SimulationExecutionResult {
  if (
    input.inputSnapshot
      .engine
      .engineKind !==
    "rooftop"
  ) {
    throw new Error(
      "Rooftop execution adapter received a non-rooftop execution package.",
    );
  }

  if (
    input.environment
      .hourly
      .length <
    24
  ) {
    throw new Error(
      "Rooftop execution requires at least 24 hourly environmental records.",
    );
  }

  const site =
    runtimeSite(
      input,
    );

  const weather =
    environmentalDatasetToWeatherResponse(
      input.environment,
    );

  const engineResults =
    runFlatRoofSimulation(
      site,
      weather,
    );

  const hourly =
    createHourlyResults(
      input,
      engineResults.hourly,
    );

  if (
    hourly.length !==
    24
  ) {
    throw new Error(
      `Rooftop simulation engine returned ${hourly.length} hourly records instead of 24.`,
    );
  }

  return {
    schema:
      "agritwin-execution-result-v1",

    status:
      "completed",

    engine:
      structuredClone(
        input.inputSnapshot
          .engine,
      ),

    simulationDate:
      input.inputSnapshot
        .simulationDate,

    summary:
      createSummary(
        engineResults,
      ),

    hourly,

    /*
     * Current Phase 8C rooftop engine does not
     * produce a spatial grid result.
     */
    spatial:
      [],

    warnings:
      createWarnings(
        input,
      ),
  };
}
