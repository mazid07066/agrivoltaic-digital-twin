export interface MpptAllocationLimits {
  mpptCount: number;
  totalStrings: number;
  maximumStringsPerMppt: number;
}

export interface MpptAllocationValidation {
  valid: boolean;
  allocation: number[];
  errors: string[];
}

export function createBalancedMpptAllocation(
  totalStrings: number,
  mpptCount: number,
): number[] {
  const normalizedMpptCount = Math.max(1, Math.round(mpptCount));
  const normalizedTotalStrings = Math.max(0, Math.round(totalStrings));
  const base = Math.floor(normalizedTotalStrings / normalizedMpptCount);
  const remainder = normalizedTotalStrings % normalizedMpptCount;

  return Array.from(
    { length: normalizedMpptCount },
    (_, index) => base + (index < remainder ? 1 : 0),
  );
}

export function parseMpptAllocation(value: string): number[] | null {
  const tokens = value
    .replaceAll("[", "")
    .replaceAll("]", "")
    .split(/[\s,;]+/)
    .filter(Boolean);

  if (tokens.length === 0) {
    return null;
  }

  const allocation = tokens.map(Number);

  return allocation.every(Number.isFinite)
    ? allocation
    : null;
}

export function validateMpptAllocation(
  allocation: readonly number[],
  limits: MpptAllocationLimits,
): MpptAllocationValidation {
  const normalized = [...allocation];
  const errors: string[] = [];

  if (normalized.length !== limits.mpptCount) {
    errors.push(
      `Enter exactly ${limits.mpptCount} values because the selected inverter has ${limits.mpptCount} MPPT inputs.`,
    );
  }

  if (
    normalized.some(
      (value) => !Number.isInteger(value) || value < 0,
    )
  ) {
    errors.push("Every MPPT allocation must be a non-negative whole number.");
  }

  const allocatedStrings = normalized.reduce(
    (sum, value) => sum + value,
    0,
  );

  if (allocatedStrings !== limits.totalStrings) {
    errors.push(
      `The allocation assigns ${allocatedStrings} strings; it must assign exactly ${limits.totalStrings}.`,
    );
  }

  if (
    normalized.some(
      (value) => value > limits.maximumStringsPerMppt,
    )
  ) {
    errors.push(
      `No MPPT may exceed ${limits.maximumStringsPerMppt} strings for the selected inverter.`,
    );
  }

  return {
    valid: errors.length === 0,
    allocation: normalized,
    errors,
  };
}

export function resolveMpptAllocation(
  explicitAllocation: readonly number[] | null | undefined,
  limits: MpptAllocationLimits,
): number[] {
  if (!explicitAllocation) {
    return createBalancedMpptAllocation(
      limits.totalStrings,
      limits.mpptCount,
    );
  }

  const validation = validateMpptAllocation(
    explicitAllocation,
    limits,
  );

  if (!validation.valid) {
    throw new Error(validation.errors.join(" "));
  }

  return validation.allocation;
}
