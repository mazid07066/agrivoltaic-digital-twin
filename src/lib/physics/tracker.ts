import { clamp, normalizeDegrees, toDegrees, toRadians } from "./math";
import type {
  ResearchTrackingMode,
  SolarPositionResult,
  TrackerResult,
} from "./types";

export interface TrackerInput {
  solar: SolarPositionResult;
  mode: ResearchTrackingMode;
  fixedTiltDeg: number;
  fixedAzimuthDeg: number;
  axisTiltDeg: number;
  axisAzimuthDeg: number;
  maximumRotationDeg: number;
  groundCoverageRatio: number;
  backtrackingEnabled: boolean;
  crossAxisSlopeDeg: number;
  stowAngleDeg: number;
  measuredAngleDeg?: number | null;
  operational?: boolean;
}

function surfaceFromRotation(
  angleDeg: number,
  axisAzimuthDeg: number,
): { tiltDeg: number; azimuthDeg: number } {
  return {
    tiltDeg: Math.abs(angleDeg),
    azimuthDeg: normalizeDegrees(
      axisAzimuthDeg + (angleDeg >= 0 ? 90 : -90),
    ),
  };
}

export function calculateSingleAxisTracker(input: TrackerInput): TrackerResult {
  if (!input.solar.isAboveHorizon) {
    const surface = surfaceFromRotation(
      input.stowAngleDeg,
      input.axisAzimuthDeg,
    );
    return {
      idealAngleDeg: 0,
      backtrackedAngleDeg: input.stowAngleDeg,
      finalAngleDeg: input.stowAngleDeg,
      measuredAngleDeg: input.measuredAngleDeg ?? null,
      surfaceTiltDeg: surface.tiltDeg,
      surfaceAzimuthDeg: surface.azimuthDeg,
      operationalState: "night",
    };
  }

  if (input.mode === "fixed_tilt") {
    return {
      idealAngleDeg: 0,
      backtrackedAngleDeg: 0,
      finalAngleDeg: 0,
      measuredAngleDeg: input.measuredAngleDeg ?? null,
      surfaceTiltDeg: input.fixedTiltDeg,
      surfaceAzimuthDeg: normalizeDegrees(input.fixedAzimuthDeg),
      operationalState: "fixed",
    };
  }

  if (input.operational === false) {
    const surface = surfaceFromRotation(
      input.stowAngleDeg,
      input.axisAzimuthDeg,
    );
    return {
      idealAngleDeg: 0,
      backtrackedAngleDeg: input.stowAngleDeg,
      finalAngleDeg: input.stowAngleDeg,
      measuredAngleDeg: input.measuredAngleDeg ?? null,
      surfaceTiltDeg: surface.tiltDeg,
      surfaceAzimuthDeg: surface.azimuthDeg,
      operationalState: "stowed",
    };
  }

  const elevation = toRadians(input.solar.apparentElevationDeg);
  const relativeAzimuth = toRadians(
    input.solar.azimuthDeg - input.axisAzimuthDeg,
  );
  const idealUnbounded = toDegrees(
    Math.atan2(
      Math.cos(elevation) * Math.sin(relativeAzimuth),
      Math.sin(elevation) * Math.cos(toRadians(input.axisTiltDeg)) +
        Math.cos(elevation) *
          Math.cos(relativeAzimuth) *
          Math.sin(toRadians(input.axisTiltDeg)),
    ),
  );
  const idealAngleDeg = clamp(
    idealUnbounded,
    -input.maximumRotationDeg,
    input.maximumRotationDeg,
  );

  let backtrackedAngleDeg = idealAngleDeg;
  const gcr = clamp(input.groundCoverageRatio, 0.01, 1);
  if (input.backtrackingEnabled && gcr > 0) {
    const crossAxisSlope = toRadians(input.crossAxisSlopeDeg);
    const axesDistance = 1 / (gcr * Math.cos(crossAxisSlope));
    const temp = Math.abs(
      axesDistance *
        Math.cos(toRadians(idealAngleDeg - input.crossAxisSlopeDeg)),
    );
    if (temp < 1) {
      const correction =
        -Math.sign(idealAngleDeg || 1) * toDegrees(Math.acos(temp));
      backtrackedAngleDeg = idealAngleDeg + correction;
    }
  }

  const measured = input.measuredAngleDeg ?? null;
  const usesMeasured = input.mode === "measured_scada" && measured !== null;
  const finalAngleDeg = clamp(
    usesMeasured
      ? measured
      : input.mode === "adaptive_custom"
        ? -idealAngleDeg
      : input.mode === "standard_backtracking"
        ? backtrackedAngleDeg
        : idealAngleDeg,
    -input.maximumRotationDeg,
    input.maximumRotationDeg,
  );
  const surface = surfaceFromRotation(finalAngleDeg, input.axisAzimuthDeg);

  return {
    idealAngleDeg,
    backtrackedAngleDeg,
    finalAngleDeg,
    measuredAngleDeg: measured,
    surfaceTiltDeg: surface.tiltDeg,
    surfaceAzimuthDeg: surface.azimuthDeg,
    operationalState: usesMeasured
      ? "measured"
      : input.mode === "standard_backtracking"
        ? "backtracking"
        : "tracking",
  };
}
