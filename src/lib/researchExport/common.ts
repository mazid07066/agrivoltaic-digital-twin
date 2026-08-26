import {
  DEFAULT_INVERTER_PROFILE_ID,
  getInverterProfile,
} from "@/lib/electrical/inverter/catalogue";

import {
  buildElectricalTopologyRows,
} from "@/lib/validationExchange";

import type {
  ValidationElectricalTopologyRow,
  ValidationMpptAssignment,
} from "@/lib/validationExchange";

import type {
  ResearchExportPayload,
} from "./types";

export interface ParameterRow {
  section: string;
  parameter: string;
  value: string | number | boolean | null;
  unit: string;
}

export interface FormulaRow {
  quantity: string;
  equation: string;
  parameters: string;
  note: string;
}

function scalarText(
  value: unknown,
): string | number | boolean | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  return JSON.stringify(
    value,
  );
}

export function flattenConfiguration(
  value: unknown,
  section = "site",
  prefix = "",
): ParameterRow[] {
  if (
    value === null ||
    value === undefined ||
    typeof value !== "object"
  ) {
    return [
      {
        section,
        parameter:
          prefix || "value",
        value:
          scalarText(value),
        unit:
          "",
      },
    ];
  }

  if (
    Array.isArray(value)
  ) {
    return value.flatMap(
      (
        item,
        index,
      ) =>
        flattenConfiguration(
          item,
          section,
          `${prefix}[${index}]`,
        ),
    );
  }

  return Object.entries(
    value as Record<string, unknown>,
  ).flatMap(
    (
      [
        key,
        item,
      ],
    ) => {
      const parameter =
        prefix
          ? `${prefix}.${key}`
          : key;

      if (
        item !== null &&
        typeof item === "object"
      ) {
        return flattenConfiguration(
          item,
          section,
          parameter,
        );
      }

      return [
        {
          section,
          parameter,
          value:
            scalarText(item),
          unit:
            "",
        },
      ];
    },
  );
}

function positiveInteger(
  value: number | null | undefined,
): number | null {
  return (
    value !== null &&
    value !== undefined &&
    Number.isInteger(value) &&
    value > 0
  )
    ? value
    : null;
}

export function buildPayloadTopology(
  payload: ResearchExportPayload,
): ValidationElectricalTopologyRow[] {
  const pv =
    payload.site
      .pvConfiguration;

  const modulesPerString =
    positiveInteger(
      pv.modulesPerString,
    );

  const stringsPerInverter =
    positiveInteger(
      pv.stringsPerInverter,
    );

  const inverterCount =
    positiveInteger(
      pv.inverterCount,
    ) ??
    1;

  if (
    modulesPerString === null ||
    stringsPerInverter === null
  ) {
    return [];
  }

  const inverterProfileId =
    pv.inverterProfileId ??
    DEFAULT_INVERTER_PROFILE_ID;

  const inverter =
    getInverterProfile(
      inverterProfileId,
    );

  const mpptCount =
    inverter.dc
      .independentMpptInputs;

  const assignments:
    ValidationMpptAssignment[] = [];

  for (
    let inverterIndex = 1;
    inverterIndex <= inverterCount;
    inverterIndex += 1
  ) {
    const base =
      Math.floor(
        stringsPerInverter /
        mpptCount,
      );

    const remainder =
      stringsPerInverter %
      mpptCount;

    for (
      let mpptIndex = 1;
      mpptIndex <= mpptCount;
      mpptIndex += 1
    ) {
      assignments.push({
        inverterIndex,
        mpptIndex,
        stringCount:
          base +
          (
            mpptIndex <= remainder
              ? 1
              : 0
          ),
        modulesPerString,
      });
    }
  }

  return buildElectricalTopologyRows({
    inverterProfileId,
    moduleProfileId:
      pv.moduleProfileId,
    assignments,
  });
}

export function researchFormulaRows():
  FormulaRow[] {
  return [
    {
      quantity:
        "Installed DC capacity",
      equation:
        "P_STC = N_modules × P_module / 1000",
      parameters:
        "Module count; module rated power",
      note:
        "Nameplate capacity at standard test conditions.",
    },
    {
      quantity:
        "Plane-of-array irradiance",
      equation:
        "G_POA = G_beam + G_sky + G_ground",
      parameters:
        "DNI, DHI, GHI, AOI, tilt and ground albedo",
      note:
        "Transposition used by the AgriTwin land/rooftop engine.",
    },
    {
      quantity:
        "Module temperature",
      equation:
        "T_module = T_air + ((NOCT - 20) / 800) × G_POA",
      parameters:
        "Ambient temperature, NOCT and POA irradiance",
      note:
        "Simplified NOCT temperature model.",
    },
    {
      quantity:
        "Temperature correction",
      equation:
        "f_T = 1 + gamma_Pmax × (T_module - 25)",
      parameters:
        "Module Pmax temperature coefficient",
      note:
        "Coefficient is converted from percent/°C.",
    },
    {
      quantity:
        "Modeled PV power",
      equation:
        "P_PV = P_STC × (G_POA / 1000) × f_T × eta_system",
      parameters:
        "Installed capacity, POA, temperature and system efficiency",
      note:
        "Current aggregate-loss formulation.",
    },
    {
      quantity:
        "Daily energy",
      equation:
        "E_day = sum(P_PV,h × Δt)",
      parameters:
        "Hourly power and one-hour timestep",
      note:
        "Reported in kWh.",
    },
    {
      quantity:
        "String MPP voltage",
      equation:
        "V_string,mpp = N_modules/string × V_module,mpp",
      parameters:
        "Modules per string and module Vmpp",
      note:
        "Compared with the inverter MPPT window.",
    },
    {
      quantity:
        "Three-phase AC current",
      equation:
        "I_AC = P_AC / (sqrt(3) × V_LL × PF)",
      parameters:
        "AC active power, line voltage and power factor",
      note:
        "Balanced three-phase representation.",
    },
  ];
}

export function researchAssumptions():
  string[] {
  return [
    "Open-Meteo weather values are external modeled/reanalysis/forecast inputs, not on-site measurements.",
    "The current system-efficiency parameter represents aggregate PV-system losses.",
    "Hourly energy integration uses one-hour intervals.",
    "Electrical string topology is exported only when a complete chosen design exists.",
    "Results are modeled estimates and require PVlib, Simulink and measured-data validation before publication claims.",
    "The exported report preserves the active site configuration at download time.",
  ];
}

export function exportBasename(
  payload: ResearchExportPayload,
): string {
  const site =
    payload.site.name
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
    "agritwin-site";

  return [
    site,
    payload.startDate,
    payload.endDate,
    "simulation-report",
  ].join(
    "_",
  );
}
