export const DEFAULT_ENERGY_BALANCE_TOLERANCE_KW =
  1e-6;

export interface ElectricalBalanceInput {
  pvAcAvailableKw: number;

  gridImportKw: number;

  loadServedKw: number;

  gridExportKw: number;

  curtailedPvKw: number;

  distributionLossKw: number;
}

export interface ElectricalBalanceEvaluation {
  sourcePowerKw: number;

  sinkPowerKw: number;

  balanceErrorKw: number;

  withinTolerance: boolean;
}

function validateNonNegative(
  value: number,
  label: string,
): void {
  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error(
      `${label} must be a non-negative finite number.`,
    );
  }
}

export function evaluateElectricalBalance(
  input: ElectricalBalanceInput,
  toleranceKw =
    DEFAULT_ENERGY_BALANCE_TOLERANCE_KW,
): ElectricalBalanceEvaluation {
  validateNonNegative(
    input.pvAcAvailableKw,
    "PV AC available power",
  );

  validateNonNegative(
    input.gridImportKw,
    "Grid import power",
  );

  validateNonNegative(
    input.loadServedKw,
    "Load served power",
  );

  validateNonNegative(
    input.gridExportKw,
    "Grid export power",
  );

  validateNonNegative(
    input.curtailedPvKw,
    "Curtailed PV power",
  );

  validateNonNegative(
    input.distributionLossKw,
    "Distribution loss power",
  );

  if (
    !Number.isFinite(toleranceKw) ||
    toleranceKw < 0
  ) {
    throw new Error(
      "Energy-balance tolerance must be a non-negative finite number.",
    );
  }

  const sourcePowerKw =
    input.pvAcAvailableKw +
    input.gridImportKw;

  const sinkPowerKw =
    input.loadServedKw +
    input.gridExportKw +
    input.curtailedPvKw +
    input.distributionLossKw;

  const balanceErrorKw =
    sourcePowerKw -
    sinkPowerKw;

  return {
    sourcePowerKw,

    sinkPowerKw,

    balanceErrorKw,

    withinTolerance:
      Math.abs(
        balanceErrorKw,
      ) <=
      toleranceKw,
  };
}
