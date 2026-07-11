import { getPosition } from "suncalc";
import { TrackingMode } from "@/types/simulation";

export interface SolarPosition {
  altitudeDegrees: number;
  zenithDegrees: number;
  azimuthDegrees: number;
  altitudeRadians: number;
  isAboveHorizon: boolean;
  threePosition: [number, number, number];
}

export interface SurfaceOrientation {
  trackerAngle: number;
  tilt: number;
  azimuth: number;
}

const toRadians = (degrees: number) => degrees * Math.PI / 180;
const toDegrees = (radians: number) => radians * 180 / Math.PI;
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
const normalize = (degrees: number) => ((degrees % 360) + 360) % 360;

function timezoneOffsetMilliseconds(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const asUTC = Date.UTC(Number(values.year), Number(values.month) - 1,
    Number(values.day), Number(values.hour), Number(values.minute), Number(values.second));
  return asUTC - date.getTime();
}

/** Convert a site's civil clock time to the correct UTC instant. */
export function siteTimeToDate(dateText: string, hour: number, timezone: string): Date {
  const [year, month, day] = dateText.split("-").map(Number);
  const nominalUTC = Date.UTC(year, month - 1, day, hour, 0, 0);
  let result = new Date(nominalUTC);
  result = new Date(nominalUTC - timezoneOffsetMilliseconds(result, timezone));
  result = new Date(nominalUTC - timezoneOffsetMilliseconds(result, timezone));
  return result;
}

export function getSolarPosition(
  dateText: string, hour: number, latitude: number, longitude: number,
  timezone = "UTC", distance = 35,
): SolarPosition {
  const position = getPosition(siteTimeToDate(dateText, hour, timezone), latitude, longitude);
  // SunCalc 2.x returns degrees and compass azimuth directly.
  // Its bundled ecosystem typings may still describe the pre-2.x radian API.
  const altitudeDegrees = position.altitude;
  const altitudeRadians = toRadians(altitudeDegrees);
  const azimuthDegrees = normalize(position.azimuth);
  const horizontal = Math.cos(altitudeRadians) * distance;
  const compass = toRadians(azimuthDegrees);
  return {
    altitudeDegrees,
    zenithDegrees: 90 - altitudeDegrees,
    azimuthDegrees,
    altitudeRadians,
    isAboveHorizon: altitudeRadians > 0,
    threePosition: [
      Math.sin(compass) * horizontal,
      Math.sin(altitudeRadians) * distance,
      -Math.cos(compass) * horizontal,
    ],
  };
}

/** Horizontal north-south single-axis tracker, expressed as east-positive rotation. */
export function getSurfaceOrientation(
  mode: TrackingMode, solar: SolarPosition, fixedTilt: number,
  fixedAzimuth: number, maximumAngle = 60,
): SurfaceOrientation {
  if (mode === "fixed" || !solar.isAboveHorizon) {
    return { trackerAngle: 0, tilt: fixedTilt, azimuth: fixedAzimuth };
  }
  const altitude = toRadians(solar.altitudeDegrees);
  const azimuth = toRadians(solar.azimuthDegrees);
  const east = Math.cos(altitude) * Math.sin(azimuth);
  const up = Math.sin(altitude);
  const ideal = clamp(toDegrees(Math.atan2(east, up)), -maximumAngle, maximumAngle);
  const trackerAngle = mode === "standard" ? ideal : mode === "reverse" ? -ideal : ideal * 0.55;
  return {
    trackerAngle,
    tilt: Math.abs(trackerAngle),
    azimuth: trackerAngle >= 0 ? 90 : 270,
  };
}

export function angleOfIncidence(
  solar: SolarPosition, surfaceTilt: number, surfaceAzimuth: number,
): number {
  if (!solar.isAboveHorizon) return 90;
  const zenith = toRadians(solar.zenithDegrees);
  const tilt = toRadians(surfaceTilt);
  const azimuthDifference = toRadians(solar.azimuthDegrees - surfaceAzimuth);
  const cosine = Math.cos(zenith) * Math.cos(tilt) +
    Math.sin(zenith) * Math.sin(tilt) * Math.cos(azimuthDifference);
  return toDegrees(Math.acos(clamp(cosine, -1, 1)));
}
