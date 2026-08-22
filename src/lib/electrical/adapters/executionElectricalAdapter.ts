import {
  dispatchElectricalPower,
} from "../distribution/dispatch";

import {
  summarizeElectricalDistribution,
} from "../distribution/summary";

import type {
  ElectricalFeederDefinition,
} from "../distribution/types";

import {
  simulateInverterTimestep,
} from "../inverter/inverterModel";

import {
  createDemonstrationDcInput,
} from "../inverter/mppt";

import {
  PHASE_9E_DEMONSTRATION_INVERTER,
} from "../inverter/specification";

import {
  summarizeInverterSimulation,
} from "../inverter/summary";

import type {
  ElectricalSimulationResult,
} from "../types";

import type {
  PVInverterCompatibilityReport,
} from "../compatibility";

import type {
  SimulationExecutionResult,
} from "@/lib/execution/types";

function createDemonstrationFeeders(
  result:
    SimulationExecutionResult,
): ElectricalFeederDefinition[] {
  const createProfile = (
    activePowerKw:
      number,
  ) =>
    result.hourly.map(
      (point) => ({
        timestamp:
          point.timestamp,

        activePowerKw,

        powerFactor:
          1,
      }),
    );

  /*
   * Phase 9E-5 demonstration loads.
   *
   * These are explicitly assumed virtual loads and are not
   * measurements from the land or rooftop site.
   *
   * Their purpose is to exercise:
   * - PV self-consumption
   * - grid import
   * - grid export
   * - feeder dispatch
   *
   * Future scenario-configured and measured load profiles
   * will replace these assumptions.
   */
  return [
    {
      id:
        "demo-feeder-1",

      name:
        "Demonstration Feeder 1",

      nominalVoltageV:
        400,

      phases:
        3,

      connectedLoadKw:
        10,

      powerFactor:
        1,

      priority:
        1,

      enabled:
        true,

      loadProfile:
        createProfile(
          10,
        ),
    },

    {
      id:
        "demo-feeder-2",

      name:
        "Demonstration Feeder 2",

      nominalVoltageV:
        400,

      phases:
        3,

      connectedLoadKw:
        8,

      powerFactor:
        1,

      priority:
        2,

      enabled:
        true,

      loadProfile:
        createProfile(
          8,
        ),
    },

    {
      id:
        "demo-feeder-3",

      name:
        "Demonstration Feeder 3",

      nominalVoltageV:
        400,

      phases:
        3,

      connectedLoadKw:
        6,

      powerFactor:
        1,

      priority:
        3,

      enabled:
        true,

      loadProfile:
        createProfile(
          6,
        ),
    },
  ];
}

export function createElectricalSimulationResult(
  result:
    SimulationExecutionResult,

  specification =
    PHASE_9E_DEMONSTRATION_INVERTER,

  compatibility?:
    PVInverterCompatibilityReport,
): ElectricalSimulationResult {
  const feeders =
    createDemonstrationFeeders(
      result,
    );

  const hourly =
    result.hourly.map(
      (point) => {
        const availablePowerKw =
          Math.max(
            0,
            point.pvPowerKw ??
              0,
          );

        const dcInput =
          createDemonstrationDcInput(
            {
              availablePowerKw,
            },
            specification,
          );

        const inverter =
          simulateInverterTimestep(
            {
              timestamp:
                point.timestamp,

              dcInput,

              specification:
                specification,

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
            },
          );

        const distribution =
          dispatchElectricalPower(
            {
              timestamp:
                point.timestamp,

              operatingMode:
                "grid_connected",

              pvAcAvailableKw:
                inverter.ac
                  .activePowerKw,

              feeders,

              distributionLossKw:
                0,
            },
          );

        return {
          hourIndex:
            point.hourIndex,

          timestamp:
            point.timestamp,

          inverter,

          distribution,
        };
      },
    );

  const inverterResults =
    hourly.map(
      (point) =>
        point.inverter,
    );

  const distributionResults =
    hourly.map(
      (point) =>
        point.distribution,
    );

  return {
    schema:
      "agritwin-electrical-result-v1",

    operatingMode:
      "grid_connected",

    provenance: {
      schema:
        "agritwin-electrical-provenance-v1",

      provider:
        "simulation",

      inverterSpecificationId:
        specification
          .id,

      ...(compatibility
        ? {
            pvModuleProfileId:
              compatibility
                .moduleProfileId,
          }
        : {}),

      inverterModelVersion:
        "phase-9e-2-v1",

      distributionModelVersion:
        "phase-9e-4-v1",

      sourcePvPowerField:
        "pvPowerKw",

      efficiencyModel:
        "legacy_system_adjusted",

      efficiencyApplicationMode:
        "legacy_power_passthrough",

      efficiencyAssumption:
        `Upstream Phase 7B/8C pvPowerKw already contains the historical systemEfficiency factor. No additional ${(specification.ac.maximumEfficiency * 100).toFixed(1)}% inverter efficiency multiplication is applied in compatibility mode.`,

      dcVoltageAssumption:
        `When PV power is positive, the demonstration DC operating voltage is assumed to be the selected inverter rated input voltage of ${specification.dc.ratedInputVoltageV} V. At zero PV power the demonstration voltage is set to 0 V.`,

      mpptAllocationAssumption:
        `Aggregate PV power is equally allocated across ${specification.dc.independentMpptInputs} MPPT inputs and ${specification.dc.stringsPerMppt} strings per MPPT. This is a demonstration allocation, not measured string telemetry. Isc values remain unavailable.`,

      loadProfileAssumption:
        "Three assumed demonstration feeders are used at constant 10 kW, 8 kW and 6 kW demand respectively. These values are not measured site loads.",

      distributionLossAssumption:
        "Distribution loss is fixed at 0 kW because cable, transformer and impedance data have not been supplied.",
    },

    ...(compatibility
      ? {
          compatibility,
        }
      : {}),

    summary: {
      inverter:
        summarizeInverterSimulation(
          inverterResults,
        ),

      distribution:
        summarizeElectricalDistribution(
          distributionResults,
        ),
    },

    hourly,
  };
}
