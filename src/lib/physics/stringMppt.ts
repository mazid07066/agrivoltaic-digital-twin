import { clamp } from "./math";
import type {
  ModuleOperatingPoint,
  MpptOperatingPoint,
  StringOperatingPoint,
} from "./types";

export function createStringOperatingPoints(input: {
  module: ModuleOperatingPoint;
  stringCount: number;
  modulesPerString: number;
  irradianceFactors?: number[];
  temperatureOffsetsC?: number[];
}): StringOperatingPoint[] {
  const count = Math.max(0, Math.round(input.stringCount));
  return Array.from({ length: count }, (_, index) => {
    const irradianceFactor = clamp(input.irradianceFactors?.[index] ?? 1, 0, 1.5);
    const temperatureOffsetC = input.temperatureOffsetsC?.[index] ?? 0;
    const currentFactor = irradianceFactor;
    const voltageTemperatureFactor = Math.max(0, 1 - 0.0029 * temperatureOffsetC);
    return {
      stringIndex: index + 1,
      moduleCount: input.modulesPerString,
      irradianceFactor,
      temperatureOffsetC,
      iscA: input.module.iscA * currentFactor,
      vocV:
        input.module.vocV * input.modulesPerString * voltageTemperatureFactor,
      impA: input.module.impA * currentFactor,
      vmpV:
        input.module.vmpV * input.modulesPerString * voltageTemperatureFactor,
      pmpW:
        input.module.pmpW *
        input.modulesPerString *
        irradianceFactor *
        voltageTemperatureFactor,
    };
  });
}

export function allocateStringsToMppts(
  strings: StringOperatingPoint[],
  mpptCount: number,
): StringOperatingPoint[][] {
  const groups = Array.from(
    { length: Math.max(1, Math.round(mpptCount)) },
    () => [] as StringOperatingPoint[],
  );
  strings.forEach((string, index) => {
    if (index < groups.length) groups[index].push(string);
    else groups[index % groups.length].push(string);
  });
  return groups;
}

export function evaluateDynamicMppts(input: {
  strings: StringOperatingPoint[];
  mpptCount: number;
  mppVoltageMinV: number;
  mppVoltageMaxV: number;
  maxInputVoltageV: number;
  maxOperatingCurrentPerMpptA: number;
  maxShortCircuitCurrentPerMpptA: number;
  maxStringsPerMppt: number;
}): MpptOperatingPoint[] {
  return allocateStringsToMppts(input.strings, input.mpptCount).map(
    (strings, index) => {
      if (strings.length === 0) {
        return {
          mpptIndex: index + 1,
          strings: [],
          voltageV: 0,
          currentA: 0,
          shortCircuitCurrentA: 0,
          unconstrainedPowerW: 0,
          acceptedPowerW: 0,
          currentLimitLossW: 0,
          voltageWindowLossW: 0,
          status: "INACTIVE" as const,
          warnings: [],
        };
      }

      const voltageV =
        strings.reduce((sum, string) => sum + string.vmpV, 0) / strings.length;
      const currentA = strings.reduce((sum, string) => sum + string.impA, 0);
      const shortCircuitCurrentA = strings.reduce(
        (sum, string) => sum + string.iscA,
        0,
      );
      const unconstrainedPowerW = strings.reduce(
        (sum, string) => sum + string.pmpW,
        0,
      );
      const warnings: string[] = [];
      let status: MpptOperatingPoint["status"] = "NORMAL";
      let voltageAcceptance = 1;

      if (strings.length > input.maxStringsPerMppt) {
        warnings.push(
          `MPPT ${index + 1} has ${strings.length} strings; maximum is ${input.maxStringsPerMppt}.`,
        );
        status = "OVERCURRENT";
      }
      if (voltageV >= input.maxInputVoltageV) {
        warnings.push(`MPPT ${index + 1} exceeds maximum DC voltage.`);
        status = "OVERVOLTAGE_FAULT";
        voltageAcceptance = 0;
      } else if (voltageV < input.mppVoltageMinV) {
        warnings.push(`MPPT ${index + 1} is below the nominal MPP window.`);
        status = "BELOW_WINDOW";
        voltageAcceptance = clamp(voltageV / input.mppVoltageMinV, 0, 1);
      } else if (voltageV > input.mppVoltageMaxV) {
        warnings.push(`MPPT ${index + 1} is above the nominal MPP window.`);
        status = "ABOVE_WINDOW";
        voltageAcceptance = clamp(input.mppVoltageMaxV / voltageV, 0, 1);
      }

      const currentAcceptance =
        currentA > 0
          ? clamp(input.maxOperatingCurrentPerMpptA / currentA, 0, 1)
          : 1;
      if (currentA > input.maxOperatingCurrentPerMpptA) {
        warnings.push(`MPPT ${index + 1} operating current exceeds its limit.`);
        status = "OVERCURRENT";
      }
      if (shortCircuitCurrentA > input.maxShortCircuitCurrentPerMpptA) {
        warnings.push(`MPPT ${index + 1} short-circuit current exceeds its limit.`);
        status = "OVERCURRENT";
      }

      const afterVoltageW = unconstrainedPowerW * voltageAcceptance;
      const acceptedPowerW = afterVoltageW * currentAcceptance;
      return {
        mpptIndex: index + 1,
        strings: strings.map((string) => string.stringIndex),
        voltageV,
        currentA,
        shortCircuitCurrentA,
        unconstrainedPowerW,
        acceptedPowerW,
        currentLimitLossW: Math.max(0, afterVoltageW - acceptedPowerW),
        voltageWindowLossW: Math.max(0, unconstrainedPowerW - afterVoltageW),
        status,
        warnings,
      };
    },
  );
}
