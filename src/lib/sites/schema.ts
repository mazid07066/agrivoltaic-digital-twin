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

export interface LandAgrivoltaicSiteProfile {
  schemaVersion: typeof SITE_PROFILE_SCHEMA_VERSION;
  id: string;
  name: string;
  siteType: "land_agrivoltaic";
  dataMode: DataMode;
  location: SiteLocation;
  siteGeometry: LandAgrivoltaicGeometry;
  pvConfiguration: PVConfiguration;
  cropConfiguration: { cropId: CropId };
  simulationDate: string;
  createdAt: string;
  updatedAt: string;
}

export type SiteProfile = LandAgrivoltaicSiteProfile;
