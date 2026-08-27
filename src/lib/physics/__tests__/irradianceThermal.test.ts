import { describe, expect, it } from "vitest";
import {
  calculateCellTemperature,
  calculateGeometricRowShading,
  calculateIam,
  calculatePlaneOfArrayIrradiance,
  calculateSpaEquivalentSolarPosition,
} from "@/lib/physics";

describe("Phase 9I–9K irradiance, IAM, shading and thermal models", () => {
  const solar = calculateSpaEquivalentSolarPosition({
    timestamp: "2026-03-21T06:00:00Z",
    latitudeDeg: 23.81,
    longitudeDeg: 90.41,
  });

  it("produces component-resolved Perez POA and Martin-Ruiz IAM", () => {
    const poa = calculatePlaneOfArrayIrradiance({
      model: "perez",
      solar,
      surfaceTiltDeg: 20,
      surfaceAzimuthDeg: 180,
      ghiWm2: 800,
      dniWm2: 650,
      dhiWm2: 150,
      groundAlbedo: 0.2,
      dayOfYear: 80,
    });
    const iam = calculateIam("martin_ruiz", poa, 0.16);

    expect(poa.poaGlobalWm2).toBeGreaterThan(0);
    expect(poa.poaGlobalWm2).toBeCloseTo(
      poa.poaDirectWm2 + poa.poaSkyDiffuseWm2 + poa.poaGroundDiffuseWm2,
      8,
    );
    expect(iam.effectiveIrradianceWm2).toBeLessThanOrEqual(poa.poaGlobalWm2);
  });

  it("keeps PV-row and crop-ground irradiance separate", () => {
    const shading = calculateGeometricRowShading({
      rowCount: 21,
      rowPitchM: 4,
      collectorWidthM: 2,
      clearanceM: 2,
      surfaceTiltDeg: 45,
      surfaceAzimuthDeg: 180,
      solarElevationDeg: 15,
      solarAzimuthDeg: 180,
      directWm2: 600,
      diffuseWm2: 100,
      groundReflectedWm2: 20,
    });

    expect(shading.rowFactors).toHaveLength(21);
    expect(shading.rowFactors[0]).toBe(1);
    expect(shading.meanPvFactor).toBeLessThan(1);
    expect(shading.cropGroundIrradianceWm2).toBeLessThan(700);
  });

  it("makes Faiman temperature respond to wind and supports PVsyst", () => {
    const calm = calculateCellTemperature({
      model: "faiman",
      irradianceWm2: 800,
      ambientTemperatureC: 30,
      windSpeedMs: 0,
      noctC: 43,
      moduleEfficiency: 0.2,
      moduleAbsorption: 0.9,
      faimanU0: 25,
      faimanU1: 6.84,
      pvsystUc: 29,
      pvsystUv: 0,
    });
    const windy = calculateCellTemperature({
      model: "faiman",
      irradianceWm2: 800,
      ambientTemperatureC: 30,
      windSpeedMs: 5,
      noctC: 43,
      moduleEfficiency: 0.2,
      moduleAbsorption: 0.9,
      faimanU0: 25,
      faimanU1: 6.84,
      pvsystUc: 29,
      pvsystUv: 0,
    });
    const pvsyst = calculateCellTemperature({
      model: "pvsyst",
      irradianceWm2: 800,
      ambientTemperatureC: 30,
      windSpeedMs: 5,
      noctC: 43,
      moduleEfficiency: 0.2,
      moduleAbsorption: 0.9,
      faimanU0: 25,
      faimanU1: 6.84,
      pvsystUc: 29,
      pvsystUv: 0,
    });

    expect(windy.cellTemperatureC).toBeLessThan(calm.cellTemperatureC);
    expect(pvsyst.cellTemperatureC).toBeGreaterThan(30);
  });
});
