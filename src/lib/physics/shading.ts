import {
  clamp,
  toRadians,
} from "./math";

export interface RowShadingInput {
  rowCount: number;
  rowPitchM: number;
  collectorWidthM: number;

  /**
   * Absolute lower-edge clearance above the local ground plane.
   *
   * This value must not be added to equal-height PV-to-PV
   * row obstruction geometry. It is retained for ground/crop
   * shadow geometry.
   */
  clearanceM: number;

  surfaceTiltDeg: number;
  surfaceAzimuthDeg: number;
  solarElevationDeg: number;
  solarAzimuthDeg: number;

  directWm2: number;
  diffuseWm2: number;
  groundReflectedWm2: number;
}

export interface RowShadingResult {
  rowFactors: number[];
  meanPvFactor: number;

  cropGroundIrradianceWm2: number;

  /**
   * PV-to-PV row shading fraction.
   *
   * For equal-height rows this depends on relative collector
   * geometry and is invariant to a common mounting clearance.
   */
  geometricShadeFraction: number;

  /**
   * Ground/crop geometric shading fraction.
   *
   * Absolute collector clearance remains relevant here because
   * the receiving plane is the ground.
   */
  groundGeometricShadeFraction: number;

  /**
   * Relative vertical rise of the collector.
   */
  collectorVerticalRiseM: number;

  /**
   * Horizontal collector projection.
   */
  collectorHorizontalProjectionM: number;

  /**
   * Effective PV-to-PV shadow reach in the profile plane.
   */
  pvRowShadowReachM: number;

  /**
   * Effective collector-to-ground shadow reach in the
   * profile plane.
   */
  groundShadowReachM: number;
}

export function calculateGeometricRowShading(
  input: RowShadingInput,
): RowShadingResult {
  const rowCount =
    Math.max(
      1,
      Math.round(
        input.rowCount,
      ),
    );

  if (
    input.solarElevationDeg <=
    0
  ) {
    return {
      rowFactors:
        Array.from(
          {
            length:
              rowCount,
          },
          () => 1,
        ),

      meanPvFactor:
        1,

      cropGroundIrradianceWm2:
        0,

      geometricShadeFraction:
        0,

      groundGeometricShadeFraction:
        0,

      collectorVerticalRiseM:
        0,

      collectorHorizontalProjectionM:
        0,

      pvRowShadowReachM:
        0,

      groundShadowReachM:
        0,
    };
  }

  const elevation =
    toRadians(
      input.solarElevationDeg,
    );

  const azimuthDifference =
    toRadians(
      input.solarAzimuthDeg -
        input.surfaceAzimuthDeg,
    );

  const profileElevation =
    Math.atan2(
      Math.tan(
        elevation,
      ),

      Math.max(
        0.05,
        Math.abs(
          Math.cos(
            azimuthDifference,
          ),
        ),
      ),
    );

  const tilt =
    toRadians(
      input.surfaceTiltDeg,
    );

  const collectorVerticalRiseM =
    Math.max(
      0,
      input.collectorWidthM *
        Math.sin(
          tilt,
        ),
    );

  const collectorHorizontalProjectionM =
    Math.max(
      0,
      input.collectorWidthM *
        Math.cos(
          tilt,
        ),
    );

  const profileTangent =
    Math.max(
      Math.tan(
        profileElevation,
      ),
      0.001,
    );

  /*
   * PV-to-PV self shading:
   *
   * Both equal-height rows share the same absolute clearance,
   * therefore the common elevation cancels.
   *
   * source upper edge:
   *   clearance + collectorVerticalRise
   *
   * receiver lower edge:
   *   clearance
   *
   * relative obstruction:
   *   collectorVerticalRise
   */
  const pvRowShadowReachM =
    collectorHorizontalProjectionM +
    collectorVerticalRiseM /
      profileTangent;

  const pvRowOverlapM =
    Math.max(
      0,
      pvRowShadowReachM -
        input.rowPitchM,
    );

  const geometricShadeFraction =
    clamp(
      pvRowOverlapM /
        Math.max(
          input.collectorWidthM,
          0.001,
        ),
      0,
      1,
    );

  /*
   * Collector-to-ground/crop shading:
   *
   * The receiving plane is now z = 0, so absolute collector
   * clearance remains physically relevant.
   */
  const upperEdgeHeightAboveGroundM =
    Math.max(
      0,
      input.clearanceM,
    ) +
    collectorVerticalRiseM;

  const groundShadowReachM =
    collectorHorizontalProjectionM +
    upperEdgeHeightAboveGroundM /
      profileTangent;

  /*
   * Preserve the previous aggregate crop-ground shading
   * convention while separating its geometry from PV self
   * shading.
   */
  const groundOverlapM =
    Math.max(
      0,
      groundShadowReachM -
        input.rowPitchM,
    );

  const groundGeometricShadeFraction =
    clamp(
      groundOverlapM /
        Math.max(
          input.collectorWidthM,
          0.001,
        ),
      0,
      1,
    );

  /*
   * PV optical reduction uses the PV-to-PV shading fraction.
   */
  const beamFactor =
    1 -
    geometricShadeFraction;

  const diffuseFactor =
    1 -
    0.25 *
      geometricShadeFraction;

  const groundFactor =
    1 -
    0.6 *
      geometricShadeFraction;

  const unshadedTotal =
    input.directWm2 +
    input.diffuseWm2 +
    input.groundReflectedWm2;

  const shadedTotal =
    input.directWm2 *
      beamFactor +
    input.diffuseWm2 *
      diffuseFactor +
    input.groundReflectedWm2 *
      groundFactor;

  const shadedFactor =
    unshadedTotal > 0
      ? clamp(
          shadedTotal /
            unshadedTotal,
          0,
          1,
        )
      : 1;

  const rowFactors =
    [
      1,

      ...Array.from(
        {
          length:
            rowCount - 1,
        },

        () =>
          shadedFactor,
      ),
    ];

  const meanPvFactor =
    rowFactors.reduce(
      (
        sum,
        value,
      ) =>
        sum +
        value,
      0,
    ) /
    rowFactors.length;

  /*
   * Crop/ground irradiance uses the independent absolute-height
   * ground shading geometry.
   */
  const cropGroundIrradianceWm2 =
    Math.max(
      0,

      input.directWm2 *
        (
          1 -
          groundGeometricShadeFraction
        ) +
        input.diffuseWm2,
    );

  return {
    rowFactors,
    meanPvFactor,

    cropGroundIrradianceWm2,

    geometricShadeFraction,

    groundGeometricShadeFraction,

    collectorVerticalRiseM,

    collectorHorizontalProjectionM,

    pvRowShadowReachM,

    groundShadowReachM,
  };
}
