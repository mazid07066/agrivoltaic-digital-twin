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

import {
  getPVModuleProfile,
} from "@/lib/pv/moduleProfiles";

const inverter =
  getInverterProfile(
    "sma-sunny-tripower-core1-stp50-40",
  );

const pvModule =
  getPVModuleProfile(
    "jinko-solar-jkm-540-560m",
  );

function assess(moduleCount: number) {
  return assessPVInverterCompatibility({
    module: pvModule,
    inverter,
    moduleCount,
    modulesPerString: 17,
    stringsPerInverter: 7,
    stringsPerMppt: 2,
    minimumDesignTemperatureC: 5,
    maximumDesignCellTemperatureC: 71.4,
    bifacialCurrentFactor: 1,
    inverterCount: 1,
  });
}

describe(
  "chosen compatibility topology",
  () => {
    it(
      "uses seven explicit strings rather than inferring them",
      () => {
        const report =
          assess(136);

        expect(
          report.calculations.totalStringCount,
        ).toBe(7);

        expect(
          report.checks.find(
            (check) =>
              check.id ===
              "module-allocation",
          )?.status,
        ).toBe("WARNING");
      },
    );

    it(
      "passes exact module allocation",
      () => {
        const report =
          assess(119);

        expect(
          report.calculations.totalStringCount,
        ).toBe(7);

        expect(
          report.checks.find(
            (check) =>
              check.id ===
              "module-allocation",
          )?.status,
        ).toBe("PASS");
      },
    );

    it(
      "separates installed capacity from a repeated multi-inverter design",
      () => {
        const report =
          assessPVInverterCompatibility({
            module: pvModule,
            inverter,
            moduleCount: 119,
            modulesPerString: 17,
            stringsPerInverter: 7,
            stringsPerMppt: 2,
            minimumDesignTemperatureC: 5,
            maximumDesignCellTemperatureC: 71.4,
            bifacialCurrentFactor: 1,
            inverterCount: 3,
          });

        expect(
          report.calculations.totalStringCount,
        ).toBe(21);

        expect(
          report.calculations.requiredModuleCount,
        ).toBe(357);

        expect(
          report.calculations.moduleShortfall,
        ).toBe(238);

        expect(
          report.calculations.totalArrayPowerW,
        ).toBe(
          119 *
            pvModule.pmaxW,
        );

        expect(
          report.calculations.configuredArrayPowerW,
        ).toBe(
          357 *
            pvModule.pmaxW,
        );

        expect(
          report.calculations.inverterLoadingRatio,
        ).toBeCloseTo(
          (
            357 *
            pvModule.pmaxW
          ) /
            (
              3 *
              inverter.ac.ratedActivePowerW
            ),
        );

        expect(
          report.checks.find(
            (check) =>
              check.id ===
              "module-allocation",
          )?.status,
        ).toBe("FAIL");
      },
    );

    it(
      "fails when installed modules cannot form the chosen topology",
      () => {
        const report =
          assess(118);

        expect(
          report.checks.find(
            (check) =>
              check.id ===
              "module-allocation",
          )?.status,
        ).toBe("FAIL");

        expect(report.status).toBe("FAIL");
      },
    );
  },
);
