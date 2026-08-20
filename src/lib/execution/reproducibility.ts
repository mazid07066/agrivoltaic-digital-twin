import {
  createExecutionFingerprint,
} from "./fingerprint";

import type {
  PersistedSimulationRun,
  ReproducibilityCheck,
  SimulationRunReproducibilityReport,
} from "./persistedRunTypes";

function check(
  key: string,
  label: string,
  expected:
    string | number | null,
  actual:
    string | number | null,
): ReproducibilityCheck {
  return {
    key,
    label,
    expected,
    actual,
    passed:
      expected === actual,
  };
}

export function verifyPersistedSimulationRun(
  run:
    PersistedSimulationRun,
): SimulationRunReproducibilityReport {
  const snapshot =
    run.inputSnapshot;

  const storedFingerprint =
    snapshot.inputFingerprint ??
    null;

  const recomputedFingerprint =
    createExecutionFingerprint({
      ...snapshot,

      inputFingerprint:
        undefined,
    });

  const checks:
    ReproducibilityCheck[] = [
    check(
      "inputFingerprint",
      "Execution input fingerprint",
      storedFingerprint,
      recomputedFingerprint,
    ),

    check(
      "scenarioId",
      "Scenario identity",
      run.scenarioId,
      snapshot.scenario
        .scenarioId,
    ),

    check(
      "siteId",
      "Site identity",
      run.siteId,
      snapshot.site
        .siteId,
    ),

    check(
      "siteVersionId",
      "Immutable site version",
      run.siteVersionId,
      snapshot.site
        .siteVersionId,
    ),

    check(
      "siteSchemaVersion",
      "Site schema version",
      run.siteSchemaVersion,
      snapshot.site
        .siteSchemaVersion,
    ),

    check(
      "simulationDate",
      "Simulation date",
      run.simulationDate,
      snapshot.simulationDate,
    ),

    check(
      "engineVersion",
      "Simulation engine version",
      run.engineVersion,
      snapshot.engine
        .engineVersion,
    ),

    check(
      "controllerVersion",
      "Controller version",
      run.controllerVersion,
      snapshot.engine
        .controllerVersion,
    ),

    check(
      "weatherAdapterVersion",
      "Environmental adapter version",
      run.weatherAdapterVersion,
      snapshot.engine
        .weatherAdapterVersion,
    ),
  ];

  const warnings: string[] = [];

  if (
    run.status ===
      "completed" &&
    run.hourly.length !==
      24
  ) {
    warnings.push(
      `Completed single-day run contains ${run.hourly.length} hourly records instead of 24.`,
    );
  }

  if (
    !snapshot.environment
      .datasetFingerprint
  ) {
    warnings.push(
      "Environmental dataset fingerprint is unavailable.",
    );
  }

  if (
    !snapshot.environment
      .requestFingerprint
  ) {
    warnings.push(
      "Environmental request fingerprint is unavailable.",
    );
  }

  if (
    snapshot.environment
      .missingRequiredValueCount >
    0
  ) {
    warnings.push(
      `Execution environment reported ${snapshot.environment.missingRequiredValueCount} missing required values.`,
    );
  }

  return {
    runId:
      run.id,

    verified:
      checks.every(
        (item) =>
          item.passed,
      ),

    inputFingerprint:
      storedFingerprint,

    recomputedInputFingerprint:
      recomputedFingerprint,

    checks,

    warnings,
  };
}
