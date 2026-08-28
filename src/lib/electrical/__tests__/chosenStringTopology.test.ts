import {
  describe,
  expect,
  it,
} from "vitest";

import {
  simulateDemonstrationElectricalTimestep,
} from "../demonstration";

const inverterProfileId =
  "sma-sunny-tripower-core1-stp50-40";

const moduleProfileId =
  "jinko-solar-jkm-540-560m";

describe(
  "chosen strings-per-inverter topology",
  () => {
    it(
      "preserves seven strings of seventeen modules on one inverter",
      () => {
        const result =
          simulateDemonstrationElectricalTimestep({
            timestamp:
              "2026-08-23T12:00:00",
            pvPowerKw: 42,
            inverterProfileId,
            moduleProfileId,
            moduleCount: 119,
            modulesPerString: 17,
            stringsPerInverter: 7,
            stringsPerMppt: 2,
            inverterCount: 1,
            moduleTemperatureC: 45,
          });

        expect(
          result.equipment?.topologyMode,
        ).toBe("designed");

        expect(
          result.equipment?.totalStringCount,
        ).toBe(7);

        expect(
          result.equipment?.assignedModuleCount,
        ).toBe(119);

        expect(
          result.inverter.dcInput.mppts.map(
            (mppt) => mppt.strings.length,
          ),
        ).toEqual([
          2,
          1,
          1,
          1,
          1,
          1,
        ]);
      },
    );

    it(
      "repeats the chosen allocation independently for each inverter",
      () => {
        const result =
          simulateDemonstrationElectricalTimestep({
            timestamp:
              "2026-08-23T12:00:00",
            pvPowerKw: 84,
            inverterProfileId,
            moduleProfileId,
            moduleCount: 238,
            modulesPerString: 17,
            stringsPerInverter: 7,
            stringsPerMppt: 2,
            inverterCount: 2,
            moduleTemperatureC: 45,
          });

        expect(
          result.equipment?.totalStringCount,
        ).toBe(14);

        expect(
          result.equipment?.assignedModuleCount,
        ).toBe(238);

        expect(
          result.inverter.dcInput.mppts.map(
            (mppt) => mppt.strings.length,
          ),
        ).toEqual([
          2,
          1,
          1,
          1,
          1,
          1,
          2,
          1,
          1,
          1,
          1,
          1,
        ]);
      },
    );

    it(
      "applies a valid explicit allocation instead of rebalancing it",
      () => {
        const result =
          simulateDemonstrationElectricalTimestep({
            timestamp:
              "2026-08-23T12:00:00",
            pvPowerKw: 42,
            inverterProfileId,
            moduleProfileId,
            moduleCount: 119,
            modulesPerString: 17,
            stringsPerInverter: 7,
            stringsPerMppt: 2,
            mpptStringAllocation: [
              1,
              1,
              1,
              1,
              1,
              2,
            ],
            inverterCount: 1,
            moduleTemperatureC: 45,
          });

        expect(
          result.inverter.dcInput.mppts.map(
            (mppt) => mppt.strings.length,
          ),
        ).toEqual([1, 1, 1, 1, 1, 2]);
      },
    );

    it(
      "does not apply a chosen topology without enough installed modules",
      () => {
        const result =
          simulateDemonstrationElectricalTimestep({
            timestamp:
              "2026-08-23T12:00:00",
            pvPowerKw: 40,
            inverterProfileId,
            moduleProfileId,
            moduleCount: 118,
            modulesPerString: 17,
            stringsPerInverter: 7,
            stringsPerMppt: 2,
            inverterCount: 1,
            moduleTemperatureC: 45,
          });

        expect(
          result.equipment?.topologyMode,
        ).toBe("demonstration");

        expect(
          result.equipment?.totalStringCount,
        ).toBeNull();
      },
    );
  },
);
