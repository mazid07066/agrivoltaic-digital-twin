import {
  describe,
  expect,
  it,
} from "vitest";

import {
  DEFAULT_INVERTER_PROFILE_ID,
  getInverterProfile,
} from "@/lib/electrical/inverter/catalogue";

import {
  getPVModuleProfile,
} from "@/lib/pv/moduleProfiles";

import {
  createDefaultLandSiteProfile,
} from "@/lib/sites/defaults";

import {
  calculateLandModelTransparency,
} from "../land";

describe(
  "Land scientific model transparency",
  () => {
    it(
      "reports capacity, topology and physical overflow",
      () => {
        const defaultSite =
          createDefaultLandSiteProfile(
            "2025-01-01",
          );

        const site = {
          ...defaultSite,

          siteGeometry: {
            ...defaultSite.siteGeometry,
            fieldLengthM: 44,
            fieldWidthM: 20,
          },

          pvConfiguration: {
            ...defaultSite.pvConfiguration,
            numberOfRows: 21,
            modulesPerRow: 17,
            modulePower: 420,
            moduleWidth: 0.992,
            moduleLength: 2.078,
            inverterCount: 3,
            modulesPerString: 17,
            stringsPerInverter: 7,
            stringsPerMppt: 2,
          },
        };

        const result =
          calculateLandModelTransparency({
            site,
            module:
              getPVModuleProfile(
                defaultSite
                  .pvConfiguration
                  .moduleProfileId,
              ),
            inverter:
              getInverterProfile(
                DEFAULT_INVERTER_PROFILE_ID,
              ),
          });

        expect(
          result.moduleCount,
        ).toBe(357);

        expect(
          result.installedCapacityKw,
        ).toBeCloseTo(
          149.94,
        );

        expect(
          result.configuredAcCapacityKw,
        ).toBeCloseTo(
          150,
        );

        expect(
          result.totalConfiguredStrings,
        ).toBe(21);

        expect(
          result.requiredModules,
        ).toBe(357);

        expect(
          result.moduleBalance,
        ).toBe(0);

        expect(
          result.footprint.requiredWidthM,
        ).toBeCloseTo(
          82.078,
        );

        expect(
          result.footprint.fitsField,
        ).toBe(false);

        expect(
          result.physicalModuleCoveragePercent,
        ).toBeGreaterThan(80);
      },
    );
  },
);
