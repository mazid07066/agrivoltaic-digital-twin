import { describe, expect, it } from "vitest";
import {
  createDefaultPhysicsModelConfiguration,
  simulatePhysicsTimestep,
} from "@/lib/physics";

describe("149.94 kWp reference plant", () => {
  it("preserves topology, plant ceiling and energy balance", () => {
    const result = simulatePhysicsTimestep({
      timestamp: "2026-03-21T06:00:00Z",
      latitudeDeg: 23.81,
      longitudeDeg: 90.41,
      ghiWm2: 1000,
      dniWm2: 900,
      dhiWm2: 100,
      ambientTemperatureC: 25,
      windSpeedMs: 1,
      rowCount: 21,
      rowPitchM: 4,
      collectorWidthM: 2,
      clearanceM: 2,
      fixedTiltDeg: 20,
      fixedAzimuthDeg: 180,
      maximumTrackerAngleDeg: 60,
      groundCoverageRatio: 0.5,
      groundAlbedo: 0.2,
      moduleCount: 357,
      modulesPerString: 17,
      stringsPerInverter: 7,
      inverterCount: 3,
      mpptCountPerInverter: 6,
      maxStringsPerMppt: 2,
      mppVoltageMinV: 500,
      mppVoltageMaxV: 800,
      maxInputVoltageV: 1000,
      maxOperatingCurrentPerMpptA: 20,
      maxShortCircuitCurrentPerMpptA: 30,
      ratedAcPowerPerInverterW: 50_000,
      module: {
        pmaxW: 420,
        vmppV: 44.9,
        imppA: 9.37,
        vocV: 53.8,
        iscA: 9.8,
        tempCoeffPmaxPercentPerC: -0.37,
        tempCoeffVocPercentPerC: -0.29,
        tempCoeffIscPercentPerC: 0.05,
        noctC: 43,
        efficiencyFraction: 0.2,
        cellsInSeries: 72,
      },
      configuration: createDefaultPhysicsModelConfiguration("physics_research"),
    });

    expect(result.strings).toHaveLength(21);
    expect(result.mppts).toHaveLength(18);
    expect(result.inverter.acOutputPowerW).toBeLessThanOrEqual(150_000);
    expect(result.energyBalance.withinTolerance).toBe(true);
  });
});
