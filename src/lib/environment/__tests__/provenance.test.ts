import {
  describe,
  expect,
  it,
} from "vitest";

import {
  coordinateDistanceKm,
} from "../geography";

describe(
  "Phase 9B environmental provenance",
  () => {
    it(
      "returns zero distance for identical coordinates",
      () => {
        expect(
          coordinateDistanceKm(
            {
              latitude:
                23.8103,

              longitude:
                90.4125,
            },
            {
              latitude:
                23.8103,

              longitude:
                90.4125,
            },
          ),
        ).toBeCloseTo(
          0,
        );
      },
    );

    it(
      "calculates Open-Meteo grid displacement",
      () => {
        const distance =
          coordinateDistanceKm(
            {
              latitude:
                23.8103,

              longitude:
                90.4125,
            },
            {
              latitude:
                23.796133,

              longitude:
                90.38055,
            },
          );

        expect(
          distance,
        ).toBeGreaterThan(
          0,
        );

        expect(
          distance,
        ).toBeLessThan(
          10,
        );
      },
    );
  },
);
