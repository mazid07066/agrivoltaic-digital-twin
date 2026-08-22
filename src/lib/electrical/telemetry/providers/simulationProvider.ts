import {
  simulateDemonstrationElectricalTimestep,
} from "../../demonstration";

import type {
  CanonicalInverterTelemetry,
  InverterTelemetryProvider,
  InverterTelemetryRequest,
} from "../types";

export class SimulationInverterTelemetryProvider
  implements InverterTelemetryProvider
{
  readonly kind =
    "simulation" as const;

  readonly name =
    "AgriTwin Phase 9E Simulation Provider";

  async read(
    request:
      InverterTelemetryRequest,
  ): Promise<
    CanonicalInverterTelemetry
  > {
    const result =
      simulateDemonstrationElectricalTimestep({
        timestamp:
          request.timestamp,

        pvPowerKw:
          request.pvPowerKw ??
          0,
      });

    const inverter =
      result.inverter;

    return {
      schema:
        "agritwin-inverter-telemetry-v1",

      timestamp:
        request.timestamp,

      provider:
        "simulation",

      inverterId:
        request.inverterId ??
        "phase9e-demo-inverter-50kw",

      state:
        inverter.state,

      dc: {
        availablePowerKw:
          inverter.dcInput
            .availablePowerKw
            .value,

        acceptedPowerKw:
          inverter.dcOutput
            .acceptedPowerKw,

        voltageV:
          inverter.dcInput
            .voltageV
            .value,

        currentA:
          inverter.dcInput
            .currentA
            .value,
      },

      ac: {
        activePowerKw:
          inverter.ac
            .activePowerKw,

        reactivePowerKvar:
          inverter.ac
            .reactivePowerKvar,

        apparentPowerKva:
          inverter.ac
            .apparentPowerKva,

        powerFactor:
          inverter.ac
            .powerFactor,

        lineNeutralVoltageV:
          inverter.ac
            .lineNeutralVoltageV,

        lineLineVoltageV:
          inverter.ac
            .lineLineVoltageV,

        currentA:
          inverter.ac
            .lineCurrentA,

        frequencyHz:
          inverter.ac
            .frequencyHz,

        thdPercent:
          inverter.ac
            .thdPercent,
      },

      mppts:
        inverter.dcInput
          .mppts
          .map(
            (
              mppt,
            ) => ({
              mpptIndex:
                mppt.mpptIndex,

              voltageV:
                mppt.voltageV
                  .value,

              currentA:
                mppt.currentA
                  .value,

              powerKw:
                mppt.powerKw
                  .value,

              strings:
                mppt.strings.map(
                  (
                    string,
                  ) => ({
                    stringIndex:
                      string.stringIndex,

                    currentA:
                      string.currentA
                        .value,

                    powerKw:
                      string.powerKw
                        .value,
                  }),
                ),
            }),
          ),

      alarms:
        structuredClone(
          inverter.alarms,
        ),

      provenance: {
        provider:
          "simulation",

        source:
          "calculated",

        note:
          "Phase 9E simulated inverter telemetry. DC voltage and MPPT/string values may contain explicitly documented demonstration assumptions.",
      },
    };
  }
}
