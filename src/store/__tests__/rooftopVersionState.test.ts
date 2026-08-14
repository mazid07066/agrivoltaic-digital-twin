import { beforeEach, describe, expect, it } from "vitest";

import { createDefaultFlatRoofSiteProfile, createDefaultLandSiteProfile } from "@/lib/sites/defaults";

import { useRooftopStore } from "../useRooftopStore";

describe("Phase 8C-3A rooftop version state", () => {
  beforeEach(() => {
    useRooftopStore.getState().reset();
  });

  it("loads database context as clean state", () => {
    const profile = createDefaultFlatRoofSiteProfile();

    useRooftopStore.getState().replaceActiveSite(profile, {
      databaseSiteId: "site-1",
      activeVersionId: "version-1",
      activeVersionNumber: 1,
      lastSavedHash: "hash-1",
    });

    const state = useRooftopStore.getState();
    expect(state.databaseSiteId).toBe("site-1");
    expect(state.activeVersionNumber).toBe(1);
    expect(state.isDirty).toBe(false);
  });

  it("marks meaningful rooftop edits dirty", () => {
    useRooftopStore.getState().updateGeometry({ roofLengthM: 40 });

    expect(useRooftopStore.getState().isDirty).toBe(true);
    expect(
      useRooftopStore.getState().activeSite.siteGeometry.roofLengthM,
    ).toBe(40);
  });

  it("does not mark selected-hour changes dirty", () => {
    useRooftopStore.getState().setSelectedHour(14);

    expect(useRooftopStore.getState().isDirty).toBe(false);
  });

  it("marks a successfully saved version clean", () => {
    const profile = createDefaultFlatRoofSiteProfile();
    useRooftopStore.getState().updateGeometry({ roofLengthM: 40 });

    useRooftopStore.getState().markSaved({
      projectId: "project-1",
      siteId: "site-1",
      siteVersionId: "version-2",
      siteProfile: profile,
      activeVersionId: "version-2",
      activeVersionNumber: 2,
      configurationHash: "hash-2",
      changeSummary: "Changed roof length.",
      createdAt: "2026-08-14T10:00:00.000Z",
    });

    const state = useRooftopStore.getState();
    expect(state.activeVersionId).toBe("version-2");
    expect(state.activeVersionNumber).toBe(2);
    expect(state.lastSavedHash).toBe("hash-2");
    expect(state.isDirty).toBe(false);
  });

  it("rejects land profiles", () => {
    expect(() =>
      useRooftopStore.getState().replaceActiveSite(
        createDefaultLandSiteProfile(),
      ),
    ).toThrow(/flat-roof/);
  });
});
