import { describe, expect, it } from "vitest";
import {
  calculateColdVoc,
  calculateEuropeanEfficiency,
  calculateFittedInverterConversion,
  calculateModuleOperatingPoint,
  createStringOperatingPoints,
  evaluateDynamicMppts,
  solveFittedPdcoW,
} from "@/lib/physics";

const moduleDatasheet = {
  pmaxW: 420,
  vmppV: 44.9,
  imppA: 9.37,
  vocV: 53.8,
  iscA: 9.8,
  tempCoeffPmaxPercentPerC: -0.37,
  tempCoeffVocPercentPerC: -0.29,
  tempCoeffIscPercentPerC: 0.05,
  cellsInSeries: 72,
};

describe("Phase 9H/9L electrical physics", () => {
  it("passes the reference cold-Voc calculation and critical temperature", () => {
    const cold = calculateColdVoc(53.8, 17, -0.29, 0);
    expect(cold.moduleVocV).toBeCloseTo(57.7, 1);
    expect(cold.stringVocV).toBeCloseTo(980.91, 1);
    expect(cold.criticalTemperatureC).toBeCloseTo(-7.2, 1);
  });

  it("reproduces the fitted inverter maximum and European efficiencies", () => {
    const pdcoW = solveFittedPdcoW();
    const result = calculateFittedInverterConversion({
      dcInputPowerW: pdcoW,
      ratedAcPowerW: 50_000,
    });
    expect(result.acOutputPowerW).toBeCloseTo(50_000, 4);
    expect(result.efficiency).toBeCloseTo(0.981, 5);
    expect(calculateEuropeanEfficiency(pdcoW)).toBeCloseTo(0.978, 3);
  });

  it("derives MPP from an I-V curve and responds to temperature", () => {
    const cool = calculateModuleOperatingPoint({
      model: "single_diode",
      datasheet: moduleDatasheet,
      effectiveIrradianceWm2: 1000,
      cellTemperatureC: 25,
      includeCurve: true,
    });
    const hot = calculateModuleOperatingPoint({
      model: "single_diode",
      datasheet: moduleDatasheet,
      effectiveIrradianceWm2: 1000,
      cellTemperatureC: 65,
    });
    expect(cool.ivCurve?.length).toBeGreaterThan(100);
    expect(cool.pmpW).toBeGreaterThan(0);
    expect(hot.vocV).toBeLessThan(cool.vocV);
    expect(hot.pmpW).toBeLessThan(cool.pmpW);
  });

  it("allocates seven strings as [2,1,1,1,1,1] and enforces MPPT limits", () => {
    const modulePoint = calculateModuleOperatingPoint({
      model: "simple_power",
      datasheet: moduleDatasheet,
      effectiveIrradianceWm2: 1000,
      cellTemperatureC: 25,
    });
    const strings = createStringOperatingPoints({
      module: modulePoint,
      stringCount: 7,
      modulesPerString: 17,
    });
    const mppts = evaluateDynamicMppts({
      strings,
      mpptCount: 6,
      mppVoltageMinV: 500,
      mppVoltageMaxV: 800,
      maxInputVoltageV: 1000,
      maxOperatingCurrentPerMpptA: 20,
      maxShortCircuitCurrentPerMpptA: 30,
      maxStringsPerMppt: 2,
    });
    expect(mppts.map((point) => point.strings.length)).toEqual([2, 1, 1, 1, 1, 1]);
    expect(mppts[0].currentA).toBeCloseTo(18.74, 2);
    expect(mppts[0].status).toBe("NORMAL");
  });
});
