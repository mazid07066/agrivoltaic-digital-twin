import {
  describe,
  expect,
  it,
} from "vitest";

import {
  getPVModuleProfile,
  PV_MODULE_PROFILES,
} from "../moduleProfiles";

import {
  toPVModuleProfile,
  validatePVModuleInput,
} from "../moduleCatalogueInput";

describe(
  "PV module catalogue input",
  () => {
    const cs1u420 = {
      manufacturer:
        "Canadian Solar",

      series:
        "HiDM CS1U-MS",

      model:
        "CS1U-420MS",

      cellTechnology:
        "Mono PERC",

      cellType:
        "Monocrystalline",

      moduleType:
        "Monofacial",

      pmaxW:
        420,

      efficiencyPercent:
        20.37,

      vocV:
        53.8,

      vmppV:
        44.9,

      iscA:
        9.8,

      imppA:
        9.37,

      noctC:
        43,

      tempCoeffPmaxPercentPerC:
        -0.37,

      tempCoeffVocPercentPerC:
        -0.29,

      tempCoeffIscPercentPerC:
        0.05,

      lengthM:
        2.078,

      widthM:
        0.992,

      thicknessMm:
        35,

      weightKg:
        23.4,

      maxSystemVoltage:
        "1500 V IEC / 1000 V IEC",

      fuseA:
        15,
    };

    it(
      "accepts the CS1U-420MS engineering data",
      () => {
        const result =
          validatePVModuleInput(
            cs1u420,
          );

        expect(
          result.valid,
        ).toBe(
          true,
        );

        expect(
          result.compatibility
            .pvPerformanceSimulation,
        ).toBe(
          true,
        );

        expect(
          result.compatibility
            .inverterStringAnalysis,
        ).toBe(
          true,
        );
      },
    );

    it(
      "checks STC electrical consistency",
      () => {
        const expectedPower =
          cs1u420.vmppV *
          cs1u420.imppA;

        expect(
          expectedPower,
        ).toBeCloseTo(
          420.7,
          1,
        );
      },
    );

    it(
      "rejects impossible Voc and Vmpp ordering",
      () => {
        const result =
          validatePVModuleInput({
            ...cs1u420,

            vocV:
              40,
          });

        expect(
          result.valid,
        ).toBe(
          false,
        );
      },
    );

    it(
      "reports incomplete inverter compatibility without inventing electrical values",
      () => {
        const result =
          validatePVModuleInput({
            ...cs1u420,

            vmppV:
              null,

            imppA:
              null,
          });

        expect(
          result.compatibility
            .inverterStringAnalysis,
        ).toBe(
          false,
        );
      },
    );

    it(
      "converts validated input into the existing runtime profile",
      () => {
        const profile =
          toPVModuleProfile(
            cs1u420,
          );

        expect(
          profile.model,
        ).toBe(
          "CS1U-420MS",
        );

        expect(
          profile.pmaxW,
        ).toBe(
          420,
        );
      },
    );

    it(
      "includes CS1U-420MS in the built-in catalogue",
      () => {
        const profile =
          getPVModuleProfile(
            "canadian-solar-cs1u-420ms",
          );

        expect(
          profile.model,
        ).toBe(
          "CS1U-420MS",
        );

        expect(
          profile.vmppV,
        ).toBe(
          44.9,
        );

        expect(
          profile.imppA,
        ).toBe(
          9.37,
        );
      },
    );

    it(
      "keeps catalogue IDs unique",
      () => {
        const ids =
          PV_MODULE_PROFILES.map(
            (
              profile,
            ) =>
              profile.id,
          );

        expect(
          new Set(
            ids,
          ).size,
        ).toBe(
          ids.length,
        );
      },
    );
  },
);
