export type SimulationModelMode =
  | "legacy_parity"
  | "physics_research"
  | "reference_validation";

export type ParameterSourceCategory =
  | "manufacturer"
  | "measured"
  | "standard_reference"
  | "user_assumption"
  | "calibrated"
  | "estimated";

export type IrradianceTranspositionModel =
  | "isotropic"
  | "perez";

export type IamModel =
  | "none"
  | "martin_ruiz";

export type ThermalModel =
  | "simple_noct"
  | "faiman"
  | "pvsyst";

export type ModuleElectricalModel =
  | "simple_power"
  | "single_diode";

export type ResearchTrackingMode =
  | "fixed_tilt"
  | "true_tracking"
  | "standard_backtracking"
  | "adaptive_custom"
  | "measured_scada";

export interface SourcedParameter {
  value: number;
  unit: string;
  sourceCategory: ParameterSourceCategory;
  sourceReference?: string;
  enabled: boolean;
}

export interface ExplicitLossConfiguration {
  schemaVersion: "agritwin-explicit-loss-v1";
  soiling: SourcedParameter;
  moduleQuality: SourcedParameter;
  moduleMismatch: SourcedParameter;
  stringMismatch: SourcedParameter;
  dcOhmic: SourcedParameter;
  acOhmic: SourcedParameter;
  transformer: SourcedParameter;
  auxiliary: SourcedParameter;
  availability: SourcedParameter;
  degradationAnnual: SourcedParameter;
  curtailment: SourcedParameter;
}

export interface PhysicsModelConfiguration {
  schemaVersion: "agritwin-physics-model-v1";
  mode: SimulationModelMode;
  solarPositionModel: "legacy_suncalc" | "spa_equivalent";
  trackingModel: ResearchTrackingMode;
  axisTiltDeg: number;
  axisAzimuthDeg: number;
  crossAxisSlopeDeg: number;
  backtrackingEnabled: boolean;
  stowAngleDeg: number;
  irradianceModel: IrradianceTranspositionModel;
  iamModel: IamModel;
  martinRuizAr: number;
  thermalModel: ThermalModel;
  faimanU0: number;
  faimanU1: number;
  pvsystUc: number;
  pvsystUv: number;
  moduleAbsorption: number;
  moduleElectricalModel: ModuleElectricalModel;
  minimumDesignCellTemperatureC: number;
  commissioningDate: string | null;
  measuredTrackerAngleDeg: number | null;
  losses: ExplicitLossConfiguration;
}

export type LossStageDomain =
  | "optical"
  | "dc"
  | "mppt"
  | "inverter"
  | "ac"
  | "auxiliary"
  | "availability"
  | "curtailment";

export interface LossStageResult {
  id: string;
  label: string;
  domain: LossStageDomain;
  inputPowerW: number;
  outputPowerW: number;
  lossPowerW: number;
  lossFraction: number;
  applied: boolean;
  sourceCategory: ParameterSourceCategory;
  note: string;
}

export interface SolarPositionResult {
  zenithDeg: number;
  apparentZenithDeg: number;
  elevationDeg: number;
  apparentElevationDeg: number;
  azimuthDeg: number;
  equationOfTimeMinutes: number;
  declinationDeg: number;
  isAboveHorizon: boolean;
}

export interface TrackerResult {
  idealAngleDeg: number;
  backtrackedAngleDeg: number;
  finalAngleDeg: number;
  measuredAngleDeg: number | null;
  surfaceTiltDeg: number;
  surfaceAzimuthDeg: number;
  operationalState:
    | "tracking"
    | "backtracking"
    | "fixed"
    | "stowed"
    | "measured"
    | "night";
}

export interface IrradianceResult {
  model: IrradianceTranspositionModel;
  angleOfIncidenceDeg: number;
  poaDirectWm2: number;
  poaSkyDiffuseWm2: number;
  poaGroundDiffuseWm2: number;
  poaGlobalWm2: number;
}

export interface IamResult {
  direct: number;
  skyDiffuse: number;
  groundDiffuse: number;
  effectiveIrradianceWm2: number;
}

export interface ThermalResult {
  model: ThermalModel;
  cellTemperatureC: number;
}

export interface ModuleOperatingPoint {
  model: ModuleElectricalModel;
  irradianceWm2: number;
  cellTemperatureC: number;
  iscA: number;
  vocV: number;
  impA: number;
  vmpV: number;
  pmpW: number;
  ivCurve?: Array<{ voltageV: number; currentA: number; powerW: number }>;
}

export interface StringOperatingPoint {
  stringIndex: number;
  moduleCount: number;
  irradianceFactor: number;
  temperatureOffsetC: number;
  iscA: number;
  vocV: number;
  impA: number;
  vmpV: number;
  pmpW: number;
}

export interface MpptOperatingPoint {
  mpptIndex: number;
  strings: number[];
  voltageV: number;
  currentA: number;
  shortCircuitCurrentA: number;
  unconstrainedPowerW: number;
  acceptedPowerW: number;
  currentLimitLossW: number;
  voltageWindowLossW: number;
  status:
    | "INACTIVE"
    | "NORMAL"
    | "BELOW_WINDOW"
    | "ABOVE_WINDOW"
    | "OVERCURRENT"
    | "OVERVOLTAGE_FAULT";
  warnings: string[];
}

export interface InverterConversionResult {
  dcInputPowerW: number;
  acUnclippedPowerW: number;
  acOutputPowerW: number;
  conversionLossW: number;
  clippingLossW: number;
  standbyConsumptionW: number;
  efficiency: number;
}

export interface EnergyBalanceResult {
  inputPowerW: number;
  deliveredPowerW: number;
  explicitLossPowerW: number;
  balanceResidualW: number;
  toleranceW: number;
  withinTolerance: boolean;
}

export interface PhysicsTimestepResult {
  modelMode: SimulationModelMode;
  solar: SolarPositionResult;
  tracker: TrackerResult;
  irradiance: IrradianceResult;
  iam: IamResult;
  rowShadingFactors: number[];
  cropGroundIrradianceWm2: number;
  thermal: ThermalResult;
  module: ModuleOperatingPoint;
  strings: StringOperatingPoint[];
  mppts: MpptOperatingPoint[];
  rawDcPowerW: number;
  dcAtInverterW: number;
  inverter: InverterConversionResult;
  netAcPowerW: number;
  losses: LossStageResult[];
  energyBalance: EnergyBalanceResult;
  warnings: string[];
}
