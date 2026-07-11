export type TrackingMode =
  | "fixed"
  | "standard"
  | "reverse"
  | "custom";

export type CropId =
  | "tomato"
  | "lettuce"
  | "spinach"
  | "potato"
  | "rice"
  | "wheat";

export interface CropProfile {
  id: CropId;
  name: string;
  scientificName: string;
  minimumDLI: number;
  optimumDLI: number;
  maximumDLI: number;
  shadeTolerance: "low" | "medium" | "high";
  color: string;
}

export interface SiteConfiguration {
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  fieldLength: number;
  fieldWidth: number;
}

export interface PVConfiguration {
  numberOfRows: number;
  modulesPerRow: number;
  moduleWidth: number;
  moduleLength: number;
  modulePower: number;
  rowSpacing: number;
  panelHeight: number;
  tilt: number;
  azimuth: number;
  systemEfficiency: number;
  trackingMode: TrackingMode;
  groundAlbedo: number;
  maximumTrackerAngle: number;
}

export interface SimulationConfiguration {
  site: SiteConfiguration;
  pv: PVConfiguration;
  cropId: CropId;
  simulationDate: string;
}

export interface HourlySimulationPoint {
  hour: string;
  irradiance: number;
  cropIrradiance: number;
  pvPower: number;
  shadePercentage: number;
  solarAltitude: number;
  solarZenith: number;
  solarAzimuth: number;
  trackerAngle: number;
  surfaceTilt: number;
  surfaceAzimuth: number;
  angleOfIncidence: number;
  poaBeam: number;
  poaSkyDiffuse: number;
  poaGroundReflected: number;
  poaIrradiance: number;
}

export interface SimulationResults {
  installedCapacityKW: number;
  dailyEnergyKWh: number;
  openFieldDLI: number;
  cropDLI: number;
  dliAchievement: number;
  cropLightReduction: number;
  estimatedCropYield: number;
  landEquivalentRatio: number;
  groundCoverageRatio: number;
  dataSource: "synthetic" | "open-meteo";
  hourly: HourlySimulationPoint[];
  spatialLight: SpatialLightResults;
}

export interface SpatialLightCell {
  row: number;
  column: number;
  x: number;
  z: number;
  dli: number;
  relativeDLI: number;
  zone: "beneath-panel" | "between-row" | "outer-field";
  hourlyShade: number[];
}

export interface SpatialZoneSummary {
  zone: SpatialLightCell["zone"];
  label: string;
  cellCount: number;
  meanDLI: number;
  meanRelativeDLI: number;
}

export interface SpatialLightResults {
  rows: number;
  columns: number;
  minimumDLI: number;
  meanDLI: number;
  maximumDLI: number;
  coefficientOfVariation: number;
  cells: SpatialLightCell[];
  zoneSummaries: SpatialZoneSummary[];
}
