import {
  describe,
  expect,
  it,
} from "vitest";

import {
  simulateDemonstrationElectricalTimestep,
} from "../demonstration";

import {
  DEFAULT_INVERTER_PROFILE_ID,
  getInverterProfile,
} from "../inverter/catalogue";

describe(
  "demonstration electrical equipment metadata",
  () => {
    it(
      "preserves module count and selected inverter specification",
      () => {
        const specification =
          getInverterProfile(
            DEFAULT_INVERTER_PROFILE_ID,
          );

        const result =
          simulateDemonstrationElectricalTimestep({
            timestamp:
              "2026-08-22T12:00:00",

            pvPowerKw:
              42,

            moduleCount:
              169,

            inverterProfileId:
              specification.id,
          });

        expect(
          result.equipment,
        ).toMatchObject({
          moduleCount:
            169,

          inverterSpecificationId:
            specification.id,

          inverterName:
            specification.name,

          ratedActivePowerKw:
            specification.ac
              .ratedActivePowerW /
            1000,

          independentMpptInputs:
            specification.dc
              .independentMpptInputs,

          stringsPerMppt:
            specification.dc
              .stringsPerMppt,
        });
      },
    );

    it(
      "reports null when module count is unavailable",
      () => {
        const result =
          simulateDemonstrationElectricalTimestep({
            timestamp:
              "2026-08-22T00:00:00",

            pvPowerKw:
              0,
          });

        expect(
          result.equipment
            ?.moduleCount,
        ).toBeNull();
      },
    );
  },
);

describe(
  "designed demonstration integration",
  () => {
    it(
      "uses the accepted string design instead of rated voltage",
      () => {
        const result =
          simulateDemonstrationElectricalTimestep({
            timestamp:
              "2026-07-29T12:00:00",
            pvPowerKw: 20,
            moduleProfileId:
              "canadian-solar-inc-cs3w-420pb-ag",
            moduleCount: 60,
            modulesPerString: 15,
            stringsPerMppt: 1,
            inverterCount: 1,
            moduleTemperatureC: 71.4,
          });

        expect(
          result.equipment?.topologyMode,
        ).toBe("designed");

        expect(
          result.equipment?.totalStringCount,
        ).toBe(4);

        expect(
          result.equipment?.activeMpptCount,
        ).toBe(4);

        expect(
          result.inverter.dcInput
            .voltageV.value,
        ).not.toBe(670);

        expect(
          result.inverter.dcInput
            .voltageV.provenance,
        ).toBe("calculated");

        expect(
          result.inverter.dcInput.mppts.filter(
            (mppt) =>
              mppt.strings.length === 0,
          ),
        ).toHaveLength(2);

        const allocatedPower =
          result.inverter.dcInput.mppts.reduce(
            (sum, mppt) =>
              sum +
              (mppt.powerKw.value ?? 0),
            0,
          );

        expect(allocatedPower).toBeCloseTo(
          20,
          10,
        );
      },
    );

    it(
      "scales plant limits and MPPT channels for two inverters",
      () => {
        const result =
          simulateDemonstrationElectricalTimestep({
            timestamp:
              "2026-07-29T12:00:00",
            pvPowerKw: 60,
            moduleProfileId:
              "canadian-solar-inc-cs3w-420pb-ag",
            moduleCount: 180,
            modulesPerString: 15,
            stringsPerMppt: 1,
            inverterCount: 2,
            moduleTemperatureC: 45,
          });

        expect(
          result.equipment?.topologyMode,
        ).toBe("designed");

        expect(
          result.equipment?.inverterCount,
        ).toBe(2);

        expect(
          result.equipment?.ratedActivePowerKw,
        ).toBe(100);

        expect(
          result.inverter.dcInput.mppts,
        ).toHaveLength(12);
      },
    );
  },
);

