import "server-only";

import {
  fingerprintEnvironmentalDataset,
  fingerprintEnvironmentalRequest,
} from "./fingerprint.server";

import {
  coordinateDistanceKm,
} from "./geography";

import type {
  EnvironmentalDataRequest,
} from "./request";

import type {
  EnvironmentalDataset,
} from "./types";

export function hardenEnvironmentalProvenance(
  request:
    EnvironmentalDataRequest,

  dataset:
    EnvironmentalDataset,
): EnvironmentalDataset {
  const resolvedCoordinate =
    dataset.provenance
      .resolvedCoordinate;

  const resolvedGridDistanceKm =
    resolvedCoordinate
      ? coordinateDistanceKm(
          request.coordinate,
          resolvedCoordinate,
        )
      : null;

  const withRequestIdentity:
    EnvironmentalDataset = {
    ...dataset,

    provenance: {
      ...dataset.provenance,

      resolvedGridDistanceKm,

      requestFingerprint:
        fingerprintEnvironmentalRequest(
          request,
        ),

      datasetFingerprint:
        null,
    },
  };

  const datasetFingerprint =
    fingerprintEnvironmentalDataset(
      withRequestIdentity,
    );

  return {
    ...withRequestIdentity,

    provenance: {
      ...withRequestIdentity
        .provenance,

      datasetFingerprint,
    },
  };
}
