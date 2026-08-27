import { describe, expect, it } from "vitest";
import { createDefaultPhysicsModelConfiguration } from "@/lib/physics";
import { runSimulation } from "@/lib/simulation/engine";
import { createDefaultLandSiteProfile } from "@/lib/sites/defaults";
import { toLandSimulationConfiguration } from "@/lib/sites/adapters/landAgrivoltaic";

describe("physics-mode application integration", () => {
  it("does not apply aggregate systemEfficiency in physics mode", () => {
    const site = createDefaultLandSiteProfile("2026-03-21");
    site.pvConfiguration = {
      ...site.pvConfiguration,
      numberOfRows: 21,
      modulesPerRow: 17,
      modulePower: 420,
      moduleVmpp: 44.9,
      moduleImpp: 9.37,
      moduleVoc: 53.8,
      moduleIsc: 9.8,
      moduleNOCT: 43,
      temperatureCoefficientPmax: -0.37,
      moduleTempCoeffVocPercentPerC: -0.29,
      moduleTempCoeffIscPercentPerC: 0.05,
      modulesPerString: 17,
      stringsPerInverter: 7,
      inverterCount: 3,
      rowSpacing: 4,
      moduleLength: 2,
      systemEfficiency: 0.2,
      physicsConfiguration:
        createDefaultPhysicsModelConfiguration("physics_research"),
    };
    const lowLegacyFactor = runSimulation(toLandSimulationConfiguration(site));

    site.pvConfiguration.systemEfficiency = 0.99;
    const highLegacyFactor = runSimulation(toLandSimulationConfiguration(site));

    expect(highLegacyFactor.dailyEnergyKWh).toBe(lowLegacyFactor.dailyEnergyKWh);
    expect(highLegacyFactor.hourly.some((point) => point.physics)).toBe(true);
    expect(
      highLegacyFactor.hourly.every(
        (point) => point.physics?.energyBalance.withinTolerance ?? true,
      ),
    ).toBe(true);
  });

  it("retains exact legacy sensitivity to systemEfficiency", () => {
    const site = createDefaultLandSiteProfile("2026-03-21");
    site.pvConfiguration.physicsConfiguration =
      createDefaultPhysicsModelConfiguration("legacy_parity");
    site.pvConfiguration.systemEfficiency = 0.5;
    const lower = runSimulation(toLandSimulationConfiguration(site));
    site.pvConfiguration.systemEfficiency = 1;
    const higher = runSimulation(toLandSimulationConfiguration(site));
    expect(higher.dailyEnergyKWh).toBeGreaterThan(lower.dailyEnergyKWh);
    expect(higher.hourly.every((point) => point.physics === undefined)).toBe(true);
  });
});
