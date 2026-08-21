import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createDefaultLandSiteProfile,
} from "@/lib/sites/defaults";

import {
  runLandAgrivoltaicSimulation,
} from "@/lib/sites/adapters/landAgrivoltaic";

import type {
  Scenario,
} from "@/lib/scenarios/types";

import {
  applyLandScenarioOverrides,
} from "../scenarioOverrides";

function scenario(
  overrides:
    Scenario["technicalConfig"],
): Scenario {
  return {
    id:
      "scenario-test",

    projectId:
      "project-test",

    siteId:
      "site-test",

    name:
      "Scientific effect test",

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

    technicalConfig:
      overrides,

    agriculturalConfig:
      {},

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
  "Phase 9D scenario scientific effects",
  () => {
    it(
      "changes PV output when tilt changes",
      () => {
        const site =
          createDefaultLandSiteProfile();

        const baselineSite =
          applyLandScenarioOverrides(
            site,
            scenario({
              tiltDeg:
                20,

              trackingMode:
                "fixed",
            }),
          );

        const alternativeSite =
          applyLandScenarioOverrides(
            site,
            scenario({
              tiltDeg:
                15,

              trackingMode:
                "fixed",
            }),
          );

        const baseline =
          runLandAgrivoltaicSimulation(
            baselineSite,
          );

        const alternative =
          runLandAgrivoltaicSimulation(
            alternativeSite,
          );

        expect(
          alternative.dailyEnergyKWh,
        ).not.toBe(
          baseline.dailyEnergyKWh,
        );
      },
    );

    it(
      "changes tracking behaviour when operating mode changes",
      () => {
        const site =
          createDefaultLandSiteProfile();

        const reverseSite =
          applyLandScenarioOverrides(
            site,
            scenario({
              trackingMode:
                "reverse",
            }),
          );

        const fixedSite =
          applyLandScenarioOverrides(
            site,
            scenario({
              trackingMode:
                "fixed",
            }),
          );

        const reverse =
          runLandAgrivoltaicSimulation(
            reverseSite,
          );

        const fixed =
          runLandAgrivoltaicSimulation(
            fixedSite,
          );

        const reverseAngles =
          reverse.hourly.map(
            (
              point,
            ) =>
              point.trackerAngle,
          );

        const fixedAngles =
          fixed.hourly.map(
            (
              point,
            ) =>
              point.trackerAngle,
          );

        expect(
          fixedAngles,
        ).not.toEqual(
          reverseAngles,
        );
      },
    );
  },
);
