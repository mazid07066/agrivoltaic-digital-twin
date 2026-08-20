import type {
  GeographicCoordinate,
} from "./types";

const EARTH_RADIUS_KM =
  6371.0088;

function degreesToRadians(
  value: number,
): number {
  return value * Math.PI / 180;
}

export function coordinateDistanceKm(
  first: GeographicCoordinate,
  second: GeographicCoordinate,
): number {
  const latitude1 =
    degreesToRadians(
      first.latitude,
    );

  const latitude2 =
    degreesToRadians(
      second.latitude,
    );

  const deltaLatitude =
    degreesToRadians(
      second.latitude -
      first.latitude,
    );

  const deltaLongitude =
    degreesToRadians(
      second.longitude -
      first.longitude,
    );

  const a =
    Math.sin(
      deltaLatitude / 2,
    ) ** 2 +
    Math.cos(
      latitude1,
    ) *
      Math.cos(
        latitude2,
      ) *
      Math.sin(
        deltaLongitude / 2,
      ) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a),
    );

  return EARTH_RADIUS_KM * c;
}
