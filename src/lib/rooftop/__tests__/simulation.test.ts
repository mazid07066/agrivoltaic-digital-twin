import { describe, expect, it } from "vitest";

import { createDefaultFlatRoofSiteProfile } from "@/lib/sites/defaults";
import { runFlatRoofSimulation } from "../simulation";

describe("Phase 8C-2 rooftop simulation", () => {
  it("returns a deterministic 24-hour PV-only result", () => {
    const site = createDefaultFlatRoofSiteProfile(
      "2026-07-30",
    );
    const result = runFlatRoofSimulation(site);

    expect(result.hourly).toHaveLength(24);
    expect(result.moduleCount).toBeGreaterThan(0);
    expect(result.installedCapacityKW).toBeGreaterThan(0);
    expect(result.dailyEnergyKWh).toBeGreaterThan(0);
    expect(result.dataSource).toBe("synthetic");
  });

  it("does not expose crop or land-equivalent outputs", () => {
    const result = runFlatRoofSimulation(
      createDefaultFlatRoofSiteProfile(
        "2026-07-30",
      ),
    );

    expect("cropDLI" in result).toBe(false);
    expect("landEquivalentRatio" in result).toBe(false);
  });
});
