import { clamp, toRadians } from "./math";

export interface RowShadingInput {
  rowCount: number;
  rowPitchM: number;
  collectorWidthM: number;
  clearanceM: number;
  surfaceTiltDeg: number;
  surfaceAzimuthDeg: number;
  solarElevationDeg: number;
  solarAzimuthDeg: number;
  directWm2: number;
  diffuseWm2: number;
  groundReflectedWm2: number;
}

export interface RowShadingResult {
  rowFactors: number[];
  meanPvFactor: number;
  cropGroundIrradianceWm2: number;
  geometricShadeFraction: number;
}

export function calculateGeometricRowShading(
  input: RowShadingInput,
): RowShadingResult {
  const rowCount = Math.max(1, Math.round(input.rowCount));
  if (input.solarElevationDeg <= 0) {
    return {
      rowFactors: Array.from({ length: rowCount }, () => 1),
      meanPvFactor: 1,
      cropGroundIrradianceWm2: 0,
      geometricShadeFraction: 0,
    };
  }

  const elevation = toRadians(input.solarElevationDeg);
  const azimuthDifference = toRadians(
    input.solarAzimuthDeg - input.surfaceAzimuthDeg,
  );
  const profileElevation = Math.atan2(
    Math.tan(elevation),
    Math.max(0.05, Math.abs(Math.cos(azimuthDifference))),
  );
  const tilt = toRadians(input.surfaceTiltDeg);
  const collectorHeight = input.collectorWidthM * Math.sin(tilt);
  const collectorHorizontal = input.collectorWidthM * Math.cos(tilt);
  const shadowReach =
    collectorHorizontal +
    Math.max(0, collectorHeight + input.clearanceM) /
      Math.max(Math.tan(profileElevation), 0.001);
  const overlapM = Math.max(0, shadowReach - input.rowPitchM);
  const geometricShadeFraction = clamp(
    overlapM / Math.max(input.collectorWidthM, 0.001),
    0,
    1,
  );

  const beamFactor = 1 - geometricShadeFraction;
  const diffuseFactor = 1 - 0.25 * geometricShadeFraction;
  const groundFactor = 1 - 0.6 * geometricShadeFraction;
  const unshadedTotal =
    input.directWm2 + input.diffuseWm2 + input.groundReflectedWm2;
  const shadedTotal =
    input.directWm2 * beamFactor +
    input.diffuseWm2 * diffuseFactor +
    input.groundReflectedWm2 * groundFactor;
  const shadedFactor =
    unshadedTotal > 0 ? clamp(shadedTotal / unshadedTotal, 0, 1) : 1;
  const rowFactors = [
    1,
    ...Array.from({ length: rowCount - 1 }, () => shadedFactor),
  ];
  const meanPvFactor =
    rowFactors.reduce((sum, value) => sum + value, 0) / rowFactors.length;
  const cropGroundIrradianceWm2 = Math.max(
    0,
    input.directWm2 * (1 - geometricShadeFraction) + input.diffuseWm2,
  );

  return {
    rowFactors,
    meanPvFactor,
    cropGroundIrradianceWm2,
    geometricShadeFraction,
  };
}
