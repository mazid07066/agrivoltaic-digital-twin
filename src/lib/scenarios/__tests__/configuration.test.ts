import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createScenarioConfigurationSnapshot,
} from "../configuration";

describe(
  "Phase 9A scenario configuration snapshot",
  () => {
    it(
      "creates a reproducible configuration snapshot",
      () => {
        const snapshot =
          createScenarioConfigurationSnapshot({
            technicalConfig: {
              panelHeightM: 4,
              rowSpacingM: 8,
              gcr: 0.35,
            },

            agriculturalConfig: {
              cropId: "rice",
            },

            weatherConfig: {
              source:
                "open_meteo",
              mode:
                "historical",
              year: 2025,
            },

            policyConfig: {
              minimumCropRetention:
                0.8,
              maximumGcr:
                0.4,
              minimumLer:
                1.1,
            },

            economicConfig: {
              currency:
                "BDT",
            },

            metadata: {
              studyName:
                "Policy Test",
            },
          });

        expect(
          snapshot.schemaVersion,
        ).toBe(1);

        expect(
          snapshot.technical
            .panelHeightM,
        ).toBe(4);

        expect(
          snapshot.agricultural
            .cropId,
        ).toBe("rice");

        expect(
          snapshot.weather.source,
        ).toBe("open_meteo");

        expect(
          snapshot.policy
            .minimumLer,
        ).toBe(1.1);

        expect(
          snapshot.economic
            .currency,
        ).toBe("BDT");
      },
    );
  },
);
