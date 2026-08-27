import type { SimulationConfiguration } from "@/types/simulation";

import { createDefaultLandSiteProfile } from "./defaults";
import type {
  FlatRoofGeometry,
  FlatRoofSiteProfile,
  LandAgrivoltaicSiteProfile,
  SiteProfile,
} from "./schema";

type UnknownRecord = Record<string, unknown>;

const LEGACY_SYSTEM_EFFICIENCY_FALLBACK = 0.82;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function hasCommonSiteFields(
  value: UnknownRecord,
): boolean {
  return (
    value.schemaVersion === 1 &&
    typeof value.id === "string" &&
    Boolean(value.id.trim()) &&
    typeof value.name === "string" &&
    Boolean(value.name.trim()) &&
    ["virtual", "connected", "hybrid"].includes(
      String(value.dataMode),
    ) &&
    isRecord(value.location) &&
    isFiniteNumber(value.location.latitude) &&
    isFiniteNumber(value.location.longitude) &&
    typeof value.location.timezone === "string" &&
    isRecord(value.pvConfiguration) &&
    typeof value.simulationDate === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isFlatRoofGeometry(
  value: unknown,
): value is FlatRoofGeometry {
  if (!isRecord(value) || value.kind !== "flat_roof") {
    return false;
  }

  const parapet = value.parapet;
  const setbacks = value.setbacks;
  const array = value.array;

  return (
    isFiniteNumber(value.buildingHeightM) &&
    isFiniteNumber(value.roofLengthM) &&
    isFiniteNumber(value.roofWidthM) &&
    isFiniteNumber(value.roofAzimuthDeg) &&
    isFiniteNumber(value.roofSlopeDeg) &&
    isFiniteNumber(value.surfaceAlbedo) &&
    isRecord(parapet) &&
    typeof parapet.enabled === "boolean" &&
    isFiniteNumber(parapet.heightM) &&
    isFiniteNumber(parapet.widthM) &&
    isRecord(setbacks) &&
    isFiniteNumber(setbacks.northM) &&
    isFiniteNumber(setbacks.southM) &&
    isFiniteNumber(setbacks.eastM) &&
    isFiniteNumber(setbacks.westM) &&
    isRecord(array) &&
    isFiniteNumber(array.rackHeightM) &&
    isFiniteNumber(array.tiltDeg) &&
    isFiniteNumber(array.azimuthDeg) &&
    isFiniteNumber(array.rowSpacingM) &&
    ["portrait", "landscape"].includes(
      String(array.orientation),
    )
  );
}

export function isLandAgrivoltaicSiteProfile(
  value: unknown,
): value is LandAgrivoltaicSiteProfile {
  if (!isRecord(value) || !hasCommonSiteFields(value)) {
    return false;
  }

  return (
    value.siteType === "land_agrivoltaic" &&
    isRecord(value.siteGeometry) &&
    value.siteGeometry.kind === "land" &&
    isFiniteNumber(value.siteGeometry.fieldLengthM) &&
    isFiniteNumber(value.siteGeometry.fieldWidthM) &&
    isRecord(value.cropConfiguration) &&
    typeof value.cropConfiguration.cropId === "string"
  );
}

export function isFlatRoofSiteProfile(
  value: unknown,
): value is FlatRoofSiteProfile {
  if (!isRecord(value) || !hasCommonSiteFields(value)) {
    return false;
  }

  return (
    value.siteType === "flat_roof" &&
    isFlatRoofGeometry(value.siteGeometry)
  );
}

export function isSiteProfile(
  value: unknown,
): value is SiteProfile {
  return (
    isLandAgrivoltaicSiteProfile(value) ||
    isFlatRoofSiteProfile(value)
  );
}

function normalizeLegacySystemEfficiency(
  site: SiteProfile,
): SiteProfile {
  const systemEfficiency =
    site.pvConfiguration.systemEfficiency;

  if (
    isFiniteNumber(systemEfficiency) &&
    systemEfficiency > 0 &&
    systemEfficiency <= 1
  ) {
    return site;
  }

  return {
    ...site,
    pvConfiguration: {
      ...site.pvConfiguration,
      systemEfficiency:
        LEGACY_SYSTEM_EFFICIENCY_FALLBACK,
    },
  };
}

export function migrateLegacyConfiguration(
  configuration: SimulationConfiguration,
  id = "site-migrated-phase-7b",
): LandAgrivoltaicSiteProfile {
  const now = new Date().toISOString();

  return {
    schemaVersion: 1,
    id,
    name: configuration.site.name,
    siteType: "land_agrivoltaic",
    dataMode: "virtual",
    location: {
      latitude: configuration.site.latitude,
      longitude: configuration.site.longitude,
      timezone: configuration.site.timezone || "UTC",
    },
    siteGeometry: {
      kind: "land",
      fieldLengthM: configuration.site.fieldLength,
      fieldWidthM: configuration.site.fieldWidth,
    },
    pvConfiguration: { ...configuration.pv },
    cropConfiguration: {
      cropId: configuration.cropId,
    },
    simulationDate: configuration.simulationDate,
    createdAt: now,
    updatedAt: now,
  };
}

export function migratePersistedSiteState(
  persisted: unknown,
): SiteProfile {
  if (isSiteProfile(persisted)) {
    return normalizeLegacySystemEfficiency(
      persisted,
    );
  }

  if (isRecord(persisted)) {
    const possibleSite =
      persisted.activeSite ?? persisted.siteProfile;

    if (isSiteProfile(possibleSite)) {
      return normalizeLegacySystemEfficiency(
        possibleSite,
      );
    }

    const possibleConfiguration =
      persisted.configuration;

    if (isRecord(possibleConfiguration)) {
      return normalizeLegacySystemEfficiency(
        migrateLegacyConfiguration(
          possibleConfiguration as unknown as SimulationConfiguration,
        ),
      );
    }

    const nestedState = persisted.state;

    if (isRecord(nestedState)) {
      return migratePersistedSiteState(nestedState);
    }
  }

  return createDefaultLandSiteProfile();
}
