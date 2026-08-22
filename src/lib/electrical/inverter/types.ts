/**
 * AgriTwin Phase 9E electrical inverter contracts.
 *
 * These contracts deliberately distinguish calculated,
 * assumed, derived and measured electrical quantities.
 *
 * Phase 9E-1 defines contracts only. It does not yet
 * implement inverter physics or execution integration.
 */

export type ElectricalValueProvenance =
  | "calculated"
  | "assumed"
  | "derived"
  | "measured"
  | "demonstration_allocation";

export interface ElectricalValue<T> {
  value: T;
  provenance: ElectricalValueProvenance;
  note?: string;
}

/**
 * Controls how the Phase 9E inverter conversion efficiency
 * is applied.
 *
 * legacy_power_passthrough:
 * The upstream Phase 7B / Phase 8C pvPowerKw already includes
 * the historically ambiguous site-level systemEfficiency
 * derating. Applying another inverter efficiency may
 * double-count losses, so no additional conversion factor is
 * applied.
 *
 * explicit_constant_efficiency:
 * Intended for a future explicitly defined raw DC-array power
 * boundary where the supplied inverter maximum efficiency can
 * be used as a documented constant/bounded assumption.
 */
export type InverterEfficiencyApplicationMode =
  | "legacy_power_passthrough"
  | "explicit_constant_efficiency";

export type InverterOperatingState =
  | "OFF"
  | "WAITING_FOR_START"
  | "MPPT_ACTIVE"
  | "DERATED"
  | "CLIPPED"
  | "GRID_LIMITED"
  | "FAULT";

export type InverterAlarmCode =
  | "DC_OVERVOLTAGE"
  | "DC_UNDERVOLTAGE"
  | "START_THRESHOLD_NOT_REACHED"
  | "MPPT_VOLTAGE_OUTSIDE_NORMAL_RANGE"
  | "DC_OVERCURRENT"
  | "MPPT_OVERCURRENT"
  | "MPPT_SHORT_CIRCUIT_CURRENT_VIOLATION"
  | "STRING_SHORT_CIRCUIT_CURRENT_VIOLATION"
  | "AC_OVERVOLTAGE"
  | "AC_UNDERVOLTAGE"
  | "FREQUENCY_VIOLATION"
  | "AC_OVERCURRENT"
  | "APPARENT_POWER_LIMIT"
  | "CLIPPING"
  | "THD_VIOLATION"
  | "GRID_UNAVAILABLE"
  | "GENERAL_FAULT";

export interface InverterAlarm {
  code: InverterAlarmCode;

  active: boolean;

  message: string;

  severity:
    | "info"
    | "warning"
    | "fault";
}

export interface InverterDcSpecification {
  maxGeneratorPowerW: number;

  maxInputVoltageV: number;

  mppVoltageMinV: number;

  mppVoltageMaxV: number;

  ratedInputVoltageV: number;

  minInputVoltageV: number;

  startInputVoltageV: number;

  maxOperatingInputCurrentA: number;

  maxOperatingCurrentPerMpptA: number;

  maxShortCircuitCurrentPerMpptA: number;

  maxShortCircuitCurrentPerStringA: number;

  independentMpptInputs: number;

  stringsPerMppt: number;
}

export interface InverterAcSpecification {
  ratedActivePowerW: number;

  maxApparentPowerVa: number;

  supportedNominalVoltages: ReadonlyArray<{
    lineNeutralV: number;
    lineLineV: number;
  }>;

  acVoltageMinV: number;

  acVoltageMaxV: number;

  supportedGridFrequenciesHz:
    ReadonlyArray<50 | 60>;

  frequencyRangesHz: ReadonlyArray<{
    nominalHz: 50 | 60;
    minHz: number;
    maxHz: number;
  }>;

  ratedPowerFrequencyHz: number;

  ratedGridVoltageV: number;

  maxOutputCurrentA: number;

  ratedOutputCurrentA: number;

  outputPhases: 3;

  acConnection: "3-(N)-PE";

  ratedPowerFactor: number;

  maximumEfficiency: number;

  maxThdPercent: number;
}

export interface InverterSpecification {
  id: string;

  name: string;

  dc: InverterDcSpecification;

  ac: InverterAcSpecification;
}

export interface InverterStringInput {
  stringIndex: number;

  currentA:
    ElectricalValue<number | null>;

  shortCircuitCurrentA:
    ElectricalValue<number | null>;

  powerKw:
    ElectricalValue<number | null>;
}

export interface InverterMpptInput {
  mpptIndex: number;

  voltageV:
    ElectricalValue<number | null>;

  currentA:
    ElectricalValue<number | null>;

  shortCircuitCurrentA:
    ElectricalValue<number | null>;

  powerKw:
    ElectricalValue<number | null>;

  strings:
    InverterStringInput[];
}

export interface InverterDcInput {
  availablePowerKw:
    ElectricalValue<number>;

  requestedPowerKw:
    ElectricalValue<number>;

  voltageV:
    ElectricalValue<number | null>;

  currentA:
    ElectricalValue<number | null>;

  mppts:
    InverterMpptInput[];
}

export interface InverterDcOutput {
  acceptedPowerKw: number;

  clippedPowerKw: number;

  conversionInputPowerKw: number;

  dcLimitActive: boolean;
}

export interface InverterAcOutput {
  activePowerKw: number;

  reactivePowerKvar: number;

  apparentPowerKva: number;

  powerFactor: number;

  lineNeutralVoltageV: number;

  lineLineVoltageV: number;

  lineCurrentA: number;

  frequencyHz: number;

  phases: 3;

  thdPercent: number | null;

  energyKwh: number;
}

export interface InverterTimestepResult {
  timestamp: string;

  state:
    InverterOperatingState;

  dcInput:
    InverterDcInput;

  dcOutput:
    InverterDcOutput;

  efficiency:
    ElectricalValue<number>;

  conversionLossKw: number;

  deratingLossKw: number;

  ac:
    InverterAcOutput;

  alarms:
    InverterAlarm[];
}

export interface InverterSimulationSummary {
  totalAvailableDcEnergyKwh: number;

  totalAcceptedDcEnergyKwh: number;

  totalAcEnergyKwh: number;

  totalConversionLossKwh: number;

  totalClippingLossKwh: number;

  totalDeratingLossKwh: number;

  peakAcPowerKw: number;

  peakAcCurrentA: number;

  alarmCount: number;
}
