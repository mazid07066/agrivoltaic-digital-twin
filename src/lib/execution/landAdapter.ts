import {
  environmentalDatasetToWeatherResponse,
} from "./environmentWeatherBridge";

import {
  applyLandScenarioOverrides,
} from "./scenarioOverrides";

import type {
  CanonicalHourlySimulationPoint,
  CanonicalSimulationSummary,
  CanonicalSpatialSimulationResult,
  ResolvedSimulationExecutionInput,
  SimulationExecutionResult,
} from "./types";

import {
  runLandAgrivoltaicSimulation,
} from "@/lib/sites/adapters/landAgrivoltaic";

import {
  isLandAgrivoltaicSiteProfile,
} from "@/lib/sites/migrations";

import type {
  LandAgrivoltaicSiteProfile,
} from "@/lib/sites/schema";

const PAR_TO_PPFD_FACTOR =
  4.57;

const SOLAR_TO_PAR_FACTOR =
  0.45;

const SECONDS_PER_HOUR =
  3600;

const MICROMOLES_PER_MOLE =
  1_000_000;

function dliIncrement(
  irradianceWm2:
    number,
): number {
  return (
    irradianceWm2 *
    SOLAR_TO_PAR_FACTOR *
    PAR_TO_PPFD_FACTOR *
    SECONDS_PER_HOUR /
    MICROMOLES_PER_MOLE
  );
}

function runtimeSite(
  input:
    ResolvedSimulationExecutionInput,
): LandAgrivoltaicSiteProfile {
  const stored =
    input.siteVersion
      .configuration;

  if (
    !isLandAgrivoltaicSiteProfile(
      stored,
    )
  ) {
    throw new Error(
      "The resolved execution site is not a land agrivoltaic SiteProfile.",
    );
  }

  /*
   * The persisted site version remains immutable.
   *
   * Scenario-level technical and agricultural
   * settings are applied only to this detached
   * execution-time profile.
   */
  const runtime =
    applyLandScenarioOverrides(
      structuredClone(
        stored,
      ),
      input.scenario,
    );

  /*
   * Environmental resolution determines the
   * actual simulation date.
   */
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
      typeof runLandAgrivoltaicSimulation
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
          point.solarAltitude,

        solarAzimuthDeg:
          point.solarAzimuth,

        ghiWm2:
          point.irradiance,

        poaWm2:
          point.poaIrradiance,

        moduleTemperatureC:
          point.moduleTemperature,

        pvPowerKw:
          point.pvPower,

        trackerAngleDeg:
          point.trackerAngle,

        trackingState:
          point.operatingMode,

        openFieldDliIncrementMolM2:
          dliIncrement(
            point.irradiance,
          ),

        cropDliIncrementMolM2:
          dliIncrement(
            point.cropIrradiance,
          ),

        additionalValues: {
          cropIrradianceWm2:
            point.cropIrradiance,

          shadePercentage:
            point.shadePercentage,

          solarZenithDeg:
            point.solarZenith,

          surfaceTiltDeg:
            point.surfaceTilt,

          surfaceAzimuthDeg:
            point.surfaceAzimuth,

          angleOfIncidenceDeg:
            point.angleOfIncidence,

          poaBeamWm2:
            point.poaBeam,

          poaSkyDiffuseWm2:
            point.poaSkyDiffuse,

          poaGroundReflectedWm2:
            point.poaGroundReflected,

          temperatureFactor:
            point.temperatureFactor,

          modelMode:
            point.physics?.modelMode ??
            "legacy_parity",

          deliveredAcPowerKw:
            point.deliveredAcPowerKw ??
            null,

          physics:
            point.physics
              ? structuredClone(
                  point.physics,
                )
              : null,
        },
      };
    },
  );
}

function createSummary(
  results:
    ReturnType<
      typeof runLandAgrivoltaicSimulation
    >,
): CanonicalSimulationSummary {
  const specificYield =
    results.installedCapacityKW >
    0
      ? (
          results.dailyEnergyKWh /
          results.installedCapacityKW
        )
      : 0;

  return {
    engineKind:
      "land",

    siteType:
      "land_agrivoltaic",

    installedCapacityKw:
      results.installedCapacityKW,

    dailyEnergyKwh:
      results.dailyEnergyKWh,

    specificYieldKwhPerKw:
      Number(
        specificYield.toFixed(
          4,
        ),
      ),

    openFieldDliMolM2:
      results.openFieldDLI,

    cropDliMolM2:
      results.cropDLI,

    estimatedCropYieldPercent:
      results.estimatedCropYield,

    landEquivalentRatio:
      results.landEquivalentRatio,

    groundCoverageRatioPercent:
      results.groundCoverageRatio,

    usableAreaPercent:
      null,

    moduleCount:
      null,

    additionalMetrics: {
      dliAchievementPercent:
        results.dliAchievement,

      cropLightReductionPercent:
        results.cropLightReduction,

      legacyEngineDataSource:
        results.dataSource,

      adaptiveControllerEnabled:
        results
          .adaptiveController
          .enabled,

      adaptiveTargetSatisfied:
        results
          .adaptiveController
          .targetSatisfied,

      protectedZoneDliMolM2:
        results
          .adaptiveController
          .protectedZoneDLI,

      wholeFieldDliMolM2:
        results
          .adaptiveController
          .wholeFieldDLI,
    },
  };
}

function createSpatialResults(
  results:
    ReturnType<
      typeof runLandAgrivoltaicSimulation
    >,
): CanonicalSpatialSimulationResult[] {
  /*
   * Preserve the complete verified Phase 7B
   * spatial-light output without changing its
   * scientific calculations.
   *
   * A finer database decomposition can be added
   * later while the native result remains fully
   * available in this canonical envelope.
   */
  return [
    {
      resultKind:
        "daily_dli_grid",

      hourIndex:
        null,

      gridDefinition: {
        source:
          "phase7b-spatial-light",

        representation:
          "native-engine-output",

        normalizationVersion:
          "9c-v1",
      },

      valuesData:
        structuredClone(
          results.spatialLight,
        ),

      statistics:
        null,
    },
  ];
}

function createWarnings(
  input:
    ResolvedSimulationExecutionInput,
  engineResults?:
    ReturnType<
      typeof runLandAgrivoltaicSimulation
    >,
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
      "The current Phase 7B land engine executes one simulation day at a time; only the first 24 hourly environmental records were used.",
    );
  }

  for (const warning of
    engineResults?.hourly.flatMap(
      (point) =>
        point.physics?.warnings ??
        [],
    ) ?? []) {
    warnings.push(
      warning,
    );
  }

  return Array.from(
    new Set(
      warnings,
    ),
  );
}

export function executeLandSimulation(
  input:
    ResolvedSimulationExecutionInput,
): SimulationExecutionResult {
  if (
    input.inputSnapshot
      .engine
      .engineKind !==
    "land"
  ) {
    throw new Error(
      "Land execution adapter received a non-land execution package.",
    );
  }

  if (
    input.environment
      .hourly
      .length <
    24
  ) {
    throw new Error(
      "Land execution requires at least 24 hourly environmental records.",
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
    runLandAgrivoltaicSimulation(
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
      `Land simulation engine returned ${hourly.length} hourly records instead of 24.`,
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

    spatial:
      createSpatialResults(
        engineResults,
      ),

    warnings:
      createWarnings(
        input,
        engineResults,
      ),
  };
}
