import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createDefaultLandSiteProfile,
} from "@/lib/sites/defaults";

import {
  createPhase8AMigrationKey,
  createSiteProfileSnapshot,
  parseSiteProfileSnapshot,
} from "../siteSnapshot";

describe(
  "Phase 8B-2A site snapshots",
  () => {
    it(
      "creates a detached immutable-compatible snapshot",
      () => {
        const original =
          createDefaultLandSiteProfile();

        const snapshot =
          createSiteProfileSnapshot(
            original,
          );

        expect(snapshot).toEqual(original);
        expect(snapshot).not.toBe(original);
        expect(snapshot.location).not.toBe(
          original.location,
        );
        expect(
          snapshot.pvConfiguration,
        ).not.toBe(
          original.pvConfiguration,
        );
      },
    );

    it(
      "parses a stored SiteProfile snapshot",
      () => {
        const original =
          createDefaultLandSiteProfile();

        const parsed =
          parseSiteProfileSnapshot(
            JSON.parse(
              JSON.stringify(original),
            ),
          );

        expect(parsed).toEqual(original);
      },
    );

    it(
      "rejects unsupported stored data",
      () => {
        expect(() =>
          parseSiteProfileSnapshot({
            siteType: "flat_roof",
          }),
        ).toThrow();
      },
    );

    it(
      "generates a deterministic migration key",
      () => {
        const site =
          createDefaultLandSiteProfile();

        expect(
          createPhase8AMigrationKey(site),
        ).toBe(
          [
            "phase-8a-first-project",
            "schema-1",
            "land_agrivoltaic",
            site.id,
          ].join(":"),
        );
      },
    );
  },
);
