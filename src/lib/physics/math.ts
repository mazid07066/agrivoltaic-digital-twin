export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

export function toRadians(value: number): number {
  return value * DEG_TO_RAD;
}

export function toDegrees(value: number): number {
  return value * RAD_TO_DEG;
}

export function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

export function round(value: number, places = 6): number {
  return Number(value.toFixed(places));
}
