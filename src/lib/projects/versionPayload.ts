import { parseSiteProfileSnapshot } from "@/lib/projects/siteSnapshot";
import type {
  SiteVersionHistoryEntry,
  SiteVersionOperationResult,
} from "@/lib/projects/types";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Version response is missing ${fieldName}.`);
  }

  return value;
}

function requiredPositiveInteger(value: unknown, fieldName: string): number {
  if (!Number.isInteger(value) || (value as number) < 1) {
    throw new Error(`Version response has an invalid ${fieldName}.`);
  }

  return value as number;
}

function nullableString(value: unknown, fieldName: string): string | null {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`Version response has an invalid ${fieldName}.`);
  }

  return value;
}

export function parseSiteVersionOperationResult(
  value: unknown,
): SiteVersionOperationResult {
  if (!isRecord(value)) {
    throw new Error("The site-version operation returned an invalid response.");
  }

  return {
    projectId: requiredString(value.projectId, "projectId"),
    siteId: requiredString(value.siteId, "siteId"),
    siteVersionId: requiredString(value.siteVersionId, "siteVersionId"),
    siteProfile: parseSiteProfileSnapshot(value.siteProfile),
    activeVersionId: requiredString(value.activeVersionId, "activeVersionId"),
    activeVersionNumber: requiredPositiveInteger(
      value.activeVersionNumber,
      "activeVersionNumber",
    ),
    configurationHash: requiredString(
      value.configurationHash,
      "configurationHash",
    ),
    changeSummary: requiredString(value.changeSummary, "changeSummary"),
    createdAt: requiredString(value.createdAt, "createdAt"),
  };
}

export function parseSiteVersionHistory(
  value: unknown,
): SiteVersionHistoryEntry[] {
  if (!Array.isArray(value)) {
    throw new Error("The version-history operation returned an invalid response.");
  }

  return value.map((entry): SiteVersionHistoryEntry => {
    if (!isRecord(entry)) {
      throw new Error("Version history contains an invalid entry.");
    }

    if (typeof entry.is_active !== "boolean") {
      throw new Error("Version response has an invalid is_active.");
    }

    return {
      versionId: requiredString(entry.version_id, "version_id"),
      siteId: requiredString(entry.site_id, "site_id"),
      versionNumber: requiredPositiveInteger(
        entry.version_number,
        "version_number",
      ),
      schemaVersion: requiredPositiveInteger(
        entry.schema_version,
        "schema_version",
      ),
      configurationHash: nullableString(
        entry.configuration_hash,
        "configuration_hash",
      ),
      changeSummary: nullableString(entry.change_summary, "change_summary"),
      createdBy: nullableString(entry.created_by, "created_by"),
      creatorDisplayName: nullableString(
        entry.creator_display_name,
        "creator_display_name",
      ),
      createdAt: requiredString(entry.created_at, "created_at"),
      isActive: entry.is_active,
    };
  });
}
