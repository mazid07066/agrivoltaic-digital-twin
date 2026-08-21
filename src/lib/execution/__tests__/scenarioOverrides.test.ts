import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createDefaultLandSiteProfile,
} from "@/lib/sites/defaults";

import type {
  Scenario,
} from "@/lib/scenarios/types";

import {
  applyLandScenarioOverrides,
} from "../scenarioOverrides";

function createScenario():
  Scenario {
  return {
    id:
      "scenario-1",

    projectId:
      "project-1",

    siteId:
      "site-1",

    name:
      "Scenario 1",

    description:
      null,

    scenarioType:
      "agrivoltaic",

    status:
      "draft",

    isBaseline:
      false,

    parentScenarioId:
      null,

    scenarioVersion:
      1,

    configuration:
      {},

    technicalConfig: {
      panelHeightM:
        4,

      rowSpacingM:
        6,

      tiltDeg:
        15,

      azimuthDeg:
        170,

      gcr:
        0.38,

      trackingMode:
        "fixed",
    },

    agriculturalConfig: {
      cropId:
        "rice",

      cropName:
        "Rice",

      minimumCropRetention:
        0.8,
    },

    weatherConfig:
      {},

    policyConfig:
      {},

    economicConfig:
      {},

    metadata:
      {},

    createdBy:
      null,

    createdAt:
      "2026-08-21T00:00:00.000Z",

    updatedAt:
      "2026-08-21T00:00:00.000Z",

    archivedAt:
      null,
  };
}

describe(
  "Phase 9D scenario execution overrides",
  () => {
    it(
      "applies scenario technical and agricultural overrides to engine-facing site fields",
      () => {
        const site =
          createDefaultLandSiteProfile();

        const scenario =
          createScenario();

        const result =
          applyLandScenarioOverrides(
            site,
            scenario,
          );

        expect(
          result
            .pvConfiguration
            .panelHeight,
        ).toBe(
          4,
        );

        expect(
          result
            .pvConfiguration
            .rowSpacing,
        ).toBe(
          6,
        );

        expect(
          result
            .pvConfiguration
            .tilt,
        ).toBe(
          15,
        );

        expect(
          result
            .pvConfiguration
            .azimuth,
        ).toBe(
          170,
        );

        expect(
          result
            .pvConfiguration
            .trackingMode,
        ).toBe(
          "fixed",
        );

        expect(
          result
            .cropConfiguration
            .cropId,
        ).toBe(
          "rice",
        );
      },
    );

    it(
      "does not mutate the immutable site version",
      () => {
        const site =
          createDefaultLandSiteProfile();

        const original =
          structuredClone(
            site,
          );

        applyLandScenarioOverrides(
          site,
          createScenario(),
        );

        expect(
          site,
        ).toEqual(
          original,
        );
      },
    );

    it(
      "inherits site values when scenario overrides are absent",
      () => {
        const site =
          createDefaultLandSiteProfile();

        const scenario =
          createScenario();

        scenario.technicalConfig =
          {};

        scenario.agriculturalConfig =
          {};

        const result =
          applyLandScenarioOverrides(
            site,
            scenario,
          );

        expect(
          result
            .pvConfiguration
            .panelHeight,
        ).toBe(
          site
            .pvConfiguration
            .panelHeight,
        );

        expect(
          result
            .pvConfiguration
            .rowSpacing,
        ).toBe(
          site
            .pvConfiguration
            .rowSpacing,
        );

        expect(
          result
            .pvConfiguration
            .tilt,
        ).toBe(
          site
            .pvConfiguration
            .tilt,
        );

        expect(
          result
            .pvConfiguration
            .azimuth,
        ).toBe(
          site
            .pvConfiguration
            .azimuth,
        );

        expect(
          result
            .pvConfiguration
            .trackingMode,
        ).toBe(
          site
            .pvConfiguration
            .trackingMode,
        );

        expect(
          result
            .cropConfiguration
            .cropId,
        ).toBe(
          site
            .cropConfiguration
            .cropId,
        );
      },
    );

    it(
      "rejects invalid physical overrides",
      () => {
        const site =
          createDefaultLandSiteProfile();

        const scenario =
          createScenario();

        scenario.technicalConfig = {
          ...scenario
            .technicalConfig,

          panelHeightM:
            -1,
        };

        expect(
          () =>
            applyLandScenarioOverrides(
              site,
              scenario,
            ),
        ).toThrow(
          /Panel height/,
        );

        scenario.technicalConfig = {
          ...createScenario()
            .technicalConfig,

          rowSpacingM:
            0,
        };

        expect(
          () =>
            applyLandScenarioOverrides(
              site,
              scenario,
            ),
        ).toThrow(
          /Row spacing/,
        );

        scenario.technicalConfig = {
          ...createScenario()
            .technicalConfig,

          tiltDeg:
            100,
        };

        expect(
          () =>
            applyLandScenarioOverrides(
              site,
              scenario,
            ),
        ).toThrow(
          /PV tilt/,
        );
      },
    );

    it(
      "does not treat scenario GCR as an independent geometry override",
      () => {
        const site =
          createDefaultLandSiteProfile();

        const originalSpacing =
          site
            .pvConfiguration
            .rowSpacing;

        const scenario =
          createScenario();

        scenario.technicalConfig = {
          gcr:
            0.25,
        };

        const result =
          applyLandScenarioOverrides(
            site,
            scenario,
          );

        expect(
          result
            .pvConfiguration
            .rowSpacing,
        ).toBe(
          originalSpacing,
        );
      },
    );
  },
);
