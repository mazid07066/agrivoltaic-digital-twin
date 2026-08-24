import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateLandArrayFootprint,
} from "../landArrayFootprint";

describe(
  "land agrivoltaic physical footprint",
  () => {
    it(
      "detects the current 21-row overflow",
      () => {
        const result =
          calculateLandArrayFootprint({
            fieldLengthM: 44,
            fieldWidthM: 20,
            numberOfRows: 21,
            modulesPerRow: 17,
            rowSpacingM: 4,
            moduleWidthM: 0.992,
            moduleLengthM: 2.078,
          });

        expect(
          result.requiredLengthM,
        ).toBeCloseTo(16.864);

        expect(
          result.rowCentreSpanM,
        ).toBe(80);

        expect(
          result.requiredWidthM,
        ).toBeCloseTo(82.078);

        expect(
          result.fitsField,
        ).toBe(false);

        expect(
          result.recommendedFieldWidthM,
        ).toBe(83);
      },
    );

    it(
      "includes panel depth beyond the outer row centres",
      () => {
        const result =
          calculateLandArrayFootprint({
            fieldLengthM: 44,
            fieldWidthM: 20,
            numberOfRows: 6,
            modulesPerRow: 10,
            rowSpacingM: 4,
            moduleWidthM: 0.992,
            moduleLengthM: 2.078,
          });

        expect(
          result.rowCentreSpanM,
        ).toBe(20);

        expect(
          result.requiredWidthM,
        ).toBeCloseTo(22.078);

        expect(
          result.fitsWidth,
        ).toBe(false);
      },
    );

    it(
      "passes after the field is physically enlarged",
      () => {
        const result =
          calculateLandArrayFootprint({
            fieldLengthM: 44,
            fieldWidthM: 84,
            numberOfRows: 21,
            modulesPerRow: 17,
            rowSpacingM: 4,
            moduleWidthM: 0.992,
            moduleLengthM: 2.078,
          });

        expect(
          result.fitsField,
        ).toBe(true);

        expect(
          result.widthOverflowM,
        ).toBe(0);
      },
    );
  },
);
