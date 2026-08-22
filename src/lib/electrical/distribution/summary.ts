import type {
  ElectricalDispatchResult,
  ElectricalDistributionSummary,
} from "./types";

export function summarizeElectricalDistribution(
  results:
    ElectricalDispatchResult[],

  timestepHours = 1,
): ElectricalDistributionSummary {
  if (
    !Number.isFinite(
      timestepHours,
    ) ||
    timestepHours <= 0
  ) {
    throw new Error(
      "Timestep duration must be a positive finite number.",
    );
  }

  const energy = (
    selector:
      (
        result:
          ElectricalDispatchResult,
      ) => number,
  ) =>
    results.reduce(
      (
        sum,
        result,
      ) =>
        sum +
        selector(
          result,
        ) *
          timestepHours,
      0,
    );

  return {
    totalLoadDemandKwh:
      energy(
        (result) =>
          result
            .totalRequestedLoadKw,
      ),

    totalLoadServedKwh:
      energy(
        (result) =>
          result
            .totalServedLoadKw,
      ),

    totalUnservedEnergyKwh:
      energy(
        (result) =>
          result
            .unservedLoadKw,
      ),

    totalGridImportKwh:
      energy(
        (result) =>
          result.gridImportKw,
      ),

    totalGridExportKwh:
      energy(
        (result) =>
          result.gridExportKw,
      ),

    totalCurtailedPvKwh:
      energy(
        (result) =>
          result.curtailedPvKw,
      ),

    totalDistributionLossKwh:
      energy(
        (result) =>
          result
            .distributionLossKw,
      ),

    maximumBalanceErrorKw:
      results.reduce(
        (
          maximum,
          result,
        ) =>
          Math.max(
            maximum,
            Math.abs(
              result.balanceErrorKw,
            ),
          ),
        0,
      ),
  };
}
