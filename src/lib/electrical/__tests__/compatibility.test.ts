import {
  describe,
  expect,
  it,
} from "vitest";

import {
  assessPVInverterCompatibility,
} from "../compatibility";

import {
  getInverterProfile,
} from "../inverter/catalogue";

import type {
  PVModuleProfile,
} from "@/lib/pv/moduleProfiles";

const moduleProfile: PVModuleProfile = {
  id: "test-module-550",
  manufacturer: "Test",
  series: "Engineering test",
  model: "TEST-550",
  cellTechnology: "Mono",
  cellType: "N-type",
  moduleType: "Bifacial",
  numberOfCells: 144,
  pmaxW: 550,
  efficiencyPercent: 21.3,
  vocV: 49.5,
  vmppV: 41.5,
  iscA: 14,
  imppA: 13.25,
  noctC: 45,
  tempCoeffPmaxPercentPerC: -0.35,
  tempCoeffVocPercentPerC: -0.25,
  tempCoeffIscPercentPerC: 0.05,
  lengthM: 2.278,
  widthM: 1.134,
  thicknessMm: 35,
  weightKg: 28,
  maxSystemVoltage: "1500 V",
  fuseA: 30,
  productWarranty: "Test only",
  linearWarranty: "Test only",
  source: "Synthetic unit-test fixture",
  sourceFile: "compatibility.test.ts",
};

const inverter =
  getInverterProfile(
    "sma-sunny-tripower-core1-stp50-40",
  );

describe(
  "PV module and inverter compatibility",
  () => {
    it(
      "passes a compatible explicit string design",
      () => {
        const report =
          assessPVInverterCompatibility({
            module: moduleProfile,
            inverter,
            moduleCount: 112,
            modulesPerString: 14,
            stringsPerMppt: 1,
            minimumDesignTemperatureC: -10,
            maximumDesignCellTemperatureC: 70,
            bifacialCurrentFactor: 1,
            inverterCount: 1,
          });

        expect(report.status).toBe("PASS");
        expect(
          report.calculations.stringVmppV,
        ).toBeCloseTo(581);
        expect(
          report.calculations.stringVocStcV,
        ).toBeCloseTo(693);
        expect(
          report.calculations.inverterLoadingRatio,
        ).toBeCloseTo(1.232);
        expect(
          report.checks.some(
            (check) => check.status === "FAIL",
          ),
        ).toBe(false);
      },
    );

    it(
      "fails excessive string voltage",
      () => {
        const report =
          assessPVInverterCompatibility({
            module: moduleProfile,
            inverter,
            moduleCount: 60,
            modulesPerString: 21,
            stringsPerMppt: 1,
            minimumDesignTemperatureC: -10,
          });

        expect(report.status).toBe("FAIL");
        expect(
          report.checks.find(
            (check) =>
              check.id === "string-voc-stc",
          )?.status,
        ).toBe("FAIL");
      },
    );

    it(
      "fails excessive MPPT operating current",
      () => {
        const report =
          assessPVInverterCompatibility({
            module: moduleProfile,
            inverter,
            moduleCount: 60,
            modulesPerString: 13,
            stringsPerMppt: 2,
            minimumDesignTemperatureC: -10,
          });

        expect(report.status).toBe("FAIL");
        expect(
          report.checks.find(
            (check) =>
              check.id === "mppt-impp",
          )?.status,
        ).toBe("FAIL");
      },
    );

    it(
      "does not invent cold-condition Voc",
      () => {
        const report =
          assessPVInverterCompatibility({
            module: moduleProfile,
            inverter,
            moduleCount: 60,
            modulesPerString: 13,
            stringsPerMppt: 1,
            minimumDesignTemperatureC: null,
          });

        const coldVoc =
          report.checks.find(
            (check) =>
              check.id === "string-voc-cold",
          );

        expect(coldVoc?.status).toBe(
          "NOT_EVALUATED",
        );
        expect(coldVoc?.message).toContain(
          "minimum design temperature not supplied",
        );
        expect(report.status).toBe("WARNING");
      },
    );

    it(
      "reports missing string design conservatively",
      () => {
        const report =
          assessPVInverterCompatibility({
            module: moduleProfile,
            inverter,
            moduleCount: 60,
            modulesPerString: null,
            stringsPerMppt: null,
            minimumDesignTemperatureC: null,
          });

        expect(report.status).toBe("WARNING");
        expect(
          report.checks.some(
            (check) =>
              check.status === "NOT_EVALUATED",
          ),
        ).toBe(true);
      },
    );

    it(
      "fails array generator-power and total-current limits",
      () => {
        const report =
          assessPVInverterCompatibility({
            module: moduleProfile,
            inverter,
            moduleCount: 140,
            modulesPerString: 13,
            stringsPerMppt: 1,
            minimumDesignTemperatureC: -10,
          });

        expect(
          report.checks.find(
            (check) =>
              check.id === "array-power",
          )?.status,
        ).toBe("FAIL");

        expect(
          report.checks.find(
            (check) =>
              check.id === "total-impp",
          )?.status,
        ).toBe("FAIL");
      },
    );
  },
);
