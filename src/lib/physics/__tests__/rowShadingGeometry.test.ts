import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateGeometricRowShading,
} from "@/lib/physics";

const BASE_INPUT = {
  rowCount:
    21,

  rowPitchM:
    4,

  collectorWidthM:
    2.078,

  surfaceTiltDeg:
    22,

  surfaceAzimuthDeg:
    180,

  solarElevationDeg:
    15,

  solarAzimuthDeg:
    180,

  directWm2:
    600,

  diffuseWm2:
    100,

  groundReflectedWm2:
    20,
};

describe(
  "Phase 9O relative PV row-shading geometry",
  () => {
    it(
      "uses approximately 0.778 m relative collector rise for a 2.078 m collector at 22 degrees",
      () => {
        const result =
          calculateGeometricRowShading(
            {
              ...BASE_INPUT,

              clearanceM:
                2,
            },
          );

        expect(
          result
            .collectorVerticalRiseM,
        ).toBeCloseTo(
          0.778,
          3,
        );
      },
    );

    it(
      "makes equal-height PV row shading invariant to common mounting clearance",
      () => {
        const low =
          calculateGeometricRowShading(
            {
              ...BASE_INPUT,

              clearanceM:
                0.5,
            },
          );

        const high =
          calculateGeometricRowShading(
            {
              ...BASE_INPUT,

              clearanceM:
                5,
            },
          );

        expect(
          low
            .geometricShadeFraction,
        ).toBeCloseTo(
          high
            .geometricShadeFraction,
          12,
        );

        expect(
          low.meanPvFactor,
        ).toBeCloseTo(
          high.meanPvFactor,
          12,
        );

        expect(
          low
            .pvRowShadowReachM,
        ).toBeCloseTo(
          high
            .pvRowShadowReachM,
          12,
        );
      },
    );

    it(
      "keeps absolute mounting clearance relevant to ground and crop shadow",
      () => {
        const low =
          calculateGeometricRowShading(
            {
              ...BASE_INPUT,

              clearanceM:
                0.5,
            },
          );

        const high =
          calculateGeometricRowShading(
            {
              ...BASE_INPUT,

              clearanceM:
                5,
            },
          );

        expect(
          high
            .groundShadowReachM,
        ).toBeGreaterThan(
          low
            .groundShadowReachM,
        );

        expect(
          high
            .groundGeometricShadeFraction,
        ).toBeGreaterThanOrEqual(
          low
            .groundGeometricShadeFraction,
        );
      },
    );

    it(
      "responds to collector tilt independently of absolute mounting clearance",
      () => {
        const shallow =
          calculateGeometricRowShading(
            {
              ...BASE_INPUT,

              surfaceTiltDeg:
                10,

              clearanceM:
                2,
            },
          );

        const steep =
          calculateGeometricRowShading(
            {
              ...BASE_INPUT,

              surfaceTiltDeg:
                40,

              clearanceM:
                2,
            },
          );

        expect(
          shallow
            .collectorVerticalRiseM,
        ).not.toBeCloseTo(
          steep
            .collectorVerticalRiseM,
          6,
        );

        expect(
          shallow
            .pvRowShadowReachM,
        ).not.toBeCloseTo(
          steep
            .pvRowShadowReachM,
          6,
        );
      },
    );

    it(
      "produces zero PV row shading when the solar geometry does not reach the next row",
      () => {
        const result =
          calculateGeometricRowShading(
            {
              ...BASE_INPUT,

              solarElevationDeg:
                75,

              clearanceM:
                2,
            },
          );

        expect(
          result
            .geometricShadeFraction,
        ).toBe(
          0,
        );
      },
    );
  },
);

describe(
  "Phase 9O shared Land/Rooftop geometry contract",
  () => {
    it(
      "does not use absolute clearance in equal-height PV-to-PV obstruction geometry",
      () => {
        const oneMetre =
          calculateGeometricRowShading(
            {
              ...BASE_INPUT,
              clearanceM: 1,
            },
          );

        const fourMetres =
          calculateGeometricRowShading(
            {
              ...BASE_INPUT,
              clearanceM: 4,
            },
          );

        expect(
          oneMetre.collectorVerticalRiseM,
        ).toBeCloseTo(
          fourMetres.collectorVerticalRiseM,
          12,
        );

        expect(
          oneMetre.pvRowShadowReachM,
        ).toBeCloseTo(
          fourMetres.pvRowShadowReachM,
          12,
        );

        expect(
          oneMetre.geometricShadeFraction,
        ).toBeCloseTo(
          fourMetres.geometricShadeFraction,
          12,
        );
      },
    );
  },
);
