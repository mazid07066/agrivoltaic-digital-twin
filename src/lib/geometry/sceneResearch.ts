export type ResearchCameraView =
  | "perspective"
  | "top"
  | "front"
  | "side";

export type ResearchCameraPosition = [
  number,
  number,
  number,
];

function scaledCoordinate(
  distance: number,
  multiplier: number,
): number {
  return Number(
    (
      distance *
      multiplier
    ).toFixed(
      10,
    ),
  );
}

export function getResearchCameraPosition(
  distance: number,
  view: ResearchCameraView,
): ResearchCameraPosition {
  const safeDistance =
    Number.isFinite(distance) &&
    distance > 0
      ? distance
      : 40;

  switch (view) {
    case "top":
      return [
        0,
        scaledCoordinate(safeDistance, 0.98),
        0.01,
      ];

    case "front":
      return [
        0,
        scaledCoordinate(safeDistance, 0.28),
        scaledCoordinate(safeDistance, 0.95),
      ];

    case "side":
      return [
        scaledCoordinate(safeDistance, 0.95),
        scaledCoordinate(safeDistance, 0.28),
        0,
      ];

    default:
      return [
        scaledCoordinate(safeDistance, 0.62),
        scaledCoordinate(safeDistance, 0.48),
        scaledCoordinate(safeDistance, 0.72),
      ];
  }
}

function slug(
  value: string,
): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-",
      )
      .replace(
        /^-+|-+$/g,
        "",
      ) ||
    "agritwin-site"
  );
}

export function researchSnapshotBasename({
  siteName,
  simulationDate,
  hour,
  view,
}: {
  siteName: string;
  simulationDate: string;
  hour: number;
  view: ResearchCameraView;
}): string {
  const hourText =
    String(
      hour,
    ).padStart(
      2,
      "0",
    );

  return [
    slug(siteName),
    simulationDate,
    `${hourText}00`,
    view,
    "digital-twin",
  ].join(
    "_",
  );
}
