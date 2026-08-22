import type {
  ElectricalTelemetryProviderKind,
} from "../types";

import {
  SimulationInverterTelemetryProvider,
} from "./providers/simulationProvider";

import {
  UnsupportedInverterTelemetryProvider,
} from "./providers/unsupportedProvider";

import type {
  InverterTelemetryProvider,
} from "./types";

const providers:
  Record<
    ElectricalTelemetryProviderKind,
    InverterTelemetryProvider
  > =
  {
    simulation:
      new SimulationInverterTelemetryProvider(),

    modbus_tcp:
      new UnsupportedInverterTelemetryProvider(
        "modbus_tcp",
        "Modbus TCP inverter provider",
      ),

    modbus_rtu:
      new UnsupportedInverterTelemetryProvider(
        "modbus_rtu",
        "Modbus RTU inverter provider",
      ),

    mqtt:
      new UnsupportedInverterTelemetryProvider(
        "mqtt",
        "MQTT inverter provider",
      ),

    rest:
      new UnsupportedInverterTelemetryProvider(
        "rest",
        "REST inverter provider",
      ),

    manual:
      new UnsupportedInverterTelemetryProvider(
        "manual",
        "Manual inverter provider",
      ),
  };

export function getInverterTelemetryProvider(
  kind:
    ElectricalTelemetryProviderKind,
): InverterTelemetryProvider {
  return providers[
    kind
  ];
}
