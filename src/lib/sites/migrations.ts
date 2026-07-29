import type { SimulationConfiguration } from "@/types/simulation";
import { createDefaultLandSiteProfile } from "./defaults";
import type { LandAgrivoltaicSiteProfile, SiteProfile } from "./schema";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isSiteProfile(value: unknown): value is SiteProfile {
  if (!isRecord(value)) return false;
  return value.schemaVersion === 1 && value.siteType === "land_agrivoltaic";
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
    cropConfiguration: { cropId: configuration.cropId },
    simulationDate: configuration.simulationDate,
    createdAt: now,
    updatedAt: now,
  };
}

export function migratePersistedSiteState(persisted: unknown): SiteProfile {
  if (isSiteProfile(persisted)) return persisted;

  if (isRecord(persisted)) {
    const possibleSite = persisted.activeSite ?? persisted.siteProfile;
    if (isSiteProfile(possibleSite)) return possibleSite;

    const possibleConfiguration = persisted.configuration;
    if (isRecord(possibleConfiguration)) {
      return migrateLegacyConfiguration(possibleConfiguration as unknown as SimulationConfiguration);
    }

    const nestedState = persisted.state;
    if (isRecord(nestedState)) {
      return migratePersistedSiteState(nestedState);
    }
  }

  return createDefaultLandSiteProfile();
}
