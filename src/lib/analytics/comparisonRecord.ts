import type {
  CanonicalSimulationSummary,
} from "@/lib/execution/types";

import type {
  PersistedSimulationRun,
  SimulationRunReproducibilityReport,
} from "@/lib/execution/persistedRunTypes";

import type {
  ComparableRunEconomic,
  ComparableRunPolicy,
  ComparableRunRecord,
} from "./types";

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function numberOrNull(
  value: unknown,
): number | null {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  )
    ? value
    : null;
}

function stringOrNull(
  value: unknown,
): string | null {
  return (
    typeof value === "string" &&
    value.trim()
  )
    ? value
    : null;
}

function summaryFromRun(
  run: PersistedSimulationRun,
): CanonicalSimulationSummary {
  if (
    !isRecord(run.resultSummary)
  ) {
    throw new Error(
      "Persisted simulation run does not contain a valid result summary.",
    );
  }

  const summary =
    run.resultSummary as unknown as
      CanonicalSimulationSummary;

  if (
    !summary.engineKind ||
    !summary.siteType
  ) {
    throw new Error(
      "Persisted simulation summary is incomplete.",
    );
  }

  return summary;
}

function policyFromRun(
  run: PersistedSimulationRun,
): ComparableRunPolicy {
  const policy =
    run.inputSnapshot
      .scenarioConfiguration
      .policyConfig;

  return {
    minimumCropRetention:
      numberOrNull(
        policy.minimumCropRetention,
      ),

    maximumGcr:
      numberOrNull(
        policy.maximumGcr,
      ),

    minimumLer:
      numberOrNull(
        policy.minimumLer,
      ),

    minimumPanelHeightM:
      numberOrNull(
        policy.minimumPanelHeightM,
      ),

    maximumDliReduction:
      numberOrNull(
        policy.maximumDliReduction,
      ),

    minimumRenewableEnergyKwh:
      numberOrNull(
        policy.minimumRenewableEnergyKwh,
      ),

    policyPreset:
      stringOrNull(
        policy.policyPreset,
      ),
  };
}

function economicFromRun(
  run: PersistedSimulationRun,
): ComparableRunEconomic {
  const economic =
    run.inputSnapshot
      .scenarioConfiguration
      .economicConfig;

  return {
    currency:
      stringOrNull(
        economic.currency,
      ),

    capex:
      numberOrNull(
        economic.capex,
      ),

    annualOpex:
      numberOrNull(
        economic.annualOpex,
      ),

    electricityTariffPerKwh:
      numberOrNull(
        economic.electricityTariffPerKwh,
      ),

    cropPrice:
      numberOrNull(
        economic.cropPrice,
      ),

    discountRate:
      numberOrNull(
        economic.discountRate,
      ),

    projectLifetimeYears:
      numberOrNull(
        economic.projectLifetimeYears,
      ),
  };
}

export function createComparableRunRecord(
  run: PersistedSimulationRun,

  reproducibility:
    SimulationRunReproducibilityReport,
): ComparableRunRecord {
  if (
    run.status !== "completed"
  ) {
    throw new Error(
      "Only completed persisted simulation runs can be compared.",
    );
  }

  const input =
    run.inputSnapshot;

  const scenario =
    input.scenario;

  const site =
    input.site;

  const engine =
    input.engine;

  return {
    schema:
      "agritwin-comparable-run-v1",

    identity: {
      runId:
        run.id,

      scenarioId:
        run.scenarioId,

      scenarioVersion:
        scenario.scenarioVersion,

      scenarioName:
        scenario.scenarioName,

      scenarioType:
        scenario.scenarioType,

      isBaseline:
        scenario.isBaseline,

      projectId:
        site.projectId,

      siteId:
        site.siteId,

      siteVersionId:
        site.siteVersionId,

      siteVersionNumber:
        site.siteVersionNumber,

      siteType:
        site.siteType,

      siteName:
        site.siteName,

      simulationDate:
        run.simulationDate,

      engineKind:
        engine.engineKind,

      engineVersion:
        engine.engineVersion,

      controllerVersion:
        engine.controllerVersion,

      weatherAdapterVersion:
        engine.weatherAdapterVersion,

      modelMode:
        input.siteConfiguration
          .pvConfiguration
          .physicsConfiguration
          ?.mode ??
        "legacy_parity",

      executionFingerprint:
        input.inputFingerprint,

      environmentFingerprint:
        input.environment
          .datasetFingerprint,

      reproducibilityVerified:
        reproducibility.verified,
    },

    summary:
      summaryFromRun(
        run,
      ),

    policy:
      policyFromRun(
        run,
      ),

    economic:
      economicFromRun(
        run,
      ),
  };
}
