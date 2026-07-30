import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createDefaultFlatRoofSiteProfile,
} from "../defaults";
import {
  isFlatRoofSiteProfile,
  isSiteProfile,
  migratePersistedSiteState,
} from "../migrations";
import {
  createFlatRoofDesignContext,
  FLAT_ROOF_STRUCTURAL_DISCLAIMER,
} from "../adapters/flatRoof";

describe("Phase 8C-1 flat-roof SiteProfile", () => {
  it("creates a valid PV-only flat-roof profile", () => {
    const site =
      createDefaultFlatRoofSiteProfile();

    expect(site.siteType).toBe("flat_roof");
    expect(site.siteGeometry.kind).toBe(
      "flat_roof",
    );
    expect(
      "cropConfiguration" in site,
    ).toBe(false);
    expect(isFlatRoofSiteProfile(site)).toBe(true);
    expect(isSiteProfile(site)).toBe(true);
  });

  it("round-trips through persisted state migration", () => {
    const site =
      createDefaultFlatRoofSiteProfile();

    const migrated =
      migratePersistedSiteState({
        state: {
          activeSite: site,
        },
      });

    expect(migrated).toEqual(site);
  });

  it("builds a design context without claiming structural safety", () => {
    const site =
      createDefaultFlatRoofSiteProfile();

    const context =
      createFlatRoofDesignContext(site);

    expect(context.layout.moduleCount).toBeGreaterThan(0);
    expect(context.buildingHeightM).toBe(12);
    expect(context.structuralDisclaimer).toBe(
      FLAT_ROOF_STRUCTURAL_DISCLAIMER,
    );
    expect(
      context.structuralDisclaimer.toLowerCase(),
    ).not.toContain("structurally safe");
  });
});
