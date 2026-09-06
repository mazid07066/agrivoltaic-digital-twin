import {
  describe,
  expect,
  it,
} from "vitest";

import {
  canonicalUnitForVariable,
  convertValidationValue,
} from "@/lib/validationStudio";

describe(
  "Phase 12 validation units",
  () => {
    it(
      "defines canonical units",
      () => {
        expect(
          canonicalUnitForVariable(
            "acPowerKw",
          ),
        ).toBe(
          "kW",
        );

        expect(
          canonicalUnitForVariable(
            "poaWm2",
          ),
        ).toBe(
          "W/m2",
        );
      },
    );

    it(
      "converts W to kW",
      () => {
        expect(
          convertValidationValue(
            125000,
            "W",
            "kW",
          ),
        ).toBeCloseTo(
          125,
          12,
        );
      },
    );

    it(
      "converts MW to kW",
      () => {
        expect(
          convertValidationValue(
            0.125,
            "MW",
            "kW",
          ),
        ).toBeCloseTo(
          125,
          12,
        );
      },
    );

    it(
      "converts Wh to kWh",
      () => {
        expect(
          convertValidationValue(
            2500,
            "Wh",
            "kWh",
          ),
        ).toBeCloseTo(
          2.5,
          12,
        );
      },
    );
  },
);
