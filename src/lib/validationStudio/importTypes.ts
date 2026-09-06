import type {
  ValidationStudioSourceType,
  ValidationStudioUnit,
  ValidationStudioVariable,
} from "./types";

export type ValidationImportConfidence =
  | "high"
  | "medium"
  | "low"
  | "none";

export type ValidationTimestampMode =
  | "absolute"
  | "local_with_timezone";

export interface ValidationImportColumn {
  name:
    string;

  normalizedName:
    string;

  sampleValues:
    string[];
}

export interface ValidationColumnSuggestion {
  column:
    string;

  variable:
    ValidationStudioVariable | "timestamp" | null;

  confidence:
    ValidationImportConfidence;

  reason:
    string;
}

export interface ValidationColumnMapping {
  timestampColumn:
    string;

  timestampMode?:
    ValidationTimestampMode;

  timezoneColumn?:
    string | null;

  timezoneValue?:
    string | null;

  variableColumns:
    Partial<
      Record<
        ValidationStudioVariable,
        string
      >
    >;

  units:
    Partial<
      Record<
        ValidationStudioVariable,
        ValidationStudioUnit
      >
    >;
}

export interface ValidationCsvInspection {
  fileName:
    string;

  sourceType:
    ValidationStudioSourceType;

  rowCount:
    number;

  columns:
    ValidationImportColumn[];

  suggestions:
    ValidationColumnSuggestion[];

  rawRows:
    Record<string, string>[];
}

export interface ValidationImportBuildInput {
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

  timezone:
    string;

  intervalMinutes:
    number;

  mapping:
    ValidationColumnMapping;

  rows:
    Record<string, string>[];
}
