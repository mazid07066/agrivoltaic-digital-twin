import type {
  DatasetColumnUnit,
} from "./types";

const LARGE_SENTINEL_THRESHOLD =
  1e19;

function numericValue(
  value: unknown,
): number | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const text =
    String(value).trim();

  if (
    text === "" ||
    text.toLowerCase() === "nan" ||
    text.toLowerCase() === "null" ||
    text.toLowerCase() === "undefined"
  ) {
    return null;
  }

  const parsed =
    Number(text);

  if (
    !Number.isFinite(parsed)
  ) {
    return null;
  }

  /*
   * Several meteorological logger exports use
   * very large numbers such as 1e+20 as missing-
   * value sentinels.
   */
  if (
    Math.abs(parsed) >=
    LARGE_SENTINEL_THRESHOLD
  ) {
    return null;
  }

  return parsed;
}

export function normalizeNumericValue(
  value: unknown,
  unit?: DatasetColumnUnit,
): number | null {
  const number =
    numericValue(value);

  if (
    number === null
  ) {
    return null;
  }

  if (
    unit === "km/h"
  ) {
    return number / 3.6;
  }

  return number;
}
