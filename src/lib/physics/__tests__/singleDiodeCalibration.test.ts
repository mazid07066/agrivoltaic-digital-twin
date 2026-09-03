import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateModuleOperatingPoint,
} from "@/lib/physics";

const CANADIAN_SOLAR_CS1U_420MS = {
  pmaxW: 420,
  vmppV: 44.9,
  imppA: 9.37,
  vocV: 53.8,
  iscA: 9.8,

  tempCoeffPmaxPercentPerC:
    -0.37,

  tempCoeffVocPercentPerC:
    -0.29,

  tempCoeffIscPercentPerC:
    0.05,
};

function relativeError(
  actual: number,
  expected: number,
): number {
  return (
    Math.abs(
      actual -
        expected,
    ) /
    Math.abs(
      expected,
    )
  );
}

describe(
  "Phase 9N single-diode datasheet calibration",
  () => {
    it(
      "reproduces the Canadian Solar CS1U-420MS manufacturer STC operating point",
      () => {
        const point =
          calculateModuleOperatingPoint(
            {
              model:
                "single_diode",

              datasheet:
                CANADIAN_SOLAR_CS1U_420MS,

              effectiveIrradianceWm2:
                1000,

              cellTemperatureC:
                25,

              includeCurve:
                true,
            },
          );

        /*
         * Phase 9N scientific acceptance gates.
         *
         * This test is intentionally expected to FAIL against
         * the superseded Phase 9L approximate parameter model.
         * It must pass only after the datasheet-calibrated
         * single-diode correction is implemented.
         */

        expect(
          relativeError(
            point.pmpW,
            CANADIAN_SOLAR_CS1U_420MS
              .pmaxW,
          ),
        ).toBeLessThanOrEqual(
          0.02,
        );

        expect(
          relativeError(
            point.vmpV,
            CANADIAN_SOLAR_CS1U_420MS
              .vmppV,
          ),
        ).toBeLessThanOrEqual(
          0.02,
        );

        expect(
          relativeError(
            point.impA,
            CANADIAN_SOLAR_CS1U_420MS
              .imppA,
          ),
        ).toBeLessThanOrEqual(
          0.02,
        );

        expect(
          relativeError(
            point.vocV,
            CANADIAN_SOLAR_CS1U_420MS
              .vocV,
          ),
        ).toBeLessThanOrEqual(
          0.01,
        );

        expect(
          relativeError(
            point.iscA,
            CANADIAN_SOLAR_CS1U_420MS
              .iscA,
          ),
        ).toBeLessThanOrEqual(
          0.01,
        );

        expect(
          point.ivCurve?.length,
        ).toBeGreaterThan(
          100,
        );
      },
    );
  },
);

describe(
  "Phase 9N manufacturer temperature-coefficient validation",
  () => {
    it(
      "reproduces CS1U-420MS gamma_Pmax within 0.05 percentage point per degree C",
      () => {
        const cool =
          calculateModuleOperatingPoint(
            {
              model:
                "single_diode",

              datasheet:
                CANADIAN_SOLAR_CS1U_420MS,

              effectiveIrradianceWm2:
                1000,

              cellTemperatureC:
                24,
            },
          );

        const stc =
          calculateModuleOperatingPoint(
            {
              model:
                "single_diode",

              datasheet:
                CANADIAN_SOLAR_CS1U_420MS,

              effectiveIrradianceWm2:
                1000,

              cellTemperatureC:
                25,
            },
          );

        const hot =
          calculateModuleOperatingPoint(
            {
              model:
                "single_diode",

              datasheet:
                CANADIAN_SOLAR_CS1U_420MS,

              effectiveIrradianceWm2:
                1000,

              cellTemperatureC:
                26,
            },
          );

        const modeledGamma =
          (
            (
              hot.pmpW -
              cool.pmpW
            ) /
            2
          ) /
          stc.pmpW *
          100;

        expect(
          Math.abs(
            modeledGamma -
              CANADIAN_SOLAR_CS1U_420MS
                .tempCoeffPmaxPercentPerC,
          ),
        ).toBeLessThanOrEqual(
          0.05,
        );
      },
    );

    it(
      "reproduces CS1U-420MS beta_Voc within 0.05 percentage point per degree C",
      () => {
        const cool =
          calculateModuleOperatingPoint(
            {
              model:
                "single_diode",

              datasheet:
                CANADIAN_SOLAR_CS1U_420MS,

              effectiveIrradianceWm2:
                1000,

              cellTemperatureC:
                24,
            },
          );

        const stc =
          calculateModuleOperatingPoint(
            {
              model:
                "single_diode",

              datasheet:
                CANADIAN_SOLAR_CS1U_420MS,

              effectiveIrradianceWm2:
                1000,

              cellTemperatureC:
                25,
            },
          );

        const hot =
          calculateModuleOperatingPoint(
            {
              model:
                "single_diode",

              datasheet:
                CANADIAN_SOLAR_CS1U_420MS,

              effectiveIrradianceWm2:
                1000,

              cellTemperatureC:
                26,
            },
          );

        const modeledBeta =
          (
            (
              hot.vocV -
              cool.vocV
            ) /
            2
          ) /
          stc.vocV *
          100;

        expect(
          Math.abs(
            modeledBeta -
              CANADIAN_SOLAR_CS1U_420MS
                .tempCoeffVocPercentPerC,
          ),
        ).toBeLessThanOrEqual(
          0.05,
        );
      },
    );
  },
);

describe(
  "Phase 9N original diagnostic 25C-to-65C regression",
  () => {
    it(
      "keeps CS1U-420MS long-range gamma within the original diagnostic acceptance band",
      () => {
        const p25 =
          calculateModuleOperatingPoint(
            {
              model:
                "single_diode",

              datasheet:
                CANADIAN_SOLAR_CS1U_420MS,

              effectiveIrradianceWm2:
                1000,

              cellTemperatureC:
                25,
            },
          );

        const p65 =
          calculateModuleOperatingPoint(
            {
              model:
                "single_diode",

              datasheet:
                CANADIAN_SOLAR_CS1U_420MS,

              effectiveIrradianceWm2:
                1000,

              cellTemperatureC:
                65,
            },
          );

        const gamma25to65 =
          (
            (
              p65.pmpW /
              p25.pmpW
            ) -
            1
          ) /
          40 *
          100;

        expect(
          gamma25to65,
        ).toBeGreaterThan(
          -0.45,
        );

        expect(
          gamma25to65,
        ).toBeLessThan(
          -0.29,
        );
      },
    );
  },
);
