export type ValidationStudioSourceType =
  | "agritwin"
  | "pvlib"
  | "simulink"
  | "measured"
  | "pvsyst"
  | "sam"
  | "external";

export type ValidationStudioVariable =
  | "ghiWm2"
  | "dniWm2"
  | "dhiWm2"
  | "poaWm2"
  | "ambientTemperatureC"
  | "moduleTemperatureC"
  | "dcPowerKw"
  | "acPowerKw"
  | "energyKWh"
  | "dcVoltageV"
  | "dcCurrentA"
  | "cropIrradianceWm2";

export type ValidationStudioUnit =
  | "W/m2"
  | "degC"
  | "W"
  | "kW"
  | "MW"
  | "Wh"
  | "kWh"
  | "MWh"
  | "V"
  | "A";

export type ValidationTransformationKind =
  | "timezone_conversion"
  | "unit_conversion"
  | "aggregation"
  | "interpolation"
  | "date_range_trim"
  | "column_mapping"
  | "other";

export interface ValidationTransformation {
  kind:
    ValidationTransformationKind;

  description:
    string;

  from?:
    string | null;

  to?:
    string | null;
}

export interface ValidationVariableProvenance {
  variable:
    ValidationStudioVariable;

  originalColumn:
    string | null;

  originalUnit:
    string | null;

  canonicalUnit:
    ValidationStudioUnit;

  sourceClassification:
    | "measured"
    | "modeled"
    | "manufacturer"
    | "derived"
    | "fitted"
    | "assumed"
    | "default"
    | "unknown";
}

export interface ValidationStudioObservation {
  /**
   * Canonical comparison timestamp.
   *
   * This must identify an absolute instant and therefore
   * include either Z or an explicit UTC offset.
   */
  timestamp:
    string;

  originalTimestamp?:
    string | null;

  values:
    Partial<
      Record<
        ValidationStudioVariable,
        number | null
      >
    >;
}

export interface ValidationStudioDataset {
  id:
    string;

  name:
    string;

  sourceType:
    ValidationStudioSourceType;

  sourceLabel:
    string;

  fileName:
    string | null;

  runId:
    string | null;

  timezone:
    string;

  intervalMinutes:
    number;

  startTimestamp:
    string;

  endTimestamp:
    string;

  observations:
    ValidationStudioObservation[];

  variables:
    ValidationStudioVariable[];

  variableProvenance:
    ValidationVariableProvenance[];

  transformations:
    ValidationTransformation[];

  metadata:
    Record<string, unknown>;
}

export type ValidationCompatibilityLevel =
  | "PASS"
  | "WARNING"
  | "FAIL";

export interface ValidationCompatibilityCheck {
  key:
    | "dataset_count"
    | "date_range"
    | "timezone"
    | "resolution"
    | "timestamps"
    | "duplicates"
    | "variables";

  label:
    string;

  level:
    ValidationCompatibilityLevel;

  message:
    string;
}

export interface ValidationSynchronizationReport {
  ready:
    boolean;

  checks:
    ValidationCompatibilityCheck[];

  commonVariables:
    ValidationStudioVariable[];

  commonTimestamps:
    string[];

  startTimestamp:
    string | null;

  endTimestamp:
    string | null;
}
