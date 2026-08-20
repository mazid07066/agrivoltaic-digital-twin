export function kilometresPerHourToMetresPerSecond(
  value: number,
): number {
  return value / 3.6;
}

export function metresPerSecondToKilometresPerHour(
  value: number,
): number {
  return value * 3.6;
}

export function wattsPerSquareMetreHoursToKilowattHoursPerSquareMetre(
  values: number[],
): number {
  const totalWhM2 =
    values.reduce(
      (sum, value) =>
        sum + value,
      0,
    );

  return totalWhM2 / 1000;
}
