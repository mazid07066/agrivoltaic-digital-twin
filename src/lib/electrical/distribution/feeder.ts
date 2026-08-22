import {
  resolveFeederDemandKw,
} from "./loadProfile";

import type {
  ElectricalFeederDefinition,
  ElectricalFeederTimestepResult,
} from "./types";

export interface FeederDemand {
  feeder:
    ElectricalFeederDefinition;

  requestedLoadKw:
    number;
}

export function createFeederDemands(
  feeders:
    ElectricalFeederDefinition[],

  timestamp:
    string,
): FeederDemand[] {
  return feeders.map(
    (feeder) => ({
      feeder,

      requestedLoadKw:
        resolveFeederDemandKw(
          feeder,
          timestamp,
        ),
    }),
  );
}

export function createFeederResult(
  demand:
    FeederDemand,

  servedLoadKw:
    number,
): ElectricalFeederTimestepResult {
  const requestedLoadKw =
    demand.requestedLoadKw;

  const boundedServedLoadKw =
    Math.max(
      0,
      Math.min(
        servedLoadKw,
        requestedLoadKw,
      ),
    );

  const connectedLoadKw =
    demand.feeder
      .connectedLoadKw;

  return {
    feederId:
      demand.feeder.id,

    requestedLoadKw,

    servedLoadKw:
      boundedServedLoadKw,

    unservedLoadKw:
      Math.max(
        0,
        requestedLoadKw -
          boundedServedLoadKw,
      ),

    loadingPercent:
      connectedLoadKw > 0
        ? (
            boundedServedLoadKw /
            connectedLoadKw
          ) *
          100
        : null,
  };
}
