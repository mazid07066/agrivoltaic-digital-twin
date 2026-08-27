import { clamp, toRadians } from "./math";
import type { IamModel, IamResult, IrradianceResult } from "./types";

export function martinRuizIam(angleDeg: number, ar = 0.16): number {
  if (angleDeg < 0 || angleDeg >= 90) return 0;
  if (ar <= 0) return 1;
  const cosine = Math.max(0, Math.cos(toRadians(angleDeg)));
  const denominator = 1 - Math.exp(-1 / ar);
  return clamp((1 - Math.exp(-cosine / ar)) / denominator, 0, 1);
}

export function calculateIam(
  model: IamModel,
  irradiance: IrradianceResult,
  ar = 0.16,
): IamResult {
  if (model === "none") {
    return {
      direct: 1,
      skyDiffuse: 1,
      groundDiffuse: 1,
      effectiveIrradianceWm2: irradiance.poaGlobalWm2,
    };
  }

  const direct = martinRuizIam(irradiance.angleOfIncidenceDeg, ar);
  const skyDiffuse = martinRuizIam(59, ar);
  const groundDiffuse = martinRuizIam(90 - 0.001, ar);
  return {
    direct,
    skyDiffuse,
    groundDiffuse,
    effectiveIrradianceWm2:
      irradiance.poaDirectWm2 * direct +
      irradiance.poaSkyDiffuseWm2 * skyDiffuse +
      irradiance.poaGroundDiffuseWm2 * groundDiffuse,
  };
}
