import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createDefaultFlatRoofSiteProfile,
  createDefaultLandSiteProfile,
} from "@/lib/sites/defaults";

import {
  createSimulationEngineIdentity,
  resolveSimulationEngineKind,
} from "../identity";

describe(
  "Phase 9C execution engine identity",
  () => {
    it(
      "routes land agrivoltaic sites to the land engine",
      () => {
        const site =
          createDefaultLandSiteProfile();

        expect(
          resolveSimulationEngineKind(
            site,
          ),
        ).toBe(
          "land",
        );

        expect(
          createSimulationEngineIdentity(
            site,
          ).engineVersion,
        ).toBe(
          "agritwin-land-phase7b",
        );
      },
    );

    it(
      "routes flat roofs to the rooftop engine",
      () => {
        const site =
          createDefaultFlatRoofSiteProfile();

        expect(
          resolveSimulationEngineKind(
            site,
          ),
        ).toBe(
          "rooftop",
        );

        expect(
          createSimulationEngineIdentity(
            site,
          ).engineVersion,
        ).toBe(
          "agritwin-rooftop-phase8c",
        );
      },
    );
  },
);
