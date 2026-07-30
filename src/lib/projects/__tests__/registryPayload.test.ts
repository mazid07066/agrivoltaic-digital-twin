import { describe, expect, it } from "vitest";

import { createDefaultLandSiteProfile } from "@/lib/sites/defaults";

import {
  parseSiteOperationResult,
  parseWorkspaceSelection,
} from "../registryPayload";

describe("Phase 8B-2B registry payloads", () => {
  it("parses a complete site-operation result", () => {
    const siteProfile = createDefaultLandSiteProfile();

    const result = parseSiteOperationResult({
      projectId: "project-1",
      siteId: "site-1",
      siteVersionId: "version-1",
      siteProfile,
    });

    expect(result.projectId).toBe("project-1");
    expect(result.siteProfile).toEqual(siteProfile);
    expect(result.siteProfile).not.toBe(siteProfile);
  });

  it("rejects incomplete site-operation results", () => {
    expect(() =>
      parseSiteOperationResult({
        projectId: "project-1",
      }),
    ).toThrow();
  });

  it("parses a stored workspace selection", () => {
    expect(
      parseWorkspaceSelection({
        activeProjectId: "project-1",
        activeSiteId: "site-1",
      }),
    ).toEqual({
      activeProjectId: "project-1",
      activeSiteId: "site-1",
    });
  });

  it("returns an empty workspace for unsupported data", () => {
    expect(parseWorkspaceSelection(null)).toEqual({
      activeProjectId: null,
      activeSiteId: null,
    });
  });
});
