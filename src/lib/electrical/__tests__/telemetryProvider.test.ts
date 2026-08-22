import {
  describe,
  expect,
  it,
} from "vitest";

import {
  getInverterTelemetryProvider,
} from "../telemetry";

describe(
  "Phase 9E inverter telemetry providers",
  () => {
    it(
      "resolves the simulation provider",
      () => {
        const provider =
          getInverterTelemetryProvider(
            "simulation",
          );

        expect(
          provider.kind,
        ).toBe(
          "simulation",
        );
      },
    );

    it(
      "normalizes simulated inverter output into canonical telemetry",
      async () => {
        const provider =
          getInverterTelemetryProvider(
            "simulation",
          );

        const telemetry =
          await provider.read({
            timestamp:
              "2026-08-20T12:00:00",

            pvPowerKw:
              40,
          });

        expect(
          telemetry.schema,
        ).toBe(
          "agritwin-inverter-telemetry-v1",
        );

        expect(
          telemetry.provider,
        ).toBe(
          "simulation",
        );

        expect(
          telemetry.ac
            .activePowerKw,
        ).toBeGreaterThan(
          0,
        );

        expect(
          telemetry.mppts,
        ).toHaveLength(
          6,
        );

        expect(
          telemetry.mppts
            .every(
              (
                mppt,
              ) =>
                mppt.strings
                  .length ===
                2,
            ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "preserves the explicit provider boundary for future Modbus TCP",
      async () => {
        const provider =
          getInverterTelemetryProvider(
            "modbus_tcp",
          );

        expect(
          provider.kind,
        ).toBe(
          "modbus_tcp",
        );

        await expect(
          provider.read({
            timestamp:
              "2026-08-20T12:00:00",
          }),
        ).rejects.toThrow(
          /not implemented/i,
        );
      },
    );

    it(
      "preserves future MQTT and REST provider boundaries",
      () => {
        expect(
          getInverterTelemetryProvider(
            "mqtt",
          ).kind,
        ).toBe(
          "mqtt",
        );

        expect(
          getInverterTelemetryProvider(
            "rest",
          ).kind,
        ).toBe(
          "rest",
        );
      },
    );

    it(
      "does not couple the scientific model to a hardware protocol",
      () => {
        const simulation =
          getInverterTelemetryProvider(
            "simulation",
          );

        expect(
          simulation.name,
        ).not.toMatch(
          /modbus|mqtt|rest/i,
        );
      },
    );
  },
);
