import { parseSiteProfileSnapshot } from "@/lib/projects/siteSnapshot";
import type {
  SiteOperationResult,
  WorkspaceSelection,
} from "@/lib/projects/types";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(
  value: unknown,
  fieldName: string,
): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Registry response is missing ${fieldName}.`);
  }

  return value;
}

export function parseSiteOperationResult(
  value: unknown,
): SiteOperationResult {
  if (!isRecord(value)) {
    throw new Error("The site operation returned an invalid response.");
  }

  return {
    projectId: requiredString(value.projectId, "projectId"),
    siteId: requiredString(value.siteId, "siteId"),
    siteVersionId: requiredString(
      value.siteVersionId,
      "siteVersionId",
    ),
    siteProfile: parseSiteProfileSnapshot(value.siteProfile),
  };
}

export function parseWorkspaceSelection(
  value: unknown,
): WorkspaceSelection {
  if (!isRecord(value)) {
    return {
      activeProjectId: null,
      activeSiteId: null,
    };
  }

  return {
    activeProjectId:
      typeof value.activeProjectId === "string"
        ? value.activeProjectId
        : null,
    activeSiteId:
      typeof value.activeSiteId === "string"
        ? value.activeSiteId
        : null,
  };
}
