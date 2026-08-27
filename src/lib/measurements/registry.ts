import {
  FENI_VALIDATION_SITE,
} from "./feni";

export const MEASUREMENT_VALIDATION_SITES = [
  FENI_VALIDATION_SITE,
] as const;

export function getMeasurementValidationSite(
  id: string,
) {
  return (
    MEASUREMENT_VALIDATION_SITES.find(
      (site) =>
        site.id === id,
    ) ??
    null
  );
}
