import { describe, expect, it } from "vitest";
import {
  createCalibratedParameterRevision,
  validateModelLayer,
} from "@/lib/physics";

describe("layered physical validation", () => {
  it("calculates residual metrics without confusing verification and validation", () => {
    const result = validateModelLayer({
      layer: "module_temperature",
      quantity: "rear module temperature",
      unit: "°C",
      predicted: [30, 40, 50],
      measured: [29, 39, 48],
    });
    expect(result.metrics.sampleCount).toBe(3);
    expect(result.metrics.mae).toBeCloseTo(4 / 3, 8);
  });

  it("creates an auditable calibration revision instead of overwriting values", () => {
    const revision = createCalibratedParameterRevision({
      parameter: "pvsystUc",
      originalValue: 29,
      updatedValue: 27.5,
      unit: "W/(m²·K)",
      timestamp: "2026-08-27T00:00:00Z",
      reason: "Minimized validation-period module-temperature RMSE",
      confidence: 0.8,
    });
    expect(revision.originalValue).toBe(29);
    expect(revision.updatedValue).toBe(27.5);
    expect(revision.source).toBe("measured_residual_calibration");
  });
});
