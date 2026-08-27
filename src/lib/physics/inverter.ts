import type { InverterConversionResult } from "./types";

export interface FittedInverterInput {
  dcInputPowerW: number;
  ratedAcPowerW: number;
  available?: boolean;
  gridAvailable?: boolean;
  nightSelfConsumptionW?: number;
  constantLossW?: number;
  linearLossCoefficient?: number;
  quadraticLossCoefficient?: number;
}

export function calculateFittedInverterConversion(
  input: FittedInverterInput,
): InverterConversionResult {
  const dcInputPowerW = Math.max(0, input.dcInputPowerW);
  const operational = (input.available ?? true) && (input.gridAvailable ?? true);
  const standbyConsumptionW =
    dcInputPowerW <= 0 && operational
      ? Math.max(0, input.nightSelfConsumptionW ?? 4.8)
      : 0;
  if (!operational || dcInputPowerW <= 0) {
    return {
      dcInputPowerW,
      acUnclippedPowerW: 0,
      acOutputPowerW: 0,
      conversionLossW: 0,
      clippingLossW: 0,
      standbyConsumptionW,
      efficiency: 0,
    };
  }

  const conversionLossW = Math.min(
    dcInputPowerW,
    Math.max(
      0,
      (input.constantLossW ?? 75) +
        (input.linearLossCoefficient ?? 0.016711) * dcInputPowerW +
        (input.quadraticLossCoefficient ?? 1.6038e-8) * dcInputPowerW ** 2,
    ),
  );
  const acUnclippedPowerW = Math.max(0, dcInputPowerW - conversionLossW);
  const acOutputPowerW = Math.min(
    acUnclippedPowerW,
    Math.max(0, input.ratedAcPowerW),
  );
  const clippingLossW = Math.max(0, acUnclippedPowerW - acOutputPowerW);

  return {
    dcInputPowerW,
    acUnclippedPowerW,
    acOutputPowerW,
    conversionLossW,
    clippingLossW,
    standbyConsumptionW,
    efficiency: dcInputPowerW > 0 ? acUnclippedPowerW / dcInputPowerW : 0,
  };
}

export function solveFittedPdcoW(
  ratedAcPowerW = 50_000,
  constantLossW = 75,
  linearLossCoefficient = 0.016711,
  quadraticLossCoefficient = 1.6038e-8,
): number {
  const a = quadraticLossCoefficient;
  const b = -(1 - linearLossCoefficient);
  const c = constantLossW + ratedAcPowerW;
  const discriminant = b ** 2 - 4 * a * c;
  if (a <= 0 || discriminant < 0) {
    throw new Error("Fitted inverter curve has no physical Pdco solution.");
  }
  return (-b - Math.sqrt(discriminant)) / (2 * a);
}

export function calculateEuropeanEfficiency(
  pdcoW = solveFittedPdcoW(),
): number {
  const weights = [
    [0.05, 0.03],
    [0.1, 0.06],
    [0.2, 0.13],
    [0.3, 0.1],
    [0.5, 0.48],
    [1, 0.2],
  ] as const;
  return weights.reduce((weighted, [fraction, weight]) => {
    const result = calculateFittedInverterConversion({
      dcInputPowerW: pdcoW * fraction,
      ratedAcPowerW: Number.POSITIVE_INFINITY,
    });
    return weighted + result.efficiency * weight;
  }, 0);
}
