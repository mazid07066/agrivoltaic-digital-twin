import {
  describe,
  expect,
  it,
} from "vitest";

import fixture from "@/test/fixtures/phase7b-land-config.json";
import type {
  SimulationConfiguration,
} from "@/types/simulation";

import {
  toLandSimulationConfiguration,
} from "../adapters/landAgrivoltaic";
import {
  isLandAgrivoltaicSiteProfile,
  migrateLegacyConfiguration,
  migratePersistedSiteState,
} from "../migrations";

const legacy =
  fixture as SimulationConfiguration;

describe("Phase 8A legacy migration", () => {
  it(
    "maps a Phase 7B configuration to a versioned land site",
    () => {
      const migrated =
        migrateLegacyConfiguration(legacy);

      expect(migrated.schemaVersion).toBe(1);
      expect(migrated.siteType).toBe(
        "land_agrivoltaic",
      );
      expect(migrated.dataMode).toBe(
        "virtual",
      );

      expect(
        toLandSimulationConfiguration(
          migrated,
        ),
      ).toEqual(legacy);
    },
  );

  it(
    "accepts a legacy Zustand-style persisted state",
    () => {
      const migrated =
        migratePersistedSiteState({
          state: {
            configuration: legacy,
          },
        });

      expect(
        isLandAgrivoltaicSiteProfile(
          migrated,
        ),
      ).toBe(true);

      if (
        !isLandAgrivoltaicSiteProfile(
          migrated,
        )
      ) {
        throw new Error(
          "Legacy configuration did not migrate to a land site.",
        );
      }

      expect(
        toLandSimulationConfiguration(
          migrated,
        ),
      ).toEqual(legacy);
    },
  );

  it(
    "repairs an accidentally cleared legacy efficiency value",
    () => {
      const persisted =
        migrateLegacyConfiguration(legacy);

      persisted.pvConfiguration.systemEfficiency =
        0;

      const migrated =
        migratePersistedSiteState(persisted);

      expect(
        migrated.pvConfiguration.systemEfficiency,
      ).toBe(0.82);
    },
  );
});
