import { clamp } from "./math";
import type { ModuleElectricalModel, ModuleOperatingPoint } from "./types";

const BOLTZMANN_EV_PER_K = 8.617333262145e-5;

export interface ModuleDatasheetInput {
  pmaxW: number;
  vmppV: number;
  imppA: number;
  vocV: number;
  iscA: number;
  tempCoeffPmaxPercentPerC: number;
  tempCoeffVocPercentPerC: number;
  tempCoeffIscPercentPerC: number;
  cellsInSeries?: number;
  diodeIdealityFactor?: number;
  seriesResistanceOhm?: number;
  shuntResistanceOhm?: number;
}

export interface ModuleOperatingInput {
  model: ModuleElectricalModel;
  datasheet: ModuleDatasheetInput;
  effectiveIrradianceWm2: number;
  cellTemperatureC: number;
  includeCurve?: boolean;
}

function diodeParameters(datasheet: ModuleDatasheetInput, temperatureC: number) {
  const cells = datasheet.cellsInSeries ?? 72;
  const ideality = datasheet.diodeIdealityFactor ?? 1.25;
  const temperatureK = temperatureC + 273.15;
  const referenceK = 298.15;
  const aRef = ideality * cells * BOLTZMANN_EV_PER_K * referenceK;
  const a = ideality * cells * BOLTZMANN_EV_PER_K * temperatureK;
  const saturationCurrentRef =
    datasheet.iscA / Math.max(Math.exp(datasheet.vocV / aRef) - 1, 1e-20);
  const saturationCurrent =
    saturationCurrentRef *
    (temperatureK / referenceK) ** 3 *
    Math.exp(
      (1.121 / (ideality * BOLTZMANN_EV_PER_K)) *
        (1 / referenceK - 1 / temperatureK),
    );
  const seriesResistance =
    datasheet.seriesResistanceOhm ??
    clamp(
      (datasheet.vocV - datasheet.vmppV) / Math.max(datasheet.imppA, 0.01) -
        aRef / Math.max(datasheet.imppA, 0.01),
      0.01,
      2,
    );
  const shuntResistance =
    datasheet.shuntResistanceOhm ??
    clamp(
      datasheet.vmppV /
        Math.max(datasheet.iscA - datasheet.imppA, 0.02),
      50,
      10_000,
    );
  return {
    a,
    saturationCurrent,
    seriesResistance,
    shuntResistance,
  };
}

function solveCurrent(
  voltageV: number,
  photoCurrentA: number,
  saturationCurrentA: number,
  aV: number,
  seriesResistanceOhm: number,
  shuntResistanceOhm: number,
): number {
  let lower = 0;
  let upper = Math.max(0, photoCurrentA);
  for (let iteration = 0; iteration < 80; iteration += 1) {
    const current = (lower + upper) / 2;
    const diodeVoltage = voltageV + current * seriesResistanceOhm;
    const residual =
      photoCurrentA -
      saturationCurrentA * (Math.exp(Math.min(80, diodeVoltage / aV)) - 1) -
      diodeVoltage / shuntResistanceOhm -
      current;
    if (residual > 0) lower = current;
    else upper = current;
  }
  return Math.max(0, (lower + upper) / 2);
}

function singleDiodeOperatingPoint(
  input: ModuleOperatingInput,
): ModuleOperatingPoint {
  const irradiance = Math.max(0, input.effectiveIrradianceWm2);
  if (irradiance <= 0) {
    return {
      model: "single_diode",
      irradianceWm2: irradiance,
      cellTemperatureC: input.cellTemperatureC,
      iscA: 0,
      vocV: 0,
      impA: 0,
      vmpV: 0,
      pmpW: 0,
      ...(input.includeCurve ? { ivCurve: [] } : {}),
    };
  }

  const datasheet = input.datasheet;
  const irradianceRatio = irradiance / 1000;
  const deltaTemperature = input.cellTemperatureC - 25;
  const photoCurrent =
    datasheet.iscA *
    irradianceRatio *
    (1 + (datasheet.tempCoeffIscPercentPerC / 100) * deltaTemperature);
  const parameters = diodeParameters(datasheet, input.cellTemperatureC);
  const openCircuitVoltage = Math.max(
    0,
    parameters.a *
      Math.log(
        Math.max(
          1,
          (photoCurrent + parameters.saturationCurrent) /
            parameters.saturationCurrent,
        ),
      ),
  );
  const curve = Array.from({ length: 161 }, (_, index) => {
    const voltageV = (openCircuitVoltage * index) / 160;
    const currentA = solveCurrent(
      voltageV,
      photoCurrent,
      parameters.saturationCurrent,
      parameters.a,
      parameters.seriesResistance,
      parameters.shuntResistance,
    );
    return {
      voltageV,
      currentA,
      powerW: voltageV * currentA,
    };
  });
  const mpp = curve.reduce((best, point) =>
    point.powerW > best.powerW ? point : best,
  );

  return {
    model: "single_diode",
    irradianceWm2: irradiance,
    cellTemperatureC: input.cellTemperatureC,
    iscA: photoCurrent,
    vocV: openCircuitVoltage,
    impA: mpp.currentA,
    vmpV: mpp.voltageV,
    pmpW: mpp.powerW,
    ...(input.includeCurve ? { ivCurve: curve } : {}),
  };
}

function simplePowerOperatingPoint(
  input: ModuleOperatingInput,
): ModuleOperatingPoint {
  const datasheet = input.datasheet;
  const irradiance = Math.max(0, input.effectiveIrradianceWm2);
  const irradianceRatio = irradiance / 1000;
  const deltaTemperature = input.cellTemperatureC - 25;
  const temperaturePowerFactor = Math.max(
    0,
    1 + (datasheet.tempCoeffPmaxPercentPerC / 100) * deltaTemperature,
  );
  const voltageFactor = Math.max(
    0,
    1 + (datasheet.tempCoeffVocPercentPerC / 100) * deltaTemperature,
  );
  const currentFactor = Math.max(
    0,
    1 + (datasheet.tempCoeffIscPercentPerC / 100) * deltaTemperature,
  );
  return {
    model: "simple_power",
    irradianceWm2: irradiance,
    cellTemperatureC: input.cellTemperatureC,
    iscA: datasheet.iscA * irradianceRatio * currentFactor,
    vocV: irradiance > 0 ? datasheet.vocV * voltageFactor : 0,
    impA: datasheet.imppA * irradianceRatio * currentFactor,
    vmpV: irradiance > 0 ? datasheet.vmppV * voltageFactor : 0,
    pmpW: datasheet.pmaxW * irradianceRatio * temperaturePowerFactor,
  };
}

export function calculateModuleOperatingPoint(
  input: ModuleOperatingInput,
): ModuleOperatingPoint {
  return input.model === "single_diode"
    ? singleDiodeOperatingPoint(input)
    : simplePowerOperatingPoint(input);
}

export function calculateColdVoc(
  vocStcV: number,
  modulesPerString: number,
  betaVocPercentPerC: number,
  minimumCellTemperatureC: number,
): {
  moduleVocV: number;
  stringVocV: number;
  criticalTemperatureC: number;
} {
  const coefficient = betaVocPercentPerC / 100;
  const moduleVocV = vocStcV * (1 + coefficient * (minimumCellTemperatureC - 25));
  const stringVocV = moduleVocV * modulesPerString;
  const criticalTemperatureC =
    coefficient === 0
      ? Number.NEGATIVE_INFINITY
      : 25 + (1000 / (vocStcV * modulesPerString) - 1) / coefficient;
  return { moduleVocV, stringVocV, criticalTemperatureC };
}
