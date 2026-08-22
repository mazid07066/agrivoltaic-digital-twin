import {
  describe,
  expect,
  it,
} from "vitest";

import {
  simulateInverterTimestep,
} from "../inverter/inverterModel";

import {
  evaluateInverterDcLimits,
} from "../inverter/inverterLimits";

import {
  PHASE_9E_DEMONSTRATION_INVERTER,
} from "../inverter/specification";

import {
  lineCurrentFromThreePhasePower,
} from "../inverter/threePhase";

import type {
  InverterDcInput,
} from "../inverter/types";

function createDcInput(
  voltageV: number,
  powerKw = 30,
  currentA = 45,
): InverterDcInput {
  return {
    availablePowerKw: {
      value:
        powerKw,

      provenance:
        "calculated",
    },

    requestedPowerKw: {
      value:
        powerKw,

      provenance:
        "calculated",
    },

    voltageV: {
      value:
        voltageV,

      provenance:
        "assumed",

      note:
        "Phase 9E demonstration voltage.",
    },

    currentA: {
      value:
        currentA,

      provenance:
        "derived",
    },

    mppts:
      Array.from(
        {
          length:
            6,
        },
        (
          _,
          index,
        ) => ({
          mpptIndex:
            index + 1,

          voltageV: {
            value:
              voltageV,

            provenance:
              "demonstration_allocation",
          },

          currentA: {
            value:
              currentA / 6,

            provenance:
              "demonstration_allocation",
          },

          shortCircuitCurrentA: {
            value:
              null,

            provenance:
              "demonstration_allocation",
          },

          powerKw: {
            value:
              powerKw / 6,

            provenance:
              "demonstration_allocation",
          },

          strings:
            Array.from(
              {
                length:
                  2,
              },
              (
                __,
                stringIndex,
              ) => ({
                stringIndex:
                  stringIndex + 1,

                currentA: {
                  value:
                    currentA / 12,

                  provenance:
                    "demonstration_allocation",
                },

                shortCircuitCurrentA: {
                  value:
                    null,

                  provenance:
                    "demonstration_allocation",
                },

                powerKw: {
                  value:
                    powerKw / 12,

                  provenance:
                    "demonstration_allocation",
                },
              }),
            ),
        }),
      ),
  };
}

describe(
  "Phase 9E inverter limits",
  () => {
    it(
      "is OFF below 150 V",
      () => {
        const result =
          evaluateInverterDcLimits(
            createDcInput(
              149,
            ),
            PHASE_9E_DEMONSTRATION_INVERTER,
          );

        expect(
          result.state,
        ).toBe(
          "OFF",
        );
      },
    );

    it(
      "waits between minimum and start voltage",
      () => {
        const result =
          evaluateInverterDcLimits(
            createDcInput(
              170,
            ),
            PHASE_9E_DEMONSTRATION_INVERTER,
          );

        expect(
          result.state,
        ).toBe(
          "WAITING_FOR_START",
        );
      },
    );

    it(
      "may operate above start voltage while warning outside MPP range",
      () => {
        const result =
          evaluateInverterDcLimits(
            createDcInput(
              300,
            ),
            PHASE_9E_DEMONSTRATION_INVERTER,
          );

        expect(
          result.state,
        ).toBe(
          "MPPT_ACTIVE",
        );

        expect(
          result
            .withinNormalMpptVoltageRange,
        ).toBe(
          false,
        );
      },
    );

    it(
      "is in the normal MPP range at 670 V",
      () => {
        const result =
          evaluateInverterDcLimits(
            createDcInput(
              670,
            ),
            PHASE_9E_DEMONSTRATION_INVERTER,
          );

        expect(
          result.state,
        ).toBe(
          "MPPT_ACTIVE",
        );

        expect(
          result
            .withinNormalMpptVoltageRange,
        ).toBe(
          true,
        );
      },
    );

    it(
      "faults above 1000 V",
      () => {
        const result =
          evaluateInverterDcLimits(
            createDcInput(
              1001,
            ),
            PHASE_9E_DEMONSTRATION_INVERTER,
          );

        expect(
          result.state,
        ).toBe(
          "FAULT",
        );

        expect(
          result.dcOvervoltage,
        ).toBe(
          true,
        );
      },
    );
  },
);

describe(
  "Phase 9E three-phase calculations",
  () => {
    it(
      "calculates approximately 72.17 A at 50 kW, 400 V line-line and unity PF",
      () => {
        const current =
          lineCurrentFromThreePhasePower(
            50,
            400,
            1,
          );

        expect(
          current,
        ).toBeCloseTo(
          72.17,
          1,
        );

        expect(
          current,
        ).toBeLessThan(
          72.5,
        );
      },
    );
  },
);

describe(
  "Phase 9E inverter timestep",
  () => {
    it(
      "preserves legacy power without another efficiency multiplication",
      () => {
        const result =
          simulateInverterTimestep(
            {
              timestamp:
                "2026-08-20T12:00:00",

              dcInput:
                createDcInput(
                  670,
                  30,
                ),

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
          result.ac
            .activePowerKw,
        ).toBeCloseTo(
          30,
          8,
        );

        expect(
          result
            .conversionLossKw,
        ).toBe(
          0,
        );

        expect(
          result.efficiency
            .value,
        ).toBe(
          1,
        );
      },
    );

    it(
      "applies 98.1 percent only in explicit constant-efficiency mode",
      () => {
        const result =
          simulateInverterTimestep(
            {
              timestamp:
                "2026-08-20T12:00:00",

              dcInput:
                createDcInput(
                  670,
                  30,
                ),

              specification:
                PHASE_9E_DEMONSTRATION_INVERTER,

              efficiencyMode:
                "explicit_constant_efficiency",

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
          result.ac
            .activePowerKw,
        ).toBeCloseTo(
          29.43,
          2,
        );

        expect(
          result
            .conversionLossKw,
        ).toBeCloseTo(
          0.57,
          2,
        );
      },
    );

    it(
      "clips active power at 50 kW in unity-PF legacy mode",
      () => {
        const result =
          simulateInverterTimestep(
            {
              timestamp:
                "2026-08-20T12:00:00",

              dcInput:
                createDcInput(
                  670,
                  60,
                  89,
                ),

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
          result.ac
            .activePowerKw,
        ).toBeCloseTo(
          50,
          8,
        );

        expect(
          result.state,
        ).toBe(
          "CLIPPED",
        );

        expect(
          result
            .dcOutput
            .clippedPowerKw,
        ).toBeCloseTo(
          10,
          8,
        );

        expect(
          result.alarms.some(
            (alarm) =>
              alarm.code ===
              "CLIPPING",
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "enforces the 50 kVA apparent-power limit when PF is below unity",
      () => {
        const result =
          simulateInverterTimestep(
            {
              timestamp:
                "2026-08-20T12:00:00",

              dcInput:
                createDcInput(
                  670,
                  50,
                  75,
                ),

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
                0.8,
            },
          );

        expect(
          result.ac
            .activePowerKw,
        ).toBeCloseTo(
          40,
          8,
        );

        expect(
          result.ac
            .apparentPowerKva,
        ).toBeCloseTo(
          50,
          8,
        );

        expect(
          result.alarms.some(
            (alarm) =>
              alarm.code ===
              "APPARENT_POWER_LIMIT",
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "produces no AC power when start voltage has not been reached",
      () => {
        const result =
          simulateInverterTimestep(
            {
              timestamp:
                "2026-08-20T06:00:00",

              dcInput:
                createDcInput(
                  170,
                  10,
                ),

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
            },
          );

        expect(
          result.state,
        ).toBe(
          "WAITING_FOR_START",
        );

        expect(
          result.ac
            .activePowerKw,
        ).toBe(
          0,
        );
      },
    );

    it(
      "reports grid limitation when the grid is unavailable",
      () => {
        const result =
          simulateInverterTimestep(
            {
              timestamp:
                "2026-08-20T12:00:00",

              dcInput:
                createDcInput(
                  670,
                  20,
                ),

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

              gridAvailable:
                false,
            },
          );

        expect(
          result.state,
        ).toBe(
          "GRID_LIMITED",
        );

        expect(
          result.ac
            .activePowerKw,
        ).toBe(
          0,
        );

        expect(
          result.alarms.some(
            (alarm) =>
              alarm.code ===
              "GRID_UNAVAILABLE",
          ),
        ).toBe(
          true,
        );
      },
    );
  },
);
