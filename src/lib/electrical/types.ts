import type {
  PVInverterCompatibilityReport,
} from "./compatibility";

import type {
  ElectricalDistributionSummary,
  ElectricalDispatchResult,
  ElectricalOperatingMode,
} from "./distribution/types";

import type {
  InverterEfficiencyApplicationMode,
  InverterSimulationSummary,
  InverterTimestepResult,
} from "./inverter/types";

export type ElectricalTelemetryProviderKind =
  | "simulation"
  | "modbus_tcp"
  | "modbus_rtu"
  | "mqtt"
  | "rest"
  | "manual";

export interface ElectricalSimulationProvenance {
  schema:
    "agritwin-electrical-provenance-v1";

  provider:
    ElectricalTelemetryProviderKind;

  inverterSpecificationId:
    string;

  /**
   * Optional for historical Phase 9E runs created before
   * final equipment-selection wiring.
   */
  pvModuleProfileId?:
    string;

  inverterModelVersion:
    string;

  distributionModelVersion:
    string;

  sourcePvPowerField:
    "pvPowerKw";

  efficiencyModel:
    | "constant_bounded"
    | "legacy_system_adjusted"
    | "telemetry"
    | "external_curve"
    | "fitted_loss_curve";

  efficiencyApplicationMode:
    InverterEfficiencyApplicationMode;

  efficiencyAssumption:
    string | null;

  dcVoltageAssumption:
    string | null;

  mpptAllocationAssumption:
    string | null;

  loadProfileAssumption:
    string | null;

  distributionLossAssumption:
    string | null;
}

export interface ElectricalSimulationSummary {
  inverter:
    InverterSimulationSummary;

  distribution:
    ElectricalDistributionSummary;
}

export interface ElectricalHourlyResult {
  hourIndex: number;

  timestamp: string;

  inverter:
    InverterTimestepResult;

  distribution:
    ElectricalDispatchResult;
}

export interface ElectricalSimulationResult {
  schema:
    "agritwin-electrical-result-v1";

  operatingMode:
    ElectricalOperatingMode;

  provenance:
    ElectricalSimulationProvenance;

  /**
   * Optional so historical electrical results remain readable.
   */
  compatibility?:
    PVInverterCompatibilityReport;

  summary:
    ElectricalSimulationSummary;

  hourly:
    ElectricalHourlyResult[];
}
