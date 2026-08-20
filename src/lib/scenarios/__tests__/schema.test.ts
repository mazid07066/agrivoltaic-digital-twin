import { describe, expect, it } from "vitest";

import {
  createScenarioSchema,
  policyConfigSchema,
  technicalConfigSchema,
} from "../schema";

describe("Phase 9A scenario schema", () => {
  it("accepts a valid agrivoltaic policy scenario", () => {
    const result = createScenarioSchema.safeParse({
      projectId:
        "11111111-1111-4111-8111-111111111111",

      siteId:
        "22222222-2222-4222-8222-222222222222",

      name: "Rice elevated PV policy scenario",

      technicalConfig: {
        panelHeightM: 4,
        rowSpacingM: 8,
        tiltDeg: 20,
        azimuthDeg: 180,
        gcr: 0.35,
        trackingMode: "reverse",
      },

      agriculturalConfig: {
        cropId: "rice",
        minimumCropRetention: 0.8,
      },

      weatherConfig: {
        source: "open_meteo",
        mode: "historical",
        year: 2025,
      },

      policyConfig: {
        minimumCropRetention: 0.8,
        maximumGcr: 0.4,
        minimumLer: 1.1,
      },
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.status).toBe("draft");

      expect(result.data.scenarioType).toBe(
        "agrivoltaic",
      );

      expect(result.data.isBaseline).toBe(false);
    }
  });

  it("rejects GCR greater than one", () => {
    const result = technicalConfigSchema.safeParse({
      gcr: 1.2,
    });

    expect(result.success).toBe(false);
  });

  it("rejects crop retention above 100 percent", () => {
    const result = policyConfigSchema.safeParse({
      minimumCropRetention: 1.2,
    });

    expect(result.success).toBe(false);
  });

  it("accepts a baseline scenario", () => {
    const result = createScenarioSchema.safeParse({
      projectId:
        "11111111-1111-4111-8111-111111111111",

      siteId:
        "22222222-2222-4222-8222-222222222222",

      name: "Conventional agriculture baseline",

      scenarioType: "agriculture_baseline",

      isBaseline: true,
    });

    expect(result.success).toBe(true);
  });
});
