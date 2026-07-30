import {
  solveRectangularRoofLayout,
  type RectangularRoofLayout,
} from "@/lib/geometry/rectangularRoof";

import type {
  FlatRoofSiteProfile,
} from "../schema";

export interface FlatRoofDesignContext {
  siteId: string;
  siteName: string;
  latitude: number;
  longitude: number;
  timezone: string;
  simulationDate: string;
  buildingHeightM: number;
  roofAzimuthDeg: number;
  roofSlopeDeg: number;
  arrayAzimuthDeg: number;
  arrayTiltDeg: number;
  rackHeightM: number;
  surfaceAlbedo: number;
  layout: RectangularRoofLayout;
  structuralDisclaimer: string;
}

export const FLAT_ROOF_STRUCTURAL_DISCLAIMER =
  "Preliminary geometry and energy simulation only. A qualified structural engineer must verify roof capacity, wind uplift, anchoring, ballast, waterproofing, drainage, fire access and local-code compliance.";

export function createFlatRoofDesignContext(
  site: FlatRoofSiteProfile,
): FlatRoofDesignContext {
  const layout = solveRectangularRoofLayout({
    geometry: site.siteGeometry,
    moduleWidthM:
      site.pvConfiguration.moduleWidth,
    moduleLengthM:
      site.pvConfiguration.moduleLength,
    modulePowerW:
      site.pvConfiguration.modulePower,
  });

  return {
    siteId: site.id,
    siteName: site.name,
    latitude: site.location.latitude,
    longitude: site.location.longitude,
    timezone: site.location.timezone,
    simulationDate: site.simulationDate,
    buildingHeightM:
      site.siteGeometry.buildingHeightM,
    roofAzimuthDeg:
      site.siteGeometry.roofAzimuthDeg,
    roofSlopeDeg:
      site.siteGeometry.roofSlopeDeg,
    arrayAzimuthDeg:
      site.siteGeometry.array.azimuthDeg,
    arrayTiltDeg:
      site.siteGeometry.array.tiltDeg,
    rackHeightM:
      site.siteGeometry.array.rackHeightM,
    surfaceAlbedo:
      site.siteGeometry.surfaceAlbedo,
    layout,
    structuralDisclaimer:
      FLAT_ROOF_STRUCTURAL_DISCLAIMER,
  };
}
