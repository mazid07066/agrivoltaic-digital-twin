import {
  dispatchElectricalPower,
} from "./distribution/dispatch";

import type {
  ElectricalDispatchResult,
  ElectricalFeederDefinition,
} from "./distribution/types";

import {
  simulateInverterTimestep,
} from "./inverter/inverterModel";

import {
  createDemonstrationDcInput,
} from "./inverter/mppt";

import {
  PHASE_9E_DEMONSTRATION_INVERTER,
} from "./inverter/specification";

import type {
  InverterTimestepResult,
} from "./inverter/types";

export interface DemonstrationElectricalTimestep {
  inverter:
    InverterTimestepResult;

  distribution:
    ElectricalDispatchResult;
}

function demonstrationFeeders(
  timestamp:
    string,
): ElectricalFeederDefinition[] {
  return [
    {
      id: "demo-feeder-1",
      name: "Feeder 1",
      nominalVoltageV: 400,
      phases: 3,
      connectedLoadKw: 10,
      powerFactor: 1,
      priority: 1,
      enabled: true,
      loadProfile: [
        {
          timestamp,
          activePowerKw: 10,
          powerFactor: 1,
        },
      ],
    },
    {
      id: "demo-feeder-2",
      name: "Feeder 2",
      nominalVoltageV: 400,
      phases: 3,
      connectedLoadKw: 8,
      powerFactor: 1,
      priority: 2,
      enabled: true,
      loadProfile: [
        {
          timestamp,
          activePowerKw: 8,
          powerFactor: 1,
        },
      ],
    },
    {
      id: "demo-feeder-3",
      name: "Feeder 3",
      nominalVoltageV: 400,
      phases: 3,
      connectedLoadKw: 6,
      powerFactor: 1,
      priority: 3,
      enabled: true,
      loadProfile: [
        {
          timestamp,
          activePowerKw: 6,
          powerFactor: 1,
        },
      ],
    },
  ];
}

export function simulateDemonstrationElectricalTimestep({
  timestamp,
  pvPowerKw,
}: {
  timestamp: string;
  pvPowerKw: number;
}): DemonstrationElectricalTimestep {
  const availablePowerKw =
    Number.isFinite(pvPowerKw)
      ? Math.max(0, pvPowerKw)
      : 0;

  const dcInput =
    createDemonstrationDcInput(
      {
        availablePowerKw,
      },
      PHASE_9E_DEMONSTRATION_INVERTER,
    );

  const inverter =
    simulateInverterTimestep({
      timestamp,

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

      gridAvailable:
        true,

      timestepHours:
        1,
    });

  const distribution =
    dispatchElectricalPower({
      timestamp,

      operatingMode:
        "grid_connected",

      pvAcAvailableKw:
        inverter.ac
          .activePowerKw,

      feeders:
        demonstrationFeeders(
          timestamp,
        ),

      distributionLossKw:
        0,
    });

  return {
    inverter,
    distribution,
  };
}
