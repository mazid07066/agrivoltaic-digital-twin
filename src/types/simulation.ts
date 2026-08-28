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
  moduleProfileId: string;

  /**
   * Optional for backward compatibility with site versions
   * saved before final Phase 9 equipment wiring.
   */
  inverterProfileId?: string;

  /**
   * Number of identical inverter units assigned to the
   * PV array.
   */
  inverterCount?: number | null;

  /**
   * Explicit electrical string design. These must not be
   * inferred from physical modulesPerRow.
   */
  modulesPerString?: number | null;

  /**
   * Total strings assigned to each identical inverter unit.
   */
  stringsPerInverter?: number | null;

  /**
   * Derived maximum number of parallel strings assigned to
   * any one MPPT input.
   */
  stringsPerMppt?: number | null;

  /**
   * Exact number of strings assigned to each MPPT on every
   * identical inverter, in MPPT order. For the six-input SMA
   * inverter, seven strings may be represented as
   * [1, 1, 1, 1, 1, 2].
   */
  mpptStringAllocation?: number[] | null;

  minimumDesignTemperatureC?: number | null;

  /**
   * Maximum expected PV cell temperature used for the
   * hot-side MPPT voltage-floor calculation.
   */
  maximumDesignCellTemperatureC?: number | null;

  /**
   * Multiplier applied to design current. Use 1 for
   * monofacial modules and a documented value above 1
   * for bifacial rear-side gain.
   */
  bifacialCurrentFactor?: number | null;

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
  moduleEfficiency: number;
  moduleNOCT: number;
  temperatureCoefficientPmax: number;
  moduleVoc: number | null;
  moduleVmpp: number | null;
  moduleIsc: number | null;
  moduleImpp: number | null;

  /** Phase 9H–9L versioned physics/loss configuration. */
  physicsConfiguration?: import("@/lib/physics/types").PhysicsModelConfiguration;

  /** Optional manufacturer temperature coefficients used by physics mode. */
  moduleTempCoeffVocPercentPerC?: number | null;
  moduleTempCoeffIscPercentPerC?: number | null;
  moduleCellsInSeries?: number | null;
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
  deliveredAcPowerKw?: number;
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
  operatingMode: "fixed" | "standard" | "reverse";
  moduleTemperature: number;
  temperatureFactor: number;
  physics?: import("@/lib/physics/types").PhysicsTimestepResult;
}

export interface AdaptiveControllerResults {
  enabled: boolean;
  targetDLI: number;
  predictedDLI: number;
  targetSatisfied: boolean;
  standardTrackingHours: number;
  reverseTrackingHours: number;
  schedule: Array<"standard" | "reverse">;
  protectionBasis: "beneath-panel";
  wholeFieldDLI: number;
  protectedZoneDLI: number;
  effectiveControllerTarget: number;
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
  adaptiveController: AdaptiveControllerResults;
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
