import { describe, expect, it } from "vitest";
import fixture from "@/test/fixtures/phase7b-land-config.json";
import { migrateLegacyConfiguration } from "@/lib/sites/migrations";
import { runLandAgrivoltaicSimulation } from "@/lib/sites/adapters/landAgrivoltaic";
import { runSimulation } from "../engine";
import type { SimulationConfiguration } from "@/types/simulation";

const configuration = fixture as SimulationConfiguration;

describe("Phase 7B-PV land-engine compatibility", () => {
  it("returns exactly the same result through the land adapter", () => {
    const legacyResult = runSimulation(configuration, null);
    const adaptedResult = runLandAgrivoltaicSimulation(
      migrateLegacyConfiguration(configuration),
      null,
    );
    expect(adaptedResult).toEqual(legacyResult);
  });

  it("keeps core numerical and controller invariants", () => {
    const result = runSimulation(configuration, null);
    expect(result.hourly).toHaveLength(24);
    expect(result.installedCapacityKW).toBe(33);
    expect(result.dailyEnergyKWh).toBeGreaterThan(0);
    expect(result.openFieldDLI).toBeGreaterThan(0);
    expect(result.spatialLight.cells.length).toBeGreaterThan(0);
    expect(result.adaptiveController.protectionBasis).toBe("beneath-panel");
    expect(
      result.adaptiveController.standardTrackingHours +
        result.adaptiveController.reverseTrackingHours,
    ).toBeGreaterThan(0);
    expect(result.hourly.filter((point) => point.irradiance === 0).every((point) => point.pvPower === 0)).toBe(true);
  });

  it("preserves module-driven capacity, geometry, temperature and energy effects", () => {
    const base = runSimulation(configuration, null);
    const changed: SimulationConfiguration = {
      ...configuration,
      pv: {
        ...configuration.pv,
        moduleProfileId: "regression-alternative",
        modulePower: configuration.pv.modulePower + 50,
        moduleWidth: configuration.pv.moduleWidth + 0.1,
        moduleLength: configuration.pv.moduleLength + 0.1,
        moduleNOCT: configuration.pv.moduleNOCT + 5,
        temperatureCoefficientPmax: configuration.pv.temperatureCoefficientPmax - 0.05,
      },
    };
    const alternative = runSimulation(changed, null);
    expect(alternative.installedCapacityKW).not.toBe(base.installedCapacityKW);
    expect(alternative.groundCoverageRatio).not.toBe(base.groundCoverageRatio);
    expect(alternative.hourly[12].moduleTemperature).not.toBe(base.hourly[12].moduleTemperature);
    expect(alternative.dailyEnergyKWh).not.toBe(base.dailyEnergyKWh);
  });
});
