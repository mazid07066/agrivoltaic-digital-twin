import { describe, expect, it } from "vitest";
import fixture from "@/test/fixtures/phase7b-land-config.json";
import { migrateLegacyConfiguration, migratePersistedSiteState } from "../migrations";
import { toLandSimulationConfiguration } from "../adapters/landAgrivoltaic";
import type { SimulationConfiguration } from "@/types/simulation";

const legacy = fixture as SimulationConfiguration;

describe("Phase 8A legacy migration", () => {
  it("maps a Phase 7B configuration to a versioned land site", () => {
    const migrated = migrateLegacyConfiguration(legacy);
    expect(migrated.schemaVersion).toBe(1);
    expect(migrated.siteType).toBe("land_agrivoltaic");
    expect(migrated.dataMode).toBe("virtual");
    expect(toLandSimulationConfiguration(migrated)).toEqual(legacy);
  });

  it("accepts a legacy Zustand-style persisted state", () => {
    const migrated = migratePersistedSiteState({ state: { configuration: legacy } });
    expect(toLandSimulationConfiguration(migrated)).toEqual(legacy);
  });
});
