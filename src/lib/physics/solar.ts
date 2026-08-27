import { clamp, normalizeDegrees, toDegrees, toRadians } from "./math";
import type { SolarPositionResult } from "./types";

export interface SolarPositionInput {
  timestamp: Date | string;
  latitudeDeg: number;
  longitudeDeg: number;
  elevationM?: number;
  pressurePa?: number;
  ambientTemperatureC?: number;
}

function julianDay(date: Date): number {
  return date.getTime() / 86_400_000 + 2_440_587.5;
}

/**
 * High-accuracy solar geometry using the NREL/NOAA reference sequence.
 *
 * This is deliberately labelled SPA-equivalent rather than an exact port of
 * the full NREL SPA source: it preserves the same UTC/J2000 geometry,
 * equation-of-time and atmospheric-refraction boundaries needed by AgriTwin.
 */
export function calculateSpaEquivalentSolarPosition(
  input: SolarPositionInput,
): SolarPositionResult {
  const timestamp =
    input.timestamp instanceof Date
      ? input.timestamp
      : new Date(input.timestamp);

  if (!Number.isFinite(timestamp.getTime())) {
    throw new Error("Solar-position timestamp must be a valid instant.");
  }

  const latitude = toRadians(clamp(input.latitudeDeg, -90, 90));
  const longitude = input.longitudeDeg;
  const jd = julianDay(timestamp);
  const century = (jd - 2_451_545) / 36_525;

  const geometricMeanLongitude = normalizeDegrees(
    280.46646 + century * (36_000.76983 + century * 0.0003032),
  );
  const geometricMeanAnomaly = normalizeDegrees(
    357.52911 + century * (35_999.05029 - 0.0001537 * century),
  );
  const eccentricity =
    0.016708634 - century * (0.000042037 + 0.0000001267 * century);
  const anomalyRad = toRadians(geometricMeanAnomaly);
  const equationOfCenter =
    Math.sin(anomalyRad) *
      (1.914602 - century * (0.004817 + 0.000014 * century)) +
    Math.sin(2 * anomalyRad) * (0.019993 - 0.000101 * century) +
    Math.sin(3 * anomalyRad) * 0.000289;
  const trueLongitude = geometricMeanLongitude + equationOfCenter;
  const omega = 125.04 - 1934.136 * century;
  const apparentLongitude =
    trueLongitude - 0.00569 - 0.00478 * Math.sin(toRadians(omega));

  const meanObliquity =
    23 +
    (26 +
      (21.448 -
        century * (46.815 + century * (0.00059 - century * 0.001813))) /
        60) /
      60;
  const correctedObliquity =
    meanObliquity + 0.00256 * Math.cos(toRadians(omega));
  const obliquityRad = toRadians(correctedObliquity);
  const apparentLongitudeRad = toRadians(apparentLongitude);
  const declination = Math.asin(
    Math.sin(obliquityRad) * Math.sin(apparentLongitudeRad),
  );

  const y = Math.tan(obliquityRad / 2) ** 2;
  const meanLongitudeRad = toRadians(geometricMeanLongitude);
  const equationOfTimeMinutes =
    4 *
    toDegrees(
      y * Math.sin(2 * meanLongitudeRad) -
        2 * eccentricity * Math.sin(anomalyRad) +
        4 *
          eccentricity *
          y *
          Math.sin(anomalyRad) *
          Math.cos(2 * meanLongitudeRad) -
        0.5 * y ** 2 * Math.sin(4 * meanLongitudeRad) -
        1.25 * eccentricity ** 2 * Math.sin(2 * anomalyRad),
    );

  const utcMinutes =
    timestamp.getUTCHours() * 60 +
    timestamp.getUTCMinutes() +
    timestamp.getUTCSeconds() / 60 +
    timestamp.getUTCMilliseconds() / 60_000;
  const trueSolarMinutes =
    ((utcMinutes + equationOfTimeMinutes + 4 * longitude) % 1440 + 1440) %
    1440;
  const hourAngleDeg =
    trueSolarMinutes / 4 < 0
      ? trueSolarMinutes / 4 + 180
      : trueSolarMinutes / 4 - 180;
  const hourAngle = toRadians(hourAngleDeg);

  const cosineZenith = clamp(
    Math.sin(latitude) * Math.sin(declination) +
      Math.cos(latitude) * Math.cos(declination) * Math.cos(hourAngle),
    -1,
    1,
  );
  const zenithDeg = toDegrees(Math.acos(cosineZenith));
  const elevationDeg = 90 - zenithDeg;

  let refractionDeg = 0;
  if (elevationDeg > 85) {
    refractionDeg = 0;
  } else if (elevationDeg > 5) {
    const tangent = Math.tan(toRadians(elevationDeg));
    refractionDeg =
      (58.1 / tangent -
        0.07 / tangent ** 3 +
        0.000086 / tangent ** 5) /
      3600;
  } else if (elevationDeg > -0.575) {
    refractionDeg =
      (1735 +
        elevationDeg *
          (-518.2 +
            elevationDeg *
              (103.4 + elevationDeg * (-12.79 + elevationDeg * 0.711)))) /
      3600;
  } else {
    refractionDeg =
      -20.772 / Math.tan(toRadians(elevationDeg)) / 3600;
  }

  const pressureScale = (input.pressurePa ?? 101_325) / 101_325;
  const temperatureScale = 283 / (273 + (input.ambientTemperatureC ?? 10));
  refractionDeg *= pressureScale * temperatureScale;

  const azimuthRad = Math.atan2(
    Math.sin(hourAngle),
    Math.cos(hourAngle) * Math.sin(latitude) -
      Math.tan(declination) * Math.cos(latitude),
  );
  const azimuthDeg = normalizeDegrees(toDegrees(azimuthRad) + 180);
  const apparentElevationDeg = elevationDeg + refractionDeg;

  return {
    zenithDeg,
    apparentZenithDeg: 90 - apparentElevationDeg,
    elevationDeg,
    apparentElevationDeg,
    azimuthDeg,
    equationOfTimeMinutes,
    declinationDeg: toDegrees(declination),
    isAboveHorizon: apparentElevationDeg > 0,
  };
}
