import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createDefaultFlatRoofSiteProfile,
} from "@/lib/sites/defaults";

import {
  calculateUsableRoofRectangle,
  normalizeAzimuthDeg,
  solveRectangularRoofLayout,
} from "../rectangularRoof";

describe("Phase 8C-1 rectangular flat-roof geometry", () => {
  it("subtracts setbacks and parapet width from the roof plan", () => {
    const site =
      createDefaultFlatRoofSiteProfile();

    const usable =
      calculateUsableRoofRectangle(
        site.siteGeometry,
      );

    expect(usable.widthM).toBeCloseTo(16.6, 8);
    expect(usable.lengthM).toBeCloseTo(26.6, 8);
    expect(usable.areaM2).toBeCloseTo(441.56, 8);
  });

  it("places every module within the usable rectangle", () => {
    const site =
      createDefaultFlatRoofSiteProfile();

    const layout =
      solveRectangularRoofLayout({
        geometry: site.siteGeometry,
        moduleWidthM:
          site.pvConfiguration.moduleWidth,
        moduleLengthM:
          site.pvConfiguration.moduleLength,
        modulePowerW:
          site.pvConfiguration.modulePower,
      });

    expect(layout.moduleCount).toBeGreaterThan(0);
    expect(layout.placements).toHaveLength(
      layout.moduleCount,
    );

    for (const placement of layout.placements) {
      expect(
        placement.centerXM -
          placement.footprintWidthM / 2,
      ).toBeGreaterThanOrEqual(
        layout.usableArea.xM - 1e-9,
      );

      expect(
        placement.centerXM +
          placement.footprintWidthM / 2,
      ).toBeLessThanOrEqual(
        layout.usableArea.xM +
          layout.usableArea.widthM +
          1e-9,
      );

      expect(
        placement.centerYM -
          placement.footprintLengthM / 2,
      ).toBeGreaterThanOrEqual(
        layout.usableArea.yM - 1e-9,
      );

      expect(
        placement.centerYM +
          placement.footprintLengthM / 2,
      ).toBeLessThanOrEqual(
        layout.usableArea.yM +
          layout.usableArea.lengthM +
          1e-9,
      );
    }
  });

  it("changes layout when module orientation changes", () => {
    const portrait =
      createDefaultFlatRoofSiteProfile();

    const landscape = {
      ...portrait,
      siteGeometry: {
        ...portrait.siteGeometry,
        array: {
          ...portrait.siteGeometry.array,
          orientation: "landscape" as const,
        },
      },
    };

    const portraitLayout =
      solveRectangularRoofLayout({
        geometry: portrait.siteGeometry,
        moduleWidthM:
          portrait.pvConfiguration.moduleWidth,
        moduleLengthM:
          portrait.pvConfiguration.moduleLength,
        modulePowerW:
          portrait.pvConfiguration.modulePower,
      });

    const landscapeLayout =
      solveRectangularRoofLayout({
        geometry: landscape.siteGeometry,
        moduleWidthM:
          landscape.pvConfiguration.moduleWidth,
        moduleLengthM:
          landscape.pvConfiguration.moduleLength,
        modulePowerW:
          landscape.pvConfiguration.modulePower,
      });

    expect(
      landscapeLayout.modulesPerRow,
    ).not.toBe(
      portraitLayout.modulesPerRow,
    );
  });

  it("rejects a roof consumed by setbacks", () => {
    const site =
      createDefaultFlatRoofSiteProfile();

    const invalidGeometry = {
      ...site.siteGeometry,
      setbacks: {
        ...site.siteGeometry.setbacks,
        northM: 20,
        southM: 20,
      },
    };

    expect(() =>
      calculateUsableRoofRectangle(
        invalidGeometry,
      ),
    ).toThrow(
      "leave no usable rectangular roof area",
    );
  });

  it("normalizes azimuth into zero to below 360 degrees", () => {
    expect(normalizeAzimuthDeg(360)).toBe(0);
    expect(normalizeAzimuthDeg(-90)).toBe(270);
    expect(normalizeAzimuthDeg(725)).toBe(5);
  });
});

