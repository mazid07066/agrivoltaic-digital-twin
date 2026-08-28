import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createBalancedMpptAllocation,
  parseMpptAllocation,
  validateMpptAllocation,
} from "../mpptAllocation";

const limits = {
  mpptCount: 6,
  totalStrings: 7,
  maximumStringsPerMppt: 2,
};

describe("editable MPPT string allocation", () => {
  it("accepts seven strings with the doubled input last", () => {
    const result = validateMpptAllocation(
      [1, 1, 1, 1, 1, 2],
      limits,
    );

    expect(result.valid).toBe(true);
    expect(result.allocation).toEqual([
      1,
      1,
      1,
      1,
      1,
      2,
    ]);
  });

  it("rejects seven entries and a total of eight strings", () => {
    const result = validateMpptAllocation(
      [1, 1, 1, 1, 1, 1, 2],
      limits,
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Enter exactly 6 values because the selected inverter has 6 MPPT inputs.",
    );
    expect(result.errors).toContain(
      "The allocation assigns 8 strings; it must assign exactly 7.",
    );
  });

  it("keeps the existing balanced allocation as the default", () => {
    expect(
      createBalancedMpptAllocation(7, 6),
    ).toEqual([2, 1, 1, 1, 1, 1]);

    expect(
      parseMpptAllocation("1, 1, 1, 1, 1, 2"),
    ).toEqual([1, 1, 1, 1, 1, 2]);
  });
});
