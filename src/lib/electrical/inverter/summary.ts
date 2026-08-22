import type {
  InverterSimulationSummary,
  InverterTimestepResult,
} from "./types";

export function summarizeInverterSimulation(
  results:
    InverterTimestepResult[],
): InverterSimulationSummary {
  const sum = (
    selector:
      (
        result:
          InverterTimestepResult,
      ) => number,
  ) =>
    results.reduce(
      (
        total,
        result,
      ) =>
        total +
        selector(
          result,
        ),
      0,
    );

  return {
    totalAvailableDcEnergyKwh:
      sum(
        (result) =>
          result
            .dcInput
            .availablePowerKw
            .value,
      ),

    totalAcceptedDcEnergyKwh:
      sum(
        (result) =>
          result
            .dcOutput
            .acceptedPowerKw,
      ),

    totalAcEnergyKwh:
      sum(
        (result) =>
          result.ac
            .energyKwh,
      ),

    totalConversionLossKwh:
      sum(
        (result) =>
          result
            .conversionLossKw,
      ),

    totalClippingLossKwh:
      sum(
        (result) =>
          result
            .dcOutput
            .clippedPowerKw,
      ),

    totalDeratingLossKwh:
      sum(
        (result) =>
          result
            .deratingLossKw,
      ),

    peakAcPowerKw:
      results.reduce(
        (
          maximum,
          result,
        ) =>
          Math.max(
            maximum,
            result.ac
              .activePowerKw,
          ),
        0,
      ),

    peakAcCurrentA:
      results.reduce(
        (
          maximum,
          result,
        ) =>
          Math.max(
            maximum,
            result.ac
              .lineCurrentA,
          ),
        0,
      ),

    alarmCount:
      results.reduce(
        (
          total,
          result,
        ) =>
          total +
          result.alarms
            .length,
        0,
      ),
  };
}
