import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calibrateSingleDiodeParameters,
  calculateModuleOperatingPoint,
} from "@/lib/physics";

import {
  PV_MODULE_PROFILES,
} from "@/lib/pv/moduleProfiles";

const candidates =
  PV_MODULE_PROFILES.filter(
    (
      module,
    ): module is typeof module & {
      vocV: number;
      vmppV: number;
      iscA: number;
      imppA: number;
      tempCoeffVocPercentPerC: number;
      tempCoeffIscPercentPerC: number;
    } =>
      typeof module.vocV === "number" &&
      typeof module.vmppV === "number" &&
      typeof module.iscA === "number" &&
      typeof module.imppA === "number" &&
      typeof module.tempCoeffVocPercentPerC === "number" &&
      typeof module.tempCoeffIscPercentPerC === "number" &&
      Number.isFinite(module.tempCoeffPmaxPercentPerC),
  );

describe(
  "Phase 9N catalogue-wide single-diode calibration",
  () => {
    it(
      "has representative calibratable catalogue modules",
      () => {
        expect(
          candidates.length,
        ).toBeGreaterThanOrEqual(
          5,
        );
      },
    );

    it(
      "classifies failed scientific fits instead of silently accepting them",
      () => {
        const sampleCount =
          Math.min(
            12,
            candidates.length,
          );

        const indexes =
          Array.from(
            {
              length:
                sampleCount,
            },
            (
              _,
              index,
            ) =>
              Math.min(
                candidates.length - 1,
                Math.floor(
                  index *
                    (candidates.length - 1) /
                    Math.max(
                      sampleCount - 1,
                      1,
                    ),
                ),
              ),
          );

        const samples =
          [...new Set(indexes)].map(
            (index) =>
              candidates[index],
          );

        const results =
          samples.map(
            (module) => {
              const datasheet = {
                pmaxW:
                  module.pmaxW,

                vmppV:
                  module.vmppV,

                imppA:
                  module.imppA,

                vocV:
                  module.vocV,

                iscA:
                  module.iscA,

                tempCoeffPmaxPercentPerC:
                  module.tempCoeffPmaxPercentPerC,

                tempCoeffVocPercentPerC:
                  module.tempCoeffVocPercentPerC,

                tempCoeffIscPercentPerC:
                  module.tempCoeffIscPercentPerC,
              };

              const fit =
                calibrateSingleDiodeParameters(
                  datasheet,
                );

              const scientificPass =
                fit.converged &&
                fit.residuals.pmpRelative <= 0.02 &&
                fit.residuals.vmpRelative <= 0.02 &&
                fit.residuals.impRelative <= 0.02 &&
                fit.residuals.vocRelative <= 0.01 &&
                fit.residuals.iscRelative <= 0.01 &&
                fit.residuals.gammaPmaxAbsolutePercentPerC <=
                  0.05 &&
                fit.residuals.betaVocAbsolutePercentPerC <=
                  0.05;

              if (
                scientificPass
              ) {
                expect(
                  fit.status,
                ).not.toBe(
                  "FAIL",
                );

                const point =
                  calculateModuleOperatingPoint(
                    {
                      model:
                        "single_diode",

                      datasheet,

                      effectiveIrradianceWm2:
                        1000,

                      cellTemperatureC:
                        25,
                    },
                  );

                expect(
                  Number.isFinite(
                    point.pmpW,
                  ),
                ).toBe(
                  true,
                );
              } else {
                expect(
                  fit.status,
                ).toBe(
                  "FAIL",
                );

                expect(
                  () =>
                    calculateModuleOperatingPoint(
                      {
                        model:
                          "single_diode",

                        datasheet,

                        effectiveIrradianceWm2:
                          1000,

                        cellTemperatureC:
                          25,
                      },
                    ),
                ).toThrow(
                  /scientific validation/i,
                );
              }

              return {
                manufacturer:
                  module.manufacturer,

                model:
                  module.model,

                status:
                  fit.status,

                iterations:
                  fit.iterations,

                pmpErrorPct:
                  (
                    fit.residuals.pmpRelative *
                    100
                  ).toFixed(
                    3,
                  ),

                gammaError:
                  fit.residuals.gammaPmaxAbsolutePercentPerC.toFixed(
                    4,
                  ),

                betaError:
                  fit.residuals.betaVocAbsolutePercentPerC.toFixed(
                    4,
                  ),
              };
            },
          );

        console.table(
          results,
        );

        expect(
          results.length,
        ).toBeGreaterThanOrEqual(
          5,
        );
      },
      30_000,
    );
  },
);
