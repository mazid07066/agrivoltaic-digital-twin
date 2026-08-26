import {
  VALIDATION_EXCHANGE_SCHEMA,
} from "./types";

import type {
  ValidationExchangeFile,
  ValidationExchangeManifest,
  ValidationSiteKind,
  ValidationSoftwareVersion,
  ValidationWeatherPeriod,
} from "./types";

export interface CreateValidationManifestInput {
  packageId: string;
  createdAt: string;
  runId?: string | null;
  inputFingerprint: string;
  environmentFingerprint?: string | null;
  sourceCommit?: string | null;
  siteKind: ValidationSiteKind;
  siteId: string;
  siteVersionId?: string | null;
  scenarioId?: string | null;
  simulationDate: string;
  startDate: string;
  endDate: string;
  timezone: string;
  weatherPeriod: ValidationWeatherPeriod;
  moduleProfileId?: string | null;
  inverterProfileId?: string | null;
  software?: ValidationSoftwareVersion[];
  files?: ValidationExchangeFile[];
}

function requireText(
  value: string,
  label: string,
): string {
  const normalized =
    value.trim();

  if (
    normalized.length === 0
  ) {
    throw new Error(
      `${label} is required.`,
    );
  }

  return normalized;
}

function requireIsoDate(
  value: string,
  label: string,
): string {
  const normalized =
    requireText(
      value,
      label,
    );

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      normalized,
    )
  ) {
    throw new Error(
      `${label} must use YYYY-MM-DD format.`,
    );
  }

  const parsed =
    new Date(
      `${normalized}T00:00:00Z`,
    );

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    throw new Error(
      `${label} is invalid.`,
    );
  }

  return normalized;
}

function requireIsoTimestamp(
  value: string,
): string {
  const normalized =
    requireText(
      value,
      "Creation timestamp",
    );

  const parsed =
    new Date(
      normalized,
    );

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    throw new Error(
      "Creation timestamp is invalid.",
    );
  }

  return parsed.toISOString();
}

export function createValidationManifest(
  input: CreateValidationManifestInput,
): ValidationExchangeManifest {
  const startDate =
    requireIsoDate(
      input.startDate,
      "Start date",
    );

  const endDate =
    requireIsoDate(
      input.endDate,
      "End date",
    );

  if (
    startDate > endDate
  ) {
    throw new Error(
      "Validation package start date cannot be after its end date.",
    );
  }

  return {
    schema:
      VALIDATION_EXCHANGE_SCHEMA,

    packageId:
      requireText(
        input.packageId,
        "Package ID",
      ),

    createdAt:
      requireIsoTimestamp(
        input.createdAt,
      ),

    runId:
      input.runId ?? null,

    inputFingerprint:
      requireText(
        input.inputFingerprint,
        "Input fingerprint",
      ),

    environmentFingerprint:
      input.environmentFingerprint ??
      null,

    sourceCommit:
      input.sourceCommit ??
      null,

    siteKind:
      input.siteKind,

    siteId:
      requireText(
        input.siteId,
        "Site ID",
      ),

    siteVersionId:
      input.siteVersionId ??
      null,

    scenarioId:
      input.scenarioId ??
      null,

    simulationDate:
      requireIsoDate(
        input.simulationDate,
        "Simulation date",
      ),

    startDate,
    endDate,

    timezone:
      requireText(
        input.timezone,
        "Timezone",
      ),

    weatherPeriod:
      input.weatherPeriod,

    moduleProfileId:
      input.moduleProfileId ??
      null,

    inverterProfileId:
      input.inverterProfileId ??
      null,

    software:
      [...(
        input.software ??
        []
      )],

    files:
      [...(
        input.files ??
        []
      )],
  };
}
