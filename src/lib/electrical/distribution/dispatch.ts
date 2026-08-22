import {
  evaluateElectricalBalance,
} from "./energyBalance";

import {
  createFeederDemands,
  createFeederResult,
} from "./feeder";

import type {
  ElectricalDispatchResult,
  ElectricalFeederDefinition,
  ElectricalOperatingMode,
} from "./types";

export interface DispatchElectricalPowerInput {
  timestamp:
    string;

  operatingMode:
    ElectricalOperatingMode;

  pvAcAvailableKw:
    number;

  feeders:
    ElectricalFeederDefinition[];

  distributionLossKw?:
    number;

  balanceToleranceKw?:
    number;
}

function validateNonNegative(
  value:
    number,
  label:
    string,
): void {
  if (
    !Number.isFinite(
      value,
    ) ||
    value < 0
  ) {
    throw new Error(
      `${label} must be a non-negative finite number.`,
    );
  }
}

export function dispatchElectricalPower(
  input:
    DispatchElectricalPowerInput,
): ElectricalDispatchResult {
  validateNonNegative(
    input.pvAcAvailableKw,
    "PV AC available power",
  );

  const distributionLossKw =
    input.distributionLossKw ??
    0;

  validateNonNegative(
    distributionLossKw,
    "Distribution loss power",
  );

  const demands =
    createFeederDemands(
      input.feeders,
      input.timestamp,
    );

  const totalRequestedLoadKw =
    demands.reduce(
      (
        sum,
        demand,
      ) =>
        sum +
        demand.requestedLoadKw,
      0,
    );

  let gridImportKw =
    0;

  let gridExportKw =
    0;

  let curtailedPvKw =
    0;

  let pvToLoadKw =
    0;

  let feederResults;

  if (
    input.operatingMode ===
    "grid_connected"
  ) {
    pvToLoadKw =
      Math.min(
        input.pvAcAvailableKw,
        totalRequestedLoadKw,
      );

    gridImportKw =
      Math.max(
        0,
        totalRequestedLoadKw -
          input.pvAcAvailableKw +
          distributionLossKw,
      );

    gridExportKw =
      Math.max(
        0,
        input.pvAcAvailableKw -
          totalRequestedLoadKw -
          distributionLossKw,
      );

    feederResults =
      demands.map(
        (demand) =>
          createFeederResult(
            demand,
            demand.requestedLoadKw,
          ),
      );
  } else {
    let remainingPvKw =
      Math.max(
        0,
        input.pvAcAvailableKw -
          distributionLossKw,
      );

    const orderedDemands =
      [...demands]
        .sort(
          (
            first,
            second,
          ) => {
            const priorityDifference =
              first.feeder
                .priority -
              second.feeder
                .priority;

            if (
              priorityDifference !==
              0
            ) {
              return priorityDifference;
            }

            return first.feeder.id
              .localeCompare(
                second.feeder.id,
              );
          },
        );

    const resultByFeederId =
      new Map<
        string,
        ReturnType<
          typeof createFeederResult
        >
      >();

    for (
      const demand
      of orderedDemands
    ) {
      const servedLoadKw =
        Math.min(
          demand.requestedLoadKw,
          remainingPvKw,
        );

      remainingPvKw =
        Math.max(
          0,
          remainingPvKw -
            servedLoadKw,
        );

      resultByFeederId.set(
        demand.feeder.id,
        createFeederResult(
          demand,
          servedLoadKw,
        ),
      );
    }

    feederResults =
      demands.map(
        (demand) => {
          const result =
            resultByFeederId.get(
              demand.feeder.id,
            );

          if (
            !result
          ) {
            throw new Error(
              `Missing dispatch result for feeder ${demand.feeder.id}.`,
            );
          }

          return result;
        },
      );

    pvToLoadKw =
      feederResults.reduce(
        (
          sum,
          feeder,
        ) =>
          sum +
          feeder.servedLoadKw,
        0,
      );

    curtailedPvKw =
      remainingPvKw;
  }

  const totalServedLoadKw =
    feederResults.reduce(
      (
        sum,
        feeder,
      ) =>
        sum +
        feeder.servedLoadKw,
      0,
    );

  const unservedLoadKw =
    feederResults.reduce(
      (
        sum,
        feeder,
      ) =>
        sum +
        feeder.unservedLoadKw,
      0,
    );

  const balance =
    evaluateElectricalBalance(
      {
        pvAcAvailableKw:
          input.pvAcAvailableKw,

        gridImportKw,

        loadServedKw:
          totalServedLoadKw,

        gridExportKw,

        curtailedPvKw,

        distributionLossKw,
      },

      input.balanceToleranceKw,
    );

  return {
    timestamp:
      input.timestamp,

    operatingMode:
      input.operatingMode,

    pvAcAvailableKw:
      input.pvAcAvailableKw,

    totalRequestedLoadKw,

    totalServedLoadKw,

    pvToLoadKw,

    gridImportKw,

    gridExportKw,

    curtailedPvKw,

    unservedLoadKw,

    distributionLossKw,

    balanceErrorKw:
      balance.balanceErrorKw,

    balanceWithinTolerance:
      balance.withinTolerance,

    feeders:
      feederResults,
  };
}
