import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createDesignedDcInput,
} from "../inverter/mppt";

import {
  DEFAULT_INVERTER_PROFILE_ID,
  getInverterProfile,
} from "../inverter/catalogue";

import {
  getPVModuleProfile,
} from "@/lib/pv/moduleProfiles";

describe(
  "designed physical DC input",
  () => {
    const inverter =
      getInverterProfile(
        DEFAULT_INVERTER_PROFILE_ID,
      );

    const pvModule =
      getPVModuleProfile(
        "canadian-solar-inc-cs3w-420pb-ag",
      );

    it(
      "maps four complete strings to four of six MPPTs",
      () => {
        const result =
          createDesignedDcInput(
            {
              availablePowerKw: 20,
              moduleCount: 60,
              modulesPerString: 15,
              stringsPerMppt: 1,
              inverterCount: 1,
              moduleVmppV:
                pvModule.vmppV!,
              moduleTemperatureC: 71.4,
              voltageTemperatureCoefficientPercentPerC:
                pvModule
                  .tempCoeffVocPercentPerC!,
            },
            inverter,
          );

        const activeMppts =
          result.mppts.filter(
            (mppt) =>
              mppt.strings.length > 0,
          );

        const inactiveMppts =
          result.mppts.filter(
            (mppt) =>
              mppt.strings.length === 0,
          );

        expect(result.mppts).toHaveLength(6);
        expect(activeMppts).toHaveLength(4);
        expect(inactiveMppts).toHaveLength(2);

        expect(
          activeMppts.every(
            (mppt) =>
              mppt.strings.length === 1,
          ),
        ).toBe(true);

        expect(
          result.voltageV.value,
        ).toBeCloseTo(
          15 *
            pvModule.vmppV! *
            (
              1 +
              (
                pvModule
                  .tempCoeffVocPercentPerC! /
                100
              ) *
              (71.4 - 25)
            ),
          8,
        );
      },
    );

    it(
      "conserves allocated aggregate DC power",
      () => {
        const result =
          createDesignedDcInput(
            {
              availablePowerKw: 20,
              moduleCount: 60,
              modulesPerString: 15,
              stringsPerMppt: 1,
              inverterCount: 1,
              moduleVmppV:
                pvModule.vmppV!,
              moduleTemperatureC: 45,
              voltageTemperatureCoefficientPercentPerC:
                pvModule
                  .tempCoeffVocPercentPerC!,
            },
            inverter,
          );

        const mpptPower =
          result.mppts.reduce(
            (sum, mppt) =>
              sum +
              (mppt.powerKw.value ?? 0),
            0,
          );

        expect(mpptPower).toBeCloseTo(20, 10);
        expect(
          result.availablePowerKw.value,
        ).toBeCloseTo(20, 10);
      },
    );

    it(
      "rejects topology beyond plant string capacity",
      () => {
        expect(() =>
          createDesignedDcInput(
            {
              availablePowerKw: 50,
              moduleCount: 195,
              modulesPerString: 15,
              stringsPerMppt: 2,
              inverterCount: 1,
              moduleVmppV:
                pvModule.vmppV!,
              moduleTemperatureC: 45,
              voltageTemperatureCoefficientPercentPerC:
                pvModule
                  .tempCoeffVocPercentPerC!,
            },
            inverter,
          ),
        ).toThrow(
          /requires 13 strings/,
        );
      },
    );
  },
);
