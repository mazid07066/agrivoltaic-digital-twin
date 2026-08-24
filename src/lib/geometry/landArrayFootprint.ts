export interface LandArrayFootprintInput {
  fieldLengthM: number;
  fieldWidthM: number;
  numberOfRows: number;
  modulesPerRow: number;
  rowSpacingM: number;
  moduleWidthM: number;
  moduleLengthM: number;
}

export interface LandArrayFootprint {
  fieldLengthM: number;
  fieldWidthM: number;
  rowCentreSpanM: number;
  requiredLengthM: number;
  requiredWidthM: number;
  lengthOverflowM: number;
  widthOverflowM: number;
  fitsLength: boolean;
  fitsWidth: boolean;
  fitsField: boolean;
  recommendedFieldLengthM: number;
  recommendedFieldWidthM: number;
  sceneLengthM: number;
  sceneWidthM: number;
}

function positive(
  value: number,
  fallback: number,
): number {
  return Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

export function calculateLandArrayFootprint({
  fieldLengthM,
  fieldWidthM,
  numberOfRows,
  modulesPerRow,
  rowSpacingM,
  moduleWidthM,
  moduleLengthM,
}: LandArrayFootprintInput): LandArrayFootprint {
  const safeFieldLength =
    positive(fieldLengthM, 1);

  const safeFieldWidth =
    positive(fieldWidthM, 1);

  const safeRows =
    Math.max(
      1,
      Math.floor(
        positive(numberOfRows, 1),
      ),
    );

  const safeModulesPerRow =
    Math.max(
      1,
      Math.floor(
        positive(modulesPerRow, 1),
      ),
    );

  const safeSpacing =
    positive(rowSpacingM, 1);

  const safeModuleWidth =
    positive(moduleWidthM, 1);

  const safeModuleLength =
    positive(moduleLengthM, 1);

  const rowCentreSpanM =
    Math.max(safeRows - 1, 0) *
    safeSpacing;

  const requiredLengthM =
    safeModulesPerRow *
    safeModuleWidth;

  /*
   * Full module length is used instead of its current
   * horizontal projection because a tracker may approach
   * zero tilt during operation.
   */
  const requiredWidthM =
    rowCentreSpanM +
    safeModuleLength;

  const lengthOverflowM =
    Math.max(
      0,
      requiredLengthM -
        safeFieldLength,
    );

  const widthOverflowM =
    Math.max(
      0,
      requiredWidthM -
        safeFieldWidth,
    );

  const fitsLength =
    lengthOverflowM <= 1e-9;

  const fitsWidth =
    widthOverflowM <= 1e-9;

  return {
    fieldLengthM:
      safeFieldLength,

    fieldWidthM:
      safeFieldWidth,

    rowCentreSpanM,

    requiredLengthM,

    requiredWidthM,

    lengthOverflowM,

    widthOverflowM,

    fitsLength,

    fitsWidth,

    fitsField:
      fitsLength &&
      fitsWidth,

    recommendedFieldLengthM:
      Math.ceil(
        Math.max(
          safeFieldLength,
          requiredLengthM,
        ),
      ),

    recommendedFieldWidthM:
      Math.ceil(
        Math.max(
          safeFieldWidth,
          requiredWidthM,
        ),
      ),

    /*
     * Additional space accommodates the electrical BOS,
     * camera orbit and a visible site boundary.
     */
    sceneLengthM:
      Math.max(
        safeFieldLength,
        requiredLengthM,
        54,
      ) +
      12,

    sceneWidthM:
      Math.max(
        safeFieldWidth,
        requiredWidthM,
      ) +
      32,
  };
}
