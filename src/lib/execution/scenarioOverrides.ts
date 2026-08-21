import type {
  Scenario,
} from "@/lib/scenarios/types";

import type {
  CropId,
} from "@/types/simulation";

import type {
  LandAgrivoltaicSiteProfile,
} from "@/lib/sites/schema";

function finiteNumber(
  value:
    unknown,
): number | null {
  return (
    typeof value ===
      "number" &&
    Number.isFinite(
      value,
    )
  )
    ? value
    : null;
}

function positiveNumber(
  value:
    unknown,

  label:
    string,
): number | null {
  const number =
    finiteNumber(
      value,
    );

  if (
    number === null
  ) {
    return null;
  }

  if (
    number <=
    0
  ) {
    throw new Error(
      `${label} must be greater than zero.`,
    );
  }

  return number;
}

function boundedNumber(
  value:
    unknown,

  minimum:
    number,

  maximum:
    number,

  label:
    string,
): number | null {
  const number =
    finiteNumber(
      value,
    );

  if (
    number === null
  ) {
    return null;
  }

  if (
    number <
      minimum ||
    number >
      maximum
  ) {
    throw new Error(
      `${label} must be between ${minimum} and ${maximum}.`,
    );
  }

  return number;
}

export function applyLandScenarioOverrides(
  stored:
    LandAgrivoltaicSiteProfile,

  scenario:
    Scenario,
): LandAgrivoltaicSiteProfile {
  /*
   * Execution must never mutate the immutable
   * persisted site-version snapshot.
   */
  const runtime =
    structuredClone(
      stored,
    );

  const technical =
    scenario.technicalConfig ??
    {};

  const agricultural =
    scenario.agriculturalConfig ??
    {};

  /*
   * Scenario technical configuration uses the
   * Phase 9 scenario naming contract, whereas
   * the verified Phase 7B engine reads the
   * legacy PVConfiguration field names.
   *
   * Explicitly bridge those contracts here.
   */

  const panelHeight =
    positiveNumber(
      technical.panelHeightM,
      "Panel height",
    );

  if (
    panelHeight !==
    null
  ) {
    runtime
      .pvConfiguration
      .panelHeight =
      panelHeight;
  }

  const rowSpacing =
    positiveNumber(
      technical.rowSpacingM,
      "Row spacing",
    );

  if (
    rowSpacing !==
    null
  ) {
    runtime
      .pvConfiguration
      .rowSpacing =
      rowSpacing;
  }

  const tilt =
    boundedNumber(
      technical.tiltDeg,
      0,
      90,
      "PV tilt",
    );

  if (
    tilt !==
    null
  ) {
    runtime
      .pvConfiguration
      .tilt =
      tilt;
  }

  const azimuth =
    boundedNumber(
      technical.azimuthDeg,
      0,
      360,
      "PV azimuth",
    );

  if (
    azimuth !==
    null
  ) {
    runtime
      .pvConfiguration
      .azimuth =
      azimuth;
  }

  if (
    technical.trackingMode !==
      undefined &&
    technical.trackingMode !==
      null
  ) {
    runtime
      .pvConfiguration
      .trackingMode =
      technical
        .trackingMode;
  }

  /*
   * GCR is intentionally not written directly
   * into the runtime SiteProfile.
   *
   * The current Phase 7B engine derives physical
   * array coverage from row spacing, module size,
   * row count and modules per row. Treating GCR
   * as an independent geometry override would
   * create internally inconsistent geometry.
   */

  if (
    agricultural.cropId !==
      undefined &&
    agricultural.cropId !==
      null &&
    agricultural.cropId.trim()
  ) {
    runtime
      .cropConfiguration
      .cropId =
      agricultural
        .cropId as CropId;
  }

  return runtime;
}
