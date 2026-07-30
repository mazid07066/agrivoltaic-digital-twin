import { describe, expect, it } from "vitest";

import type { Database } from "../database.types";

type ProjectRow =
  Database["public"]["Tables"]["projects"]["Row"];

type SiteRow =
  Database["public"]["Tables"]["sites"]["Row"];

type SimulationRunRow =
  Database["public"]["Tables"]["simulation_runs"]["Row"];

describe("Phase 8B generated database types", () => {
  it("contains the expected project fields", () => {
    const project = {
      id: "00000000-0000-0000-0000-000000000001",
      owner_id: "00000000-0000-0000-0000-000000000002",
      name: "AgriTwin project",
      description: null,
      status: "active",
      schema_version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      archived_at: null,
    } satisfies ProjectRow;

    expect(project.status).toBe("active");
    expect(project.schema_version).toBe(1);
  });

  it("contains site type and data mode fields", () => {
    const siteType: SiteRow["site_type"] =
      "land_agrivoltaic";

    const dataMode: SiteRow["data_mode"] = "virtual";

    expect(siteType).toBe("land_agrivoltaic");
    expect(dataMode).toBe("virtual");
  });

  it("contains immutable simulation snapshot fields", () => {
    const inputSnapshot:
      SimulationRunRow["input_snapshot"] = {
        test: true,
      };

    expect(inputSnapshot).toEqual({
      test: true,
    });
  });
});
