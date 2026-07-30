import type {
  FlatRoofGeometry,
  ModuleOrientation,
} from "@/lib/sites/schema";

export interface Rectangle2D {
  xM: number;
  yM: number;
  widthM: number;
  lengthM: number;
  areaM2: number;
}

export interface RoofModulePlacement {
  rowIndex: number;
  columnIndex: number;
  centerXM: number;
  centerYM: number;
  footprintWidthM: number;
  footprintLengthM: number;
}

export interface RectangularRoofLayout {
  roofAreaM2: number;
  usableArea: Rectangle2D;
  moduleOrientation: ModuleOrientation;
  moduleFootprintWidthM: number;
  moduleFootprintLengthM: number;
  rowPitchM: number;
  rows: number;
  modulesPerRow: number;
  moduleCount: number;
  installedCapacityKW: number;
  moduleAreaM2: number;
  usableAreaCoverageRatio: number;
  placements: RoofModulePlacement[];
  warnings: string[];
}

export interface RectangularRoofLayoutInput {
  geometry: FlatRoofGeometry;
  moduleWidthM: number;
  moduleLengthM: number;
  modulePowerW: number;
}

function assertFiniteNonNegative(
  value: number,
  name: string,
): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a finite non-negative number.`);
  }
}

function assertFinitePositive(
  value: number,
  name: string,
): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a finite positive number.`);
  }
}

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function normalizeAzimuthDeg(
  azimuthDeg: number,
): number {
  if (!Number.isFinite(azimuthDeg)) {
    throw new Error("Azimuth must be finite.");
  }

  return ((azimuthDeg % 360) + 360) % 360;
}

export function calculateUsableRoofRectangle(
  geometry: FlatRoofGeometry,
): Rectangle2D {
  assertFinitePositive(
    geometry.roofLengthM,
    "Roof length",
  );
  assertFinitePositive(
    geometry.roofWidthM,
    "Roof width",
  );

  const parapetInsetM =
    geometry.parapet.enabled
      ? geometry.parapet.widthM
      : 0;

  assertFiniteNonNegative(
    parapetInsetM,
    "Parapet width",
  );

  const northInsetM =
    geometry.setbacks.northM + parapetInsetM;
  const southInsetM =
    geometry.setbacks.southM + parapetInsetM;
  const eastInsetM =
    geometry.setbacks.eastM + parapetInsetM;
  const westInsetM =
    geometry.setbacks.westM + parapetInsetM;

  [
    ["North setback", northInsetM],
    ["South setback", southInsetM],
    ["East setback", eastInsetM],
    ["West setback", westInsetM],
  ].forEach(([name, value]) => {
    assertFiniteNonNegative(
      value as number,
      name as string,
    );
  });

  const usableLengthM =
    geometry.roofLengthM -
    northInsetM -
    southInsetM;

  const usableWidthM =
    geometry.roofWidthM -
    eastInsetM -
    westInsetM;

  if (usableLengthM <= 0 || usableWidthM <= 0) {
    throw new Error(
      "Setbacks and parapet width leave no usable rectangular roof area.",
    );
  }

  return {
    xM: westInsetM,
    yM: southInsetM,
    widthM: usableWidthM,
    lengthM: usableLengthM,
    areaM2: usableWidthM * usableLengthM,
  };
}

function modulePlanDimensions(
  orientation: ModuleOrientation,
  moduleWidthM: number,
  moduleLengthM: number,
  tiltDeg: number,
): {
  footprintWidthM: number;
  footprintLengthM: number;
} {
  assertFinitePositive(
    moduleWidthM,
    "Module width",
  );
  assertFinitePositive(
    moduleLengthM,
    "Module length",
  );

  if (
    !Number.isFinite(tiltDeg) ||
    tiltDeg < 0 ||
    tiltDeg > 90
  ) {
    throw new Error(
      "Array tilt must be between 0 and 90 degrees.",
    );
  }

  const crossSlopeDimensionM =
    orientation === "portrait"
      ? moduleWidthM
      : moduleLengthM;

  const slopeDimensionM =
    orientation === "portrait"
      ? moduleLengthM
      : moduleWidthM;

  return {
    footprintWidthM: crossSlopeDimensionM,
    footprintLengthM:
      slopeDimensionM *
      Math.cos(degreesToRadians(tiltDeg)),
  };
}

export function solveRectangularRoofLayout(
  input: RectangularRoofLayoutInput,
): RectangularRoofLayout {
  const {
    geometry,
    moduleWidthM,
    moduleLengthM,
    modulePowerW,
  } = input;

  assertFinitePositive(
    modulePowerW,
    "Module rated power",
  );
  assertFiniteNonNegative(
    geometry.array.rowSpacingM,
    "Row spacing",
  );
  assertFiniteNonNegative(
    geometry.buildingHeightM,
    "Building height",
  );
  assertFiniteNonNegative(
    geometry.array.rackHeightM,
    "Rack height",
  );

  const usableArea =
    calculateUsableRoofRectangle(geometry);

  const {
    footprintWidthM,
    footprintLengthM,
  } = modulePlanDimensions(
    geometry.array.orientation,
    moduleWidthM,
    moduleLengthM,
    geometry.array.tiltDeg,
  );

  if (footprintLengthM <= 0) {
    throw new Error(
      "A 90-degree array tilt has no usable horizontal plan footprint in this simple layout model.",
    );
  }

  const rowPitchM =
    footprintLengthM +
    geometry.array.rowSpacingM;

  const modulesPerRow = Math.floor(
    usableArea.widthM / footprintWidthM,
  );

  const rows = Math.floor(
    (
      usableArea.lengthM +
      geometry.array.rowSpacingM
    ) / rowPitchM,
  );

  const moduleCount =
    Math.max(0, rows) *
    Math.max(0, modulesPerRow);

  const placements: RoofModulePlacement[] = [];

  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    for (
      let columnIndex = 0;
      columnIndex < modulesPerRow;
      columnIndex += 1
    ) {
      placements.push({
        rowIndex,
        columnIndex,
        centerXM:
          usableArea.xM +
          footprintWidthM / 2 +
          columnIndex * footprintWidthM,
        centerYM:
          usableArea.yM +
          footprintLengthM / 2 +
          rowIndex * rowPitchM,
        footprintWidthM,
        footprintLengthM,
      });
    }
  }

  const moduleAreaM2 =
    moduleCount *
    moduleWidthM *
    moduleLengthM;

  const warnings: string[] = [];

  if (moduleCount === 0) {
    warnings.push(
      "No module fits inside the usable roof rectangle.",
    );
  }

  if (geometry.parapet.enabled) {
    warnings.push(
      "Parapet width is excluded from usable area; time-dependent parapet shading is not yet calculated in Phase 8C-1.",
    );
  }

  if (geometry.roofSlopeDeg !== 0) {
    warnings.push(
      "Roof slope is retained as metadata; this simple flat-roof layout uses horizontal plan dimensions.",
    );
  }

  warnings.push(
    "Preliminary geometry and energy preparation only. A qualified structural engineer must verify roof capacity, uplift, anchoring, ballast, waterproofing, drainage, fire access and local-code compliance.",
  );

  return {
    roofAreaM2:
      geometry.roofLengthM *
      geometry.roofWidthM,
    usableArea,
    moduleOrientation:
      geometry.array.orientation,
    moduleFootprintWidthM:
      footprintWidthM,
    moduleFootprintLengthM:
      footprintLengthM,
    rowPitchM,
    rows: Math.max(0, rows),
    modulesPerRow:
      Math.max(0, modulesPerRow),
    moduleCount,
    installedCapacityKW:
      (moduleCount * modulePowerW) / 1000,
    moduleAreaM2,
    usableAreaCoverageRatio:
      usableArea.areaM2 > 0
        ? moduleAreaM2 / usableArea.areaM2
        : 0,
    placements,
    warnings,
  };
}
