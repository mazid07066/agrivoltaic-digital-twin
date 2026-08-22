import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createDemonstrationDcInput,
} from "../inverter/mppt";

import {
  PHASE_9E_DEMONSTRATION_INVERTER,
} from "../inverter/specification";

describe(
  "Phase 9E MPPT demonstration allocation",
  () => {
    it(
      "creates six MPPT inputs with two strings each",
      () => {
        const result =
          createDemonstrationDcInput(
            {
              availablePowerKw:
                50,
            },
            PHASE_9E_DEMONSTRATION_INVERTER,
          );

        expect(
          result.mppts,
        ).toHaveLength(
          6,
        );

        for (
          const mppt
          of result.mppts
        ) {
          expect(
            mppt.strings,
          ).toHaveLength(
            2,
          );
        }
      },
    );

    it(
      "uses 670 V as the explicit default demonstration voltage",
      () => {
        const result =
          createDemonstrationDcInput(
            {
              availablePowerKw:
                50,
            },
            PHASE_9E_DEMONSTRATION_INVERTER,
          );

        expect(
          result.voltageV
            .value,
        ).toBe(
          670,
        );

        expect(
          result.voltageV
            .provenance,
        ).toBe(
          "assumed",
        );
      },
    );

    it(
      "derives total DC current from power and assumed voltage",
      () => {
        const result =
          createDemonstrationDcInput(
            {
              availablePowerKw:
                50,
            },
            PHASE_9E_DEMONSTRATION_INVERTER,
          );

        expect(
          result.currentA
            .value,
        ).toBeCloseTo(
          74.6269,
          3,
        );

        expect(
          result.currentA
            .provenance,
        ).toBe(
          "derived",
        );
      },
    );

    it(
      "allocates power equally across six MPPT inputs",
      () => {
        const result =
          createDemonstrationDcInput(
            {
              availablePowerKw:
                48,
            },
            PHASE_9E_DEMONSTRATION_INVERTER,
          );

        for (
          const mppt
          of result.mppts
        ) {
          expect(
            mppt.powerKw
              .value,
          ).toBeCloseTo(
            8,
            8,
          );
        }
      },
    );

    it(
      "allocates power equally across twelve strings",
      () => {
        const result =
          createDemonstrationDcInput(
            {
              availablePowerKw:
                48,
            },
            PHASE_9E_DEMONSTRATION_INVERTER,
          );

        const stringPowers =
          result.mppts
            .flatMap(
              (mppt) =>
                mppt.strings,
            )
            .map(
              (string) =>
                string.powerKw
                  .value,
            );

        expect(
          stringPowers,
        ).toHaveLength(
          12,
        );

        for (
          const power
          of stringPowers
        ) {
          expect(
            power,
          ).toBeCloseTo(
            4,
            8,
          );
        }
      },
    );

    it(
      "does not invent string or MPPT short-circuit current",
      () => {
        const result =
          createDemonstrationDcInput(
            {
              availablePowerKw:
                50,
            },
            PHASE_9E_DEMONSTRATION_INVERTER,
          );

        for (
          const mppt
          of result.mppts
        ) {
          expect(
            mppt
              .shortCircuitCurrentA
              .value,
          ).toBeNull();

          for (
            const string
            of mppt.strings
          ) {
            expect(
              string
                .shortCircuitCurrentA
                .value,
            ).toBeNull();
          }
        }
      },
    );

    it(
      "supports fewer active MPPT inputs while preserving six physical MPPT slots",
      () => {
        const result =
          createDemonstrationDcInput(
            {
              availablePowerKw:
                24,

              activeMpptCount:
                3,
            },
            PHASE_9E_DEMONSTRATION_INVERTER,
          );

        expect(
          result.mppts,
        ).toHaveLength(
          6,
        );

        expect(
          result.mppts[0]
            .powerKw
            .value,
        ).toBeCloseTo(
          8,
          8,
        );

        expect(
          result.mppts[2]
            .powerKw
            .value,
        ).toBeCloseTo(
          8,
          8,
        );

        expect(
          result.mppts[3]
            .powerKw
            .value,
        ).toBe(
          0,
        );

        expect(
          result.mppts[5]
            .voltageV
            .value,
        ).toBeNull();
      },
    );

    it(
      "bounds requested power by available PV power",
      () => {
        const result =
          createDemonstrationDcInput(
            {
              availablePowerKw:
                30,

              requestedPowerKw:
                40,
            },
            PHASE_9E_DEMONSTRATION_INVERTER,
          );

        expect(
          result
            .requestedPowerKw
            .value,
        ).toBe(
          30,
        );

        expect(
          result.currentA
            .value,
        ).toBeCloseTo(
          30_000 /
            670,
          8,
        );
      },
    );

    it(
      "produces zero current and power allocation at zero PV power",
      () => {
        const result =
          createDemonstrationDcInput(
            {
              availablePowerKw:
                0,
            },
            PHASE_9E_DEMONSTRATION_INVERTER,
          );

        expect(
          result.currentA
            .value,
        ).toBe(
          0,
        );

        expect(
          result.mppts.every(
            (mppt) =>
              mppt.powerKw
                .value ===
              0,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "rejects more than six active MPPT inputs",
      () => {
        expect(
          () =>
            createDemonstrationDcInput(
              {
                availablePowerKw:
                  30,

                activeMpptCount:
                  7,
              },
              PHASE_9E_DEMONSTRATION_INVERTER,
            ),
        ).toThrow(
          /between 1 and 6/,
        );
      },
    );
  },
);

import {
  simulateInverterTimestep,
} from "../inverter/inverterModel";

describe(
  "Phase 9E MPPT allocation to inverter model",
  () => {
    it(
      "feeds the allocated 50 kW DC input into the inverter model",
      () => {
        const dcInput =
          createDemonstrationDcInput(
            {
              availablePowerKw:
                50,
            },
            PHASE_9E_DEMONSTRATION_INVERTER,
          );

        const result =
          simulateInverterTimestep(
            {
              timestamp:
                "2026-08-20T12:00:00",

              dcInput,

              specification:
                PHASE_9E_DEMONSTRATION_INVERTER,

              efficiencyMode:
                "legacy_power_passthrough",

              lineNeutralVoltageV:
                230,

              lineLineVoltageV:
                400,

              frequencyHz:
                50,

              powerFactor:
                1,
            },
          );

        expect(
          result.state,
        ).toBe(
          "MPPT_ACTIVE",
        );

        expect(
          result
            .dcOutput
            .acceptedPowerKw,
        ).toBeCloseTo(
          50,
          8,
        );

        expect(
          result.ac
            .activePowerKw,
        ).toBeCloseTo(
          50,
          8,
        );

        expect(
          result.ac
            .lineCurrentA,
        ).toBeCloseTo(
          72.17,
          1,
        );
      },
    );
  },
);
