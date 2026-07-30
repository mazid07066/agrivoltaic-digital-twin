import type { CropId, PVConfiguration } from "@/types/simulation";

export const SITE_PROFILE_SCHEMA_VERSION = 1 as const;

export type SiteType =
  | "land_agrivoltaic"
  | "flat_roof"
  | "pitched_roof"
  | "industrial_shed"
  | "greenhouse"
  | "carport"
  | "facade";

export type DataMode = "virtual" | "connected" | "hybrid";

export interface SiteLocation {
  latitude: number;
  longitude: number;
  timezone: string;
  terrainElevationM?: number;
}

export interface LandAgrivoltaicGeometry {
  kind: "land";
  fieldLengthM: number;
  fieldWidthM: number;
}

export interface FlatRoofParapet {
  enabled: boolean;
  heightM: number;
  widthM: number;
}

export interface FlatRoofSetbacks {
  northM: number;
  southM: number;
  eastM: number;
  westM: number;
}

export type ModuleOrientation = "portrait" | "landscape";

export interface FlatRoofArrayConfiguration {
  rackHeightM: number;
  tiltDeg: number;
  azimuthDeg: number;
  rowSpacingM: number;
  orientation: ModuleOrientation;
}

export interface FlatRoofGeometry {
  kind: "flat_roof";
  buildingHeightM: number;
  roofLengthM: number;
  roofWidthM: number;
  roofAzimuthDeg: number;
  roofSlopeDeg: number;
  parapet: FlatRoofParapet;
  setbacks: FlatRoofSetbacks;
  array: FlatRoofArrayConfiguration;
  surfaceAlbedo: number;
}

interface SiteProfileBase {
  schemaVersion: typeof SITE_PROFILE_SCHEMA_VERSION;
  id: string;
  name: string;
  dataMode: DataMode;
  location: SiteLocation;
  pvConfiguration: PVConfiguration;
  simulationDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface LandAgrivoltaicSiteProfile extends SiteProfileBase {
  siteType: "land_agrivoltaic";
  siteGeometry: LandAgrivoltaicGeometry;
  cropConfiguration: { cropId: CropId };
}

export interface FlatRoofSiteProfile extends SiteProfileBase {
  siteType: "flat_roof";
  siteGeometry: FlatRoofGeometry;
  cropConfiguration?: never;
}

export type SiteProfile =
  | LandAgrivoltaicSiteProfile
  | FlatRoofSiteProfile;
