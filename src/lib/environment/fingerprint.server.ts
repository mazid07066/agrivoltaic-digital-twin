import "server-only";

import {
  createHash,
} from "node:crypto";

import type {
  EnvironmentalDataRequest,
} from "./request";

import type {
  EnvironmentalDataset,
} from "./types";

function stableNormalize(
  value: unknown,
): unknown {
  if (
    Array.isArray(value)
  ) {
    return value.map(
      stableNormalize,
    );
  }

  if (
    value !== null &&
    typeof value === "object"
  ) {
    const entries =
      Object.entries(
        value as Record<
          string,
          unknown
        >,
      ).sort(
        ([first], [second]) =>
          first.localeCompare(
            second,
          ),
      );

    return Object.fromEntries(
      entries.map(
        ([key, entryValue]) => [
          key,
          stableNormalize(
            entryValue,
          ),
        ],
      ),
    );
  }

  return value;
}

export function sha256Fingerprint(
  value: unknown,
): string {
  const normalized =
    JSON.stringify(
      stableNormalize(
        value,
      ),
    );

  const digest =
    createHash(
      "sha256",
    )
      .update(
        normalized,
        "utf8",
      )
      .digest(
        "hex",
      );

  return `sha256:${digest}`;
}

export function fingerprintEnvironmentalRequest(
  request: EnvironmentalDataRequest,
): string {
  return sha256Fingerprint({
    schema:
      "agritwin-environment-request-v1",

    source:
      request.source,

    mode:
      request.mode,

    coordinate:
      request.coordinate,

    startDate:
      request.startDate,

    endDate:
      request.endDate,

    timezone:
      request.timezone ??
      null,

    datasetId:
      request.datasetId ??
      null,
  });
}

export function fingerprintEnvironmentalDataset(
  dataset: EnvironmentalDataset,
): string {
  return sha256Fingerprint({
    schema:
      "agritwin-environment-dataset-v1",

    source:
      dataset.provenance.source,

    mode:
      dataset.provenance.mode,

    provider:
      dataset.provenance.provider ??
      null,

    requestedCoordinate:
      dataset.provenance
        .requestedCoordinate,

    resolvedCoordinate:
      dataset.provenance
        .resolvedCoordinate ??
      null,

    timezone:
      dataset.provenance.timezone,

    startTime:
      dataset.startTime,

    endTime:
      dataset.endTime,

    hourly:
      dataset.hourly,

    daily:
      dataset.daily ??
      [],
  });
}
