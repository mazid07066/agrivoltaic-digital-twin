import readXlsxFile from "read-excel-file/browser";

import {
  parse,
} from "csv-parse/browser/esm/sync";

import {
  buildValidationDatasetFromRows,
} from "./importBuilder";

import type {
  ValidationColumnMapping,
} from "./importTypes";

import type {
  ValidationStudioDataset,
  ValidationStudioSourceType,
  ValidationStudioUnit,
  ValidationStudioVariable,
} from "./types";

type Row =
  Record<
    string,
    string
  >;

function text(
  value:
    unknown,
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    value instanceof Date
  ) {
    return value.toISOString();
  }

  return String(
    value,
  );
}

function rowsFromSheet(
  data:
    unknown[][],
): Row[] {
  const headerRow =
    data[0];

  if (
    !headerRow
  ) {
    return [];
  }

  const headers =
    headerRow.map(
      (
        value,
        index,
      ) =>
        text(
          value,
        ).trim() ||
        `Column_${index + 1}`,
    );

  return data
    .slice(
      1,
    )
    .filter(
      (row) =>
        row.some(
          (value) =>
            text(
              value,
            ).trim() !==
            "",
        ),
    )
    .map(
      (row) => {
        const record:
          Row =
          {};

        headers.forEach(
          (
            header,
            index,
          ) => {
            record[
              header
            ] =
              text(
                row[
                  index
                ],
              );
          },
        );

        return record;
      },
    );
}

function mergeRowsByTimestamp(
  power:
    Row[],

  weather:
    Row[],
): Row[] {
  const weatherByTimestamp =
    new Map<
      string,
      Row
    >();

  for (
    const row of
    weather
  ) {
    const timestamp =
      row.timestamp_local ??
      row.timestamp;

    if (
      timestamp
    ) {
      weatherByTimestamp.set(
        timestamp,
        row,
      );
    }
  }

  return power.map(
    (powerRow) => {
      const timestamp =
        powerRow.timestamp_local ??
        powerRow.timestamp;

      const weatherRow =
        timestamp
          ? weatherByTimestamp.get(
              timestamp,
            )
          : undefined;

      return {
        ...(weatherRow ?? {}),
        ...powerRow,
      };
    },
  );
}

function pickExisting(
  row:
    Row,

  names:
    string[],
): string | undefined {
  return names.find(
    (name) =>
      Object.prototype.hasOwnProperty.call(
        row,
        name,
      ),
  );
}

function assign(
  variableColumns:
    Partial<
      Record<
        ValidationStudioVariable,
        string
      >
    >,

  units:
    Partial<
      Record<
        ValidationStudioVariable,
        ValidationStudioUnit
      >
    >,

  row:
    Row,

  variable:
    ValidationStudioVariable,

  candidates:
    string[],

  unit:
    ValidationStudioUnit,
) {
  const column =
    pickExisting(
      row,
      candidates,
    );

  if (
    column
  ) {
    variableColumns[
      variable
    ] =
      column;

    units[
      variable
    ] =
      unit;
  }
}

function mappingForRows(
  rows:
    Row[],
): {
  mapping:
    ValidationColumnMapping;

  timezone:
    string;
} {
  const first =
    rows[0];

  if (
    !first
  ) {
    throw new Error(
      "Dataset contains no rows.",
    );
  }

  const variableColumns:
    Partial<
      Record<
        ValidationStudioVariable,
        string
      >
    > =
    {};

  const units:
    Partial<
      Record<
        ValidationStudioVariable,
        ValidationStudioUnit
      >
    > =
    {};

  assign(
    variableColumns,
    units,
    first,
    "ghiWm2",
    [
      "GHI_W_m2",
      "ghi_w_m2",
    ],
    "W/m2",
  );

  assign(
    variableColumns,
    units,
    first,
    "dniWm2",
    [
      "DNI_W_m2",
      "dni_w_m2",
    ],
    "W/m2",
  );

  assign(
    variableColumns,
    units,
    first,
    "dhiWm2",
    [
      "DHI_W_m2",
      "dhi_w_m2",
    ],
    "W/m2",
  );

  assign(
    variableColumns,
    units,
    first,
    "poaWm2",
    [
      "POA_global_W_m2",
      "poa_w_m2",
    ],
    "W/m2",
  );

  assign(
    variableColumns,
    units,
    first,
    "ambientTemperatureC",
    [
      "temp_air_C",
      "temperature_c",
    ],
    "degC",
  );

  assign(
    variableColumns,
    units,
    first,
    "moduleTemperatureC",
    [
      "cell_temperature_C",
      "tcell_c",
    ],
    "degC",
  );

  assign(
    variableColumns,
    units,
    first,
    "dcPowerKw",
    [
      "dc_power_kw",
    ],
    "kW",
  );

  if (
    !variableColumns
      .dcPowerKw
  ) {
    assign(
      variableColumns,
      units,
      first,
      "dcPowerKw",
      [
        "DC_power_W",
      ],
      "W",
    );
  }

  assign(
    variableColumns,
    units,
    first,
    "acPowerKw",
    [
      "modeled_power_kw",
      "Plant_AC_power_kW",
      "Plant_AC_Power_kW",
    ],
    "kW",
  );

  if (
    !variableColumns
      .acPowerKw
  ) {
    assign(
      variableColumns,
      units,
      first,
      "acPowerKw",
      [
        "Plant_AC_power_W",
        "Plant_AC_Power_W",
      ],
      "W",
    );
  }

  assign(
    variableColumns,
    units,
    first,
    "energyKWh",
    [
      "Plant_Energy_kWh",
      "daily_energy_kwh",
    ],
    "kWh",
  );

  const absoluteTimestamp =
    pickExisting(
      first,
      [
        "timestamp",
      ],
    );

  if (
    absoluteTimestamp
  ) {
    return {
      timezone:
        "Asia/Dhaka",

      mapping: {
        timestampColumn:
          absoluteTimestamp,

        timestampMode:
          "absolute",

        timezoneColumn:
          null,

        timezoneValue:
          null,

        variableColumns,

        units,
      },
    };
  }

  const localTimestamp =
    pickExisting(
      first,
      [
        "timestamp_local",
      ],
    );

  if (
    !localTimestamp
  ) {
    throw new Error(
      "No supported timestamp column was detected.",
    );
  }

  const timezoneColumn =
    pickExisting(
      first,
      [
        "timezone",
      ],
    );

  const timezone =
    timezoneColumn
      ? first[
          timezoneColumn
        ] ||
        "Asia/Dhaka"
      : "Asia/Dhaka";

  return {
    timezone,

    mapping: {
      timestampColumn:
        localTimestamp,

      timestampMode:
        "local_with_timezone",

      timezoneColumn:
        timezoneColumn ??
        null,

      timezoneValue:
        timezone,

      variableColumns,

      units,
    },
  };
}

function makeDataset(
  rows:
    Row[],

  sourceType:
    ValidationStudioSourceType,

  fileName:
    string,
): ValidationStudioDataset {
  const {
    mapping,
    timezone,
  } =
    mappingForRows(
      rows,
    );

  return buildValidationDatasetFromRows({
    id:
      crypto.randomUUID(),

    name:
      sourceType ===
      "agritwin"
        ? "AgriTwin"
        : sourceType ===
            "pvlib"
          ? "PVlib"
          : sourceType ===
              "simulink"
            ? "Simulink"
            : sourceType,

    sourceType,

    sourceLabel:
      sourceType,

    fileName,

    timezone,

    intervalMinutes:
      60,

    mapping,

    rows,
  });
}

async function importCsv(
  file:
    File,

  sourceType:
    ValidationStudioSourceType,
): Promise<ValidationStudioDataset> {
  const content =
    await file.text();

  const rows =
    parse(
      content,
      {
        columns:
          true,

        skip_empty_lines:
          true,

        trim:
          true,

        bom:
          true,
      },
    ) as Row[];

  if (
    rows.length <
    2
  ) {
    throw new Error(
      "This CSV is a summary file, not a time-series dataset. Upload the hourly results CSV instead.",
    );
  }

  return makeDataset(
    rows,
    sourceType,
    file.name,
  );
}

async function importWorkbook(
  file:
    File,

  sourceType:
    ValidationStudioSourceType,
): Promise<ValidationStudioDataset> {
  const workbook =
    await readXlsxFile(
      file,
    );

  const powerSheet =
    workbook.find(
      (sheet) =>
        sheet.sheet ===
        "Hourly Power",
    );

  const weatherSheet =
    workbook.find(
      (sheet) =>
        sheet.sheet ===
        "Hourly Weather",
    );

  if (
    !powerSheet
  ) {
    throw new Error(
      'Workbook does not contain an "Hourly Power" worksheet.',
    );
  }

  const powerRows =
    rowsFromSheet(
      powerSheet.data as
        unknown[][],
    );

  const weatherRows =
    weatherSheet
      ? rowsFromSheet(
          weatherSheet.data as
            unknown[][],
        )
      : [];

  if (
    powerRows.length ===
    0
  ) {
    throw new Error(
      '"Hourly Power" contains no time-series rows.',
    );
  }

  const rows =
    weatherRows.length >
    0
      ? mergeRowsByTimestamp(
          powerRows,
          weatherRows,
        )
      : powerRows;

  return makeDataset(
    rows,
    sourceType,
    file.name,
  );
}

export async function autoImportValidationDataset(
  file:
    File,

  sourceType:
    ValidationStudioSourceType,
): Promise<ValidationStudioDataset> {
  const lower =
    file.name.toLowerCase();

  if (
    lower.endsWith(
      ".csv",
    )
  ) {
    return importCsv(
      file,
      sourceType,
    );
  }

  if (
    lower.endsWith(
      ".xlsx",
    )
  ) {
    return importWorkbook(
      file,
      sourceType,
    );
  }

  throw new Error(
    "Upload a CSV or XLSX file.",
  );
}
