export type ElectricalOperatingMode =
  | "grid_connected"
  | "islanded";

export interface ElectricalLoadPoint {
  timestamp: string;

  activePowerKw: number;

  powerFactor: number;
}

export interface ElectricalFeederDefinition {
  id: string;

  name: string;

  nominalVoltageV: number;

  phases:
    | 1
    | 3;

  connectedLoadKw: number;

  powerFactor: number;

  priority: number;

  enabled: boolean;

  loadProfile:
    ElectricalLoadPoint[];
}

export interface ElectricalFeederTimestepResult {
  feederId: string;

  requestedLoadKw: number;

  servedLoadKw: number;

  unservedLoadKw: number;

  loadingPercent: number | null;
}

export interface ElectricalDispatchResult {
  timestamp: string;

  operatingMode:
    ElectricalOperatingMode;

  pvAcAvailableKw: number;

  totalRequestedLoadKw: number;

  totalServedLoadKw: number;

  pvToLoadKw: number;

  gridImportKw: number;

  gridExportKw: number;

  curtailedPvKw: number;

  unservedLoadKw: number;

  distributionLossKw: number;

  balanceErrorKw: number;

  balanceWithinTolerance: boolean;

  feeders:
    ElectricalFeederTimestepResult[];
}

export interface ElectricalDistributionSummary {
  totalLoadDemandKwh: number;

  totalLoadServedKwh: number;

  totalUnservedEnergyKwh: number;

  totalGridImportKwh: number;

  totalGridExportKwh: number;

  totalCurtailedPvKwh: number;

  totalDistributionLossKwh: number;

  maximumBalanceErrorKw: number;
}
