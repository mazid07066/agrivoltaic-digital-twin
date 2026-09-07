export interface ValidationSite {
  name:
    string;

  latitude:
    number;

  longitude:
    number;

  timezone:
    string;

  utcOffsetLabel:
    string;
}

/**
 * Phase 12 validation reference site.
 *
 * All validation datasets used in the current Feni research
 * workflow must refer to this same physical site.
 */
export const FENI_VALIDATION_SITE:
  ValidationSite = {
    name:
      "Feni, Bangladesh",

    latitude:
      22.80029,

    longitude:
      91.35819,

    timezone:
      "Asia/Dhaka",

    utcOffsetLabel:
      "UTC+06:00",
  };

export function formatValidationCoordinate(
  value:
    number,

  positive:
    string,

  negative:
    string,
): string {
  return `${Math.abs(
    value,
  ).toFixed(
    6,
  )}° ${
    value >= 0
      ? positive
      : negative
  }`;
}

export function validationSiteCoordinateLabel(
  site:
    ValidationSite =
      FENI_VALIDATION_SITE,
): string {
  return [
    formatValidationCoordinate(
      site.latitude,
      "N",
      "S",
    ),
    formatValidationCoordinate(
      site.longitude,
      "E",
      "W",
    ),
  ].join(
    ", ",
  );
}
