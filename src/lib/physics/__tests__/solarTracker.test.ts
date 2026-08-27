import { describe, expect, it } from "vitest";
import {
  calculateSingleAxisTracker,
  calculateSpaEquivalentSolarPosition,
} from "@/lib/physics";

describe("SPA-equivalent solar geometry and tracker", () => {
  it("reproduces the published NREL SPA example within engineering tolerance", () => {
    const solar = calculateSpaEquivalentSolarPosition({
      timestamp: "2003-10-17T19:30:30Z",
      latitudeDeg: 39.742476,
      longitudeDeg: -105.1786,
      elevationM: 1830.14,
      pressurePa: 82_000,
      ambientTemperatureC: 11,
    });

    expect(solar.apparentZenithDeg).toBeCloseTo(50.11, 0);
    expect(solar.azimuthDeg).toBeCloseTo(194.34, 0);
  });

  it("uses backtracking to reduce the ideal rotation at high GCR", () => {
    const solar = calculateSpaEquivalentSolarPosition({
      timestamp: "2026-03-21T01:00:00Z",
      latitudeDeg: 23.81,
      longitudeDeg: 90.41,
    });
    const tracker = calculateSingleAxisTracker({
      solar,
      mode: "standard_backtracking",
      fixedTiltDeg: 20,
      fixedAzimuthDeg: 180,
      axisTiltDeg: 0,
      axisAzimuthDeg: 0,
      maximumRotationDeg: 60,
      groundCoverageRatio: 0.5,
      backtrackingEnabled: true,
      crossAxisSlopeDeg: 0,
      stowAngleDeg: 0,
    });

    expect(Math.abs(tracker.backtrackedAngleDeg)).toBeLessThanOrEqual(
      Math.abs(tracker.idealAngleDeg),
    );
    expect(Math.abs(tracker.finalAngleDeg)).toBeLessThanOrEqual(60);
  });
});
