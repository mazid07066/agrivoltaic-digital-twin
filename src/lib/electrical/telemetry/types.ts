import type {
  ElectricalTelemetryProviderKind,
} from "../types";

import type {
  ElectricalValueProvenance,
  InverterAlarm,
  InverterOperatingState,
} from "../inverter/types";

/**
 * Phase 9E canonical inverter telemetry.
 *
 * Future hardware/protocol integrations must normalize
 * their provider-specific data into this shape.
 *
 * Scientific inverter calculations remain independent
 * from Modbus, MQTT, REST and other transport protocols.
 */
export interface CanonicalInverterTelemetry {
  schema:
    "agritwin-inverter-telemetry-v1";

  timestamp:
    string;

  provider:
    ElectricalTelemetryProviderKind;

  inverterId:
    string;

  state:
    InverterOperatingState;

  dc: {
    availablePowerKw:
      number | null;

    acceptedPowerKw:
      number | null;

    voltageV:
      number | null;

    currentA:
      number | null;
  };

  ac: {
    activePowerKw:
      number | null;

    reactivePowerKvar:
      number | null;

    apparentPowerKva:
      number | null;

    powerFactor:
      number | null;

    lineNeutralVoltageV:
      number | null;

    lineLineVoltageV:
      number | null;

    currentA:
      number | null;

    frequencyHz:
      number | null;

    thdPercent:
      number | null;
  };

  mppts: Array<{
    mpptIndex:
      number;

    voltageV:
      number | null;

    currentA:
      number | null;

    powerKw:
      number | null;

    strings:
      Array<{
        stringIndex:
          number;

        currentA:
          number | null;

        powerKw:
          number | null;
      }>;
  }>;

  alarms:
    InverterAlarm[];

  provenance: {
    provider:
      ElectricalTelemetryProviderKind;

    source:
      ElectricalValueProvenance;

    note:
      string | null;
  };
}

export interface InverterTelemetryRequest {
  timestamp:
    string;

  pvPowerKw?:
    number;

  inverterId?:
    string;
}

export interface InverterTelemetryProvider {
  readonly kind:
    ElectricalTelemetryProviderKind;

  readonly name:
    string;

  read(
    request:
      InverterTelemetryRequest,
  ): Promise<
    CanonicalInverterTelemetry
  >;
}
