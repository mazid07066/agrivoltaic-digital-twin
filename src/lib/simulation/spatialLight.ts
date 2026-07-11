import { HourlySimulationPoint, SimulationConfiguration, SpatialLightCell, SpatialLightResults } from "@/types/simulation";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function calculateSpatialLight(
  configuration: SimulationConfiguration,
  hourly: HourlySimulationPoint[],
  rows = 14,
  columns = 28,
): SpatialLightResults {
  const { site, pv } = configuration;
  const rowPositions = Array.from({ length: pv.numberOfRows }, (_, index) =>
    -(Math.max(pv.numberOfRows - 1, 0) * pv.rowSpacing) / 2 + index * pv.rowSpacing,
  );
  const arrayHalfLength = Math.min(pv.modulesPerRow * pv.moduleWidth / 2, site.fieldLength / 2);
  const panelGroundWidth = Math.max(pv.moduleLength * Math.cos(pv.tilt * Math.PI / 180), 0.25);
  const cellWidth = site.fieldLength / columns;
  const cellDepth = site.fieldWidth / rows;

  const cells: SpatialLightCell[] = Array.from({ length: rows * columns }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const x = -site.fieldLength / 2 + (column + 0.5) * cellWidth;
    const z = -site.fieldWidth / 2 + (row + 0.5) * cellDepth;
    const beneath = Math.abs(x) <= arrayHalfLength && rowPositions.some(
      (panelZ) => Math.abs(z - panelZ) <= panelGroundWidth / 2,
    );
    const insideArray = Math.abs(x) <= arrayHalfLength && rowPositions.length > 0 &&
      z >= Math.min(...rowPositions) - pv.rowSpacing / 2 &&
      z <= Math.max(...rowPositions) + pv.rowSpacing / 2;
    const zone: SpatialLightCell["zone"] = beneath
      ? "beneath-panel" : insideArray ? "between-row" : "outer-field";
    let openEnergy = 0;
    let cropEnergy = 0;
    const hourlyShade: number[] = [];

    for (const point of hourly) {
      openEnergy += point.irradiance;
      if (point.solarAltitude <= 0 || point.irradiance <= 0) {
        hourlyShade.push(0);
        continue;
      }
      const altitude = point.solarAltitude * Math.PI / 180;
      const azimuth = point.solarAzimuth * Math.PI / 180;
      const shadowLength = pv.panelHeight / Math.max(Math.tan(altitude), 0.12);
      const shadowShiftX = -Math.sin(azimuth) * shadowLength;
      const shadowShiftZ = Math.cos(azimuth) * shadowLength;
      const projectedWidth = Math.max(
        pv.moduleLength * Math.abs(Math.cos(point.surfaceTilt * Math.PI / 180)), 0.25,
      );
      const withinRowLength = Math.abs(x - shadowShiftX) <= arrayHalfLength;
      const shaded = withinRowLength && rowPositions.some(
        (panelZ) => Math.abs(z - (panelZ + shadowShiftZ)) <= projectedWidth / 2,
      );
      hourlyShade.push(shaded ? 100 : 0);
      const diffuseFraction = point.irradiance > 0
        ? clamp((point.cropIrradiance - point.irradiance * (1 - point.shadePercentage / 100)) /
          point.irradiance, 0.08, 0.65) : 0;
      cropEnergy += shaded ? point.irradiance * diffuseFraction : point.irradiance;
    }

    const dli = cropEnergy * 0.45 * 4.57 * 3600 / 1_000_000;
    const openDLI = openEnergy * 0.45 * 4.57 * 3600 / 1_000_000;
    return { row, column, x: Number(x.toFixed(2)), z: Number(z.toFixed(2)),
      dli: Number(dli.toFixed(2)), relativeDLI: Number((openDLI > 0 ? dli / openDLI * 100 : 0).toFixed(1)),
      zone, hourlyShade };
  });

  const values = cells.map((cell) => cell.dli);
  const mean = values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(values.length, 1);
  const labels = { "beneath-panel": "Beneath panels", "between-row": "Between rows", "outer-field": "Outer field" } as const;
  const zones = ["beneath-panel", "between-row", "outer-field"] as const;
  const zoneSummaries = zones.map((zone) => {
    const group = cells.filter((cell) => cell.zone === zone);
    const divisor = Math.max(group.length, 1);
    return { zone, label: labels[zone], cellCount: group.length,
      meanDLI: Number((group.reduce((sum, cell) => sum + cell.dli, 0) / divisor).toFixed(2)),
      meanRelativeDLI: Number((group.reduce((sum, cell) => sum + cell.relativeDLI, 0) / divisor).toFixed(1)) };
  });
  return { rows, columns, minimumDLI: Number(Math.min(...values).toFixed(2)), meanDLI: Number(mean.toFixed(2)),
    maximumDLI: Number(Math.max(...values).toFixed(2)),
    coefficientOfVariation: Number((mean > 0 ? Math.sqrt(variance) / mean * 100 : 0).toFixed(1)),
    cells, zoneSummaries };
}
