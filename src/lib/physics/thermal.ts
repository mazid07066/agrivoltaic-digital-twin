import type { ThermalModel, ThermalResult } from "./types";

export interface ThermalInput {
  model: ThermalModel;
  irradianceWm2: number;
  ambientTemperatureC: number;
  windSpeedMs: number;
  noctC: number;
  moduleEfficiency: number;
  moduleAbsorption: number;
  faimanU0: number;
  faimanU1: number;
  pvsystUc: number;
  pvsystUv: number;
}

export function calculateCellTemperature(input: ThermalInput): ThermalResult {
  const irradiance = Math.max(0, input.irradianceWm2);
  const wind = Math.max(0, input.windSpeedMs);
  let cellTemperatureC = input.ambientTemperatureC;

  if (input.model === "simple_noct") {
    cellTemperatureC += ((input.noctC - 20) / 800) * irradiance;
  } else if (input.model === "faiman") {
    const denominator = Math.max(0.001, input.faimanU0 + input.faimanU1 * wind);
    cellTemperatureC += irradiance / denominator;
  } else {
    const denominator = Math.max(0.001, input.pvsystUc + input.pvsystUv * wind);
    cellTemperatureC +=
      irradiance *
      Math.max(0, input.moduleAbsorption - input.moduleEfficiency) /
      denominator;
  }

  return {
    model: input.model,
    cellTemperatureC,
  };
}
