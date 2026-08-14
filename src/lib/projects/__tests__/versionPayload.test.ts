import { describe, expect, it } from "vitest";

import { createDefaultFlatRoofSiteProfile } from "@/lib/sites/defaults";

import {
  parseSiteVersionHistory,
  parseSiteVersionOperationResult,
} from "../versionPayload";

describe("Phase 8C-3A version payloads", () => {
  it("parses a complete version-operation result", () => {
    const siteProfile = createDefaultFlatRoofSiteProfile();
    const result = parseSiteVersionOperationResult({
      projectId: "project-1",
      siteId: "site-1",
      siteVersionId: "version-2",
      siteProfile,
      activeVersionId: "version-2",
      activeVersionNumber: 2,
      configurationHash: "abc123",
      changeSummary: "Changed the roof length.",
      createdAt: "2026-08-14T10:00:00.000Z",
    });

    expect(result.activeVersionNumber).toBe(2);
    expect(result.siteProfile).toEqual(siteProfile);
    expect(result.siteProfile).not.toBe(siteProfile);
  });

  it("rejects malformed SiteProfile data", () => {
    expect(() =>
      parseSiteVersionOperationResult({
        projectId: "project-1",
        siteId: "site-1",
        siteVersionId: "version-2",
        siteProfile: { siteType: "flat_roof" },
        activeVersionId: "version-2",
        activeVersionNumber: 2,
        configurationHash: "abc123",
        changeSummary: "Changed the roof length.",
        createdAt: "2026-08-14T10:00:00.000Z",
      }),
    ).toThrow(/SiteProfile/);
  });

  it("parses version history and maps database field names", () => {
    expect(
      parseSiteVersionHistory([
        {
          version_id: "version-2",
          site_id: "site-1",
          version_number: 2,
          schema_version: 1,
          configuration_hash: "abc123",
          change_summary: "Changed the roof length.",
          created_by: "user-1",
          creator_display_name: "AgriTwin User",
          created_at: "2026-08-14T10:00:00.000Z",
          is_active: true,
        },
      ]),
    ).toEqual([
      {
        versionId: "version-2",
        siteId: "site-1",
        versionNumber: 2,
        schemaVersion: 1,
        configurationHash: "abc123",
        changeSummary: "Changed the roof length.",
        createdBy: "user-1",
        creatorDisplayName: "AgriTwin User",
        createdAt: "2026-08-14T10:00:00.000Z",
        isActive: true,
      },
    ]);
  });

  it("rejects malformed version-history entries", () => {
    expect(() =>
      parseSiteVersionHistory([{ version_id: "version-2" }]),
    ).toThrow();
  });
});
