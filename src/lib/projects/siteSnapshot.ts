import {
  isSiteProfile,
} from "@/lib/sites/migrations";
import type {
  SiteProfile,
} from "@/lib/sites/schema";

export function createSiteProfileSnapshot(
  siteProfile: SiteProfile,
): SiteProfile {
  /*
   * JSON serialization deliberately produces a detached,
   * mutation-safe scientific input snapshot.
   */
  const serialized = JSON.stringify(siteProfile);
  const parsed: unknown = JSON.parse(serialized);

  if (!isSiteProfile(parsed)) {
    throw new Error(
      "The site profile could not be converted into a valid snapshot.",
    );
  }

  return parsed;
}

export function parseSiteProfileSnapshot(
  value: unknown,
): SiteProfile {
  if (!isSiteProfile(value)) {
    throw new Error(
      "The stored site-version configuration is not a supported SiteProfile.",
    );
  }

  return createSiteProfileSnapshot(value);
}

export function createPhase8AMigrationKey(
  siteProfile: SiteProfile,
): string {
  return [
    "phase-8a-first-project",
    `schema-${siteProfile.schemaVersion}`,
    siteProfile.siteType,
    siteProfile.id,
  ].join(":");
}
