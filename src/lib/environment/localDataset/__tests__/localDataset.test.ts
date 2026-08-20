import {
  describe,
  expect,
  it,
} from "vitest";

import {
  normalizeNumericValue,
} from "../normalize";

describe(
  "Phase 9B local environmental dataset",
  () => {
    it(
      "preserves metres per second",
      () => {
        expect(
          normalizeNumericValue(
            "5",
            "m/s",
          ),
        ).toBe(
          5,
        );
      },
    );

    it(
      "converts km/h to m/s",
      () => {
        expect(
          normalizeNumericValue(
            "36",
            "km/h",
          ),
        ).toBeCloseTo(
          10,
        );
      },
    );

    it(
      "treats NaN logger values as missing",
      () => {
        expect(
          normalizeNumericValue(
            "NaN",
            "W/m2",
          ),
        ).toBeNull();
      },
    );

    it(
      "treats large logger sentinels as missing",
      () => {
        expect(
          normalizeNumericValue(
            "1e+20",
            "W/m2",
          ),
        ).toBeNull();
      },
    );


    it(
      "returns null for missing values",
      () => {
        expect(
          normalizeNumericValue(
            "",
            "W/m2",
          ),
        ).toBeNull();
      },
    );
  },
);
