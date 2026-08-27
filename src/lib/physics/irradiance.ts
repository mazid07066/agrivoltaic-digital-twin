import { clamp, toDegrees, toRadians } from "./math";
import type {
  IrradianceResult,
  IrradianceTranspositionModel,
  SolarPositionResult,
} from "./types";

const PEREZ_COEFFICIENTS = [
  [-0.008, 0.588, -0.062, -0.060, 0.072, -0.022],
  [0.130, 0.683, -0.151, -0.019, 0.066, -0.029],
  [0.330, 0.487, -0.221, 0.055, -0.064, -0.026],
  [0.568, 0.187, -0.295, 0.109, -0.152, -0.014],
  [0.873, -0.392, -0.362, 0.226, -0.462, 0.001],
  [1.132, -1.237, -0.412, 0.288, -0.823, 0.056],
  [1.060, -1.600, -0.359, 0.264, -1.127, 0.131],
  [0.678, -0.327, -0.250, 0.156, -1.377, 0.251],
] as const;

const EPSILON_BOUNDS = [1.065, 1.23, 1.5, 1.95, 2.8, 4.5, 6.2];

export interface IrradianceInput {
  model: IrradianceTranspositionModel;
  solar: SolarPositionResult;
  surfaceTiltDeg: number;
  surfaceAzimuthDeg: number;
  ghiWm2: number;
  dniWm2: number;
  dhiWm2: number;
  groundAlbedo: number;
  dayOfYear?: number;
  elevationM?: number;
}

export function angleOfIncidenceDeg(
  solar: SolarPositionResult,
  surfaceTiltDeg: number,
  surfaceAzimuthDeg: number,
): number {
  const zenith = toRadians(solar.apparentZenithDeg);
  const tilt = toRadians(surfaceTiltDeg);
  const difference = toRadians(solar.azimuthDeg - surfaceAzimuthDeg);
  const cosine = clamp(
    Math.cos(zenith) * Math.cos(tilt) +
      Math.sin(zenith) * Math.sin(tilt) * Math.cos(difference),
    -1,
    1,
  );
  return toDegrees(Math.acos(cosine));
}

function relativeAirMass(zenithDeg: number): number {
  if (zenithDeg >= 90) return 0;
  return 1 /
    (Math.cos(toRadians(zenithDeg)) +
      0.50572 * (96.07995 - zenithDeg) ** -1.6364);
}

function extraterrestrialIrradiance(dayOfYear: number): number {
  return 1367 * (1 + 0.033 * Math.cos((2 * Math.PI * dayOfYear) / 365));
}

function perezSkyDiffuse(input: IrradianceInput, aoiDeg: number): number {
  const dhi = Math.max(0, input.dhiWm2);
  if (dhi <= 0 || !input.solar.isAboveHorizon) return 0;

  const zenithRad = toRadians(clamp(input.solar.apparentZenithDeg, 0, 90));
  const airMass = relativeAirMass(input.solar.apparentZenithDeg);
  const delta =
    (dhi * airMass) /
    extraterrestrialIrradiance(input.dayOfYear ?? 180);
  const kappa = 1.041;
  const epsilon =
    ((dhi + Math.max(0, input.dniWm2)) / dhi +
      kappa * zenithRad ** 3) /
    (1 + kappa * zenithRad ** 3);
  const bin = EPSILON_BOUNDS.findIndex((bound) => epsilon < bound);
  const coefficients = PEREZ_COEFFICIENTS[bin < 0 ? 7 : bin];
  const f1 = Math.max(
    0,
    coefficients[0] + coefficients[1] * delta + coefficients[2] * zenithRad,
  );
  const f2 =
    coefficients[3] + coefficients[4] * delta + coefficients[5] * zenithRad;
  const tilt = toRadians(input.surfaceTiltDeg);
  const a = Math.max(0, Math.cos(toRadians(aoiDeg)));
  const b = Math.max(Math.cos(toRadians(85)), Math.cos(zenithRad));

  return Math.max(
    0,
    dhi *
      ((1 - f1) * (1 + Math.cos(tilt)) / 2 +
        f1 * (a / b) +
        f2 * Math.sin(tilt)),
  );
}

export function calculatePlaneOfArrayIrradiance(
  input: IrradianceInput,
): IrradianceResult {
  const aoi = angleOfIncidenceDeg(
    input.solar,
    input.surfaceTiltDeg,
    input.surfaceAzimuthDeg,
  );
  const tilt = toRadians(input.surfaceTiltDeg);
  const poaDirect = input.solar.isAboveHorizon
    ? Math.max(0, input.dniWm2) * Math.max(0, Math.cos(toRadians(aoi)))
    : 0;
  const poaSky =
    input.model === "perez"
      ? perezSkyDiffuse(input, aoi)
      : Math.max(0, input.dhiWm2) * (1 + Math.cos(tilt)) / 2;
  const poaGround =
    Math.max(0, input.ghiWm2) *
    clamp(input.groundAlbedo, 0, 1) *
    (1 - Math.cos(tilt)) /
    2;

  return {
    model: input.model,
    angleOfIncidenceDeg: aoi,
    poaDirectWm2: poaDirect,
    poaSkyDiffuseWm2: poaSky,
    poaGroundDiffuseWm2: poaGround,
    poaGlobalWm2: poaDirect + poaSky + poaGround,
  };
}
