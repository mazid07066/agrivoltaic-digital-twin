import { describe, expect, it } from "vitest";
import { integratePowerSeriesKwh } from "@/lib/physics";

describe("timestep-aware energy integration", () => {
  it("produces the same energy for hourly and 15-minute power", () => {
    const hourly = integratePowerSeriesKwh({
      timestamps: ["2026-01-01T00:00:00Z", "2026-01-01T01:00:00Z"],
      powerW: [1000, 1000],
    });
    const quarterHourly = integratePowerSeriesKwh({
      timestamps: [
        "2026-01-01T00:00:00Z",
        "2026-01-01T00:15:00Z",
        "2026-01-01T00:30:00Z",
        "2026-01-01T00:45:00Z",
        "2026-01-01T01:00:00Z",
        "2026-01-01T01:15:00Z",
        "2026-01-01T01:30:00Z",
        "2026-01-01T01:45:00Z",
      ],
      powerW: Array.from({ length: 8 }, () => 1000),
    });
    expect(hourly.energyKwh).toBeCloseTo(2, 8);
    expect(quarterHourly.energyKwh).toBeCloseTo(2, 8);
    expect(quarterHourly.timestep.medianTimestepSeconds).toBe(900);
  });
});
