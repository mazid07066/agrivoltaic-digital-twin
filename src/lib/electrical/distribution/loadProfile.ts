import type {
  ElectricalFeederDefinition,
  ElectricalLoadPoint,
} from "./types";

function validateLoadPoint(
  point: ElectricalLoadPoint,
): void {
  if (
    !Number.isFinite(
      point.activePowerKw,
    ) ||
    point.activePowerKw < 0
  ) {
    throw new Error(
      "Load active power must be a non-negative finite number.",
    );
  }

  if (
    !Number.isFinite(
      point.powerFactor,
    ) ||
    point.powerFactor <= 0 ||
    point.powerFactor > 1
  ) {
    throw new Error(
      "Load power factor must be greater than 0 and no greater than 1.",
    );
  }
}

export function resolveLoadPoint(
  feeder:
    ElectricalFeederDefinition,

  timestamp:
    string,
): ElectricalLoadPoint | null {
  if (
    !feeder.enabled
  ) {
    return null;
  }

  const point =
    feeder.loadProfile.find(
      (candidate) =>
        candidate.timestamp ===
        timestamp,
    ) ??
    null;

  if (
    point
  ) {
    validateLoadPoint(
      point,
    );
  }

  return point;
}

export function resolveFeederDemandKw(
  feeder:
    ElectricalFeederDefinition,

  timestamp:
    string,
): number {
  const point =
    resolveLoadPoint(
      feeder,
      timestamp,
    );

  return point
    ?.activePowerKw ??
    0;
}
