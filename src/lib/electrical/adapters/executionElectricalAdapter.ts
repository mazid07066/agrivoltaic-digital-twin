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
  createDesignedDcInput,
} from "../inverter/mppt";

import {
  createPlantEquivalentSpecification,
} from "../demonstration";

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

import {
  findPVModuleProfile,
} from "@/lib/pv/moduleProfiles";

export interface ElectricalExecutionDesign {
  moduleProfileId: string;
  moduleCount: number | null;
  modulesPerString: number | null;
  stringsPerInverter: number | null;
  stringsPerMppt: number | null;
  inverterCount: number | null;
}

function positiveInteger(
  value: number | null | undefined,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value > 0
  );
}

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

  design?:
    ElectricalExecutionDesign,
): ElectricalSimulationResult {
  const physicsResearchMode =
    result.hourly.some(
      (point) =>
        point.additionalValues
          .modelMode ===
          "physics_research" ||
        point.additionalValues
          .modelMode ===
          "reference_validation",
    );
  const feeders =
    createDemonstrationFeeders(
      result,
    );

  const moduleProfile =
    design
      ? findPVModuleProfile(
          design.moduleProfileId,
        )
      : null;

  const designModuleCount =
    design?.moduleCount;

  const designModulesPerString =
    design?.modulesPerString;

  const designStringsPerInverter =
    design?.stringsPerInverter;

  const designInverterCount =
    design?.inverterCount;

  const configuredInverterCount =
    positiveInteger(
      designInverterCount,
    )
      ? designInverterCount
      : 1;

  const plantSpecification =
    createPlantEquivalentSpecification(
      specification,
      configuredInverterCount,
    );

  /*
   * Total strings per inverter is authoritative.
   *
   * Seven strings across six MPPTs therefore produces
   * [2, 1, 1, 1, 1, 1].
   */
  const derivedStringsPerMppt =
    positiveInteger(
      designStringsPerInverter,
    )
      ? Math.ceil(
          designStringsPerInverter /
            specification.dc
              .independentMpptInputs,
        )
      : null;

  const requiredModuleCount =
    positiveInteger(
      designModulesPerString,
    ) &&
    positiveInteger(
      designStringsPerInverter,
    )
      ? designModulesPerString *
        designStringsPerInverter *
        configuredInverterCount
      : null;

  const hasHourlyModuleTemperature =
    result.hourly.every(
      (point) =>
        typeof point.moduleTemperatureC ===
          "number" &&
        Number.isFinite(
          point.moduleTemperatureC,
        ),
    );

  const useDesignedTopology =
    moduleProfile !== null &&
    moduleProfile.vmppV !== null &&
    moduleProfile
      .tempCoeffVocPercentPerC !== null &&
    positiveInteger(
      designModuleCount,
    ) &&
    positiveInteger(
      designModulesPerString,
    ) &&
    positiveInteger(
      designStringsPerInverter,
    ) &&
    derivedStringsPerMppt !== null &&
    derivedStringsPerMppt <=
      specification.dc.stringsPerMppt &&
    designStringsPerInverter <=
      specification.dc
        .independentMpptInputs *
      specification.dc.stringsPerMppt &&
    requiredModuleCount !== null &&
    requiredModuleCount <=
      designModuleCount &&
    hasHourlyModuleTemperature;

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
          useDesignedTopology
            ? createDesignedDcInput(
                {
                  availablePowerKw,

                  moduleCount:
                    designModuleCount!,

                  modulesPerString:
                    designModulesPerString!,

                  stringsPerInverter:
                    designStringsPerInverter!,

                  stringsPerMppt:
                    derivedStringsPerMppt!,

                  inverterCount:
                    configuredInverterCount,

                  moduleVmppV:
                    moduleProfile!.vmppV!,

                  moduleTemperatureC:
                    point.moduleTemperatureC!,

                  voltageTemperatureCoefficientPercentPerC:
                    moduleProfile!
                      .tempCoeffVocPercentPerC!,
                },
                specification,
              )
            : createDemonstrationDcInput(
                {
                  availablePowerKw,
                },
                plantSpecification,
              );

        const inverter =
          simulateInverterTimestep(
            {
              timestamp:
                point.timestamp,

              dcInput,

              specification:
                plantSpecification,

              efficiencyMode:
                physicsResearchMode
                  ? "explicit_fitted_curve"
                  : "legacy_power_passthrough",

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
          (() => {
            const physics =
              point.additionalValues
                .physics as
                  | {
                      netAcPowerW?: number;
                    }
                  | null
                  | undefined;
            const modeledNetAcKw =
              typeof physics?.netAcPowerW ===
                "number"
                ? physics.netAcPowerW /
                  1000
                : inverter.ac
                    .activePowerKw;
            const explicitDownstreamLossKw =
              physicsResearchMode
                ? Math.max(
                    0,
                    inverter.ac
                      .activePowerKw -
                      modeledNetAcKw,
                  ) +
                  (inverter
                    .standbyConsumptionKw ??
                    0)
                : 0;

            return (
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
                explicitDownstreamLossKw,
            },
          )
            );
          })();

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

      ...(moduleProfile
        ? {
            pvModuleProfileId:
              moduleProfile.id,
          }
        : compatibility
          ? {
              pvModuleProfileId:
                compatibility
                  .moduleProfileId,
            }
          : {}),

      inverterModelVersion:
        physicsResearchMode
          ? "phase-9h-fitted-inverter-v1"
          : "phase-9e-2-v1",

      distributionModelVersion:
        "phase-9e-4-v1",

      sourcePvPowerField:
        "pvPowerKw",

      efficiencyModel:
        physicsResearchMode
          ? "fitted_loss_curve"
          : "legacy_system_adjusted",

      efficiencyApplicationMode:
        physicsResearchMode
          ? "explicit_fitted_curve"
          : "legacy_power_passthrough",

      efficiencyAssumption:
        physicsResearchMode
          ? "Upstream pvPowerKw is an explicit DC boundary with aggregate systemEfficiency disabled. Inverter conversion uses the calibrated SMA fitted loss curve and applies clipping separately."
          : `Upstream Phase 7B/8C pvPowerKw already contains the historical systemEfficiency factor. No additional ${(specification.ac.maximumEfficiency * 100).toFixed(1)}% inverter efficiency multiplication is applied in compatibility mode.`,

      dcVoltageAssumption:
        useDesignedTopology
          ? "Operating string voltage is calculated from selected-module Vmpp, modules per string and hourly simulated module temperature."
          : `When PV power is positive, the demonstration DC operating voltage is assumed to be the selected inverter rated input voltage of ${specification.dc.ratedInputVoltageV} V. At zero PV power the demonstration voltage is set to 0 V.`,

      mpptAllocationAssumption:
        useDesignedTopology
          ? `${designStringsPerInverter} chosen strings per inverter are balanced independently across ${specification.dc.independentMpptInputs} MPPT inputs, with a maximum of ${derivedStringsPerMppt} strings on one MPPT.`
          : `Aggregate PV power is equally allocated across ${plantSpecification.dc.independentMpptInputs} MPPT inputs and ${plantSpecification.dc.stringsPerMppt} strings per MPPT. This is a demonstration allocation, not measured string telemetry. Isc values remain unavailable.`,

      loadProfileAssumption:
        "Three assumed demonstration feeders are used at constant 10 kW, 8 kW and 6 kW demand respectively. These values are not measured site loads.",

      distributionLossAssumption:
        physicsResearchMode
          ? "Explicit AC-ohmic, transformer, auxiliary, availability and curtailment stages are supplied by the versioned physics result; night standby is accounted separately."
          : "Distribution loss is fixed at 0 kW because cable, transformer and impedance data have not been supplied.",
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
