"use client";

import {
  useMemo,
  useRef,
  useState,
} from "react";

import readXlsxFile from "read-excel-file/browser";

import {
  parse,
} from "csv-parse/browser/esm/sync";

import {
  buildValidationDatasetFromRows,
  canonicalUnitForVariable,
  normalizeValidationColumnName,
  suggestValidationColumn,
} from "@/lib/validationStudio";

import type {
  ValidationColumnMapping,
  ValidationStudioDataset,
  ValidationStudioSourceType,
  ValidationStudioUnit,
  ValidationStudioVariable,
} from "@/lib/validationStudio";

import styles from "./ValidationDatasetUpload.module.css";

type SourceType =
  ValidationStudioSourceType;

interface InspectionColumn {
  name:
    string;

  normalizedName:
    string;

  sampleValues:
    string[];
}

interface InspectionSuggestion {
  column:
    string;

  variable:
    ValidationStudioVariable | "timestamp" | null;

  confidence:
    string;

  reason:
    string;
}

interface InspectionSheet {
  index:
    number;

  name:
    string;
}

interface InspectionResult {
  fileName:
    string;

  rowCount:
    number;

  columns:
    InspectionColumn[];

  suggestions:
    InspectionSuggestion[];

  rawRows:
    Record<string, string>[];

  sheets?:
    InspectionSheet[];

  selectedSheet?:
    string;
}

interface LocalInspection {
  format:
    "csv" | "xlsx";

  inspection:
    InspectionResult;
}

interface ValidationDatasetUploadProps {
  defaultSourceType?:
    SourceType;

  onDatasetAdded:
    (
      dataset:
        ValidationStudioDataset,
    ) => void;
}

const sourceOptions: {
  value:
    SourceType;

  label:
    string;
}[] = [
  {
    value:
      "agritwin",
    label:
      "AgriTwin",
  },
  {
    value:
      "pvlib",
    label:
      "PVlib",
  },
  {
    value:
      "simulink",
    label:
      "Simulink",
  },
  {
    value:
      "measured",
    label:
      "Measured data",
  },
  {
    value:
      "pvsyst",
    label:
      "PVsyst",
  },
  {
    value:
      "sam",
    label:
      "SAM",
  },
  {
    value:
      "external",
    label:
      "Other / External",
  },
];

const variables:
  ValidationStudioVariable[] =
  [
    "ghiWm2",
    "dniWm2",
    "dhiWm2",
    "poaWm2",
    "ambientTemperatureC",
    "moduleTemperatureC",
    "dcPowerKw",
    "acPowerKw",
    "energyKWh",
    "dcVoltageV",
    "dcCurrentA",
    "cropIrradianceWm2",
  ];

const variableLabels:
  Record<
    ValidationStudioVariable,
    string
  > = {
    ghiWm2:
      "GHI",

    dniWm2:
      "DNI",

    dhiWm2:
      "DHI",

    poaWm2:
      "POA irradiance",

    ambientTemperatureC:
      "Ambient temperature",

    moduleTemperatureC:
      "Module temperature",

    dcPowerKw:
      "DC power",

    acPowerKw:
      "AC power",

    energyKWh:
      "Energy",

    dcVoltageV:
      "DC voltage",

    dcCurrentA:
      "DC current",

    cropIrradianceWm2:
      "Crop irradiance",
  };

const availableUnits:
  ValidationStudioUnit[] =
  [
    "W/m2",
    "degC",
    "W",
    "kW",
    "MW",
    "Wh",
    "kWh",
    "MWh",
    "V",
    "A",
  ];

function sourceLabel(
  source:
    SourceType,
): string {
  return sourceOptions.find(
    (item) =>
      item.value ===
      source,
  )?.label ??
    source;
}

function cellText(
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

function buildColumns(
  headers:
    string[],

  records:
    Record<
      string,
      string
    >[],
): InspectionColumn[] {
  return headers.map(
    (header) => ({
      name:
        header,

      normalizedName:
        normalizeValidationColumnName(
          header,
        ),

      sampleValues:
        records
          .slice(
            0,
            5,
          )
          .map(
            (row) =>
              row[
                header
              ] ?? "",
          ),
    }),
  );
}

async function inspectCsvFile(
  file:
    File,
): Promise<LocalInspection> {
  const text =
    await file.text();

  const records =
    parse(
      text,
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
    ) as Record<
      string,
      string
    >[];

  if (
    records.length ===
    0
  ) {
    throw new Error(
      "Validation CSV contains no data rows.",
    );
  }

  const headers =
    Object.keys(
      records[0]!,
    );

  return {
    format:
      "csv",

    inspection: {
      fileName:
        file.name,

      rowCount:
        records.length,

      columns:
        buildColumns(
          headers,
          records,
        ),

      suggestions:
        headers.map(
          suggestValidationColumn,
        ),

      rawRows:
        records,
    },
  };
}

async function inspectXlsxFile(
  file:
    File,

  selectedSheet?:
    string,
): Promise<LocalInspection> {
  const workbook =
    await readXlsxFile(
      file,
    );

  if (
    workbook.length ===
    0
  ) {
    throw new Error(
      "Workbook contains no worksheets.",
    );
  }

  const sheets =
    workbook.map(
      (
        sheet,
        index,
      ) => ({
        index:
          index + 1,

        name:
          sheet.sheet,
      }),
    );

  const selectedIndex =
    selectedSheet
      ? sheets.findIndex(
          (sheet) =>
            sheet.name ===
            selectedSheet,
        )
      : 0;

  if (
    selectedIndex <
    0
  ) {
    throw new Error(
      `Worksheet "${selectedSheet}" was not found.`,
    );
  }

  const worksheet =
    workbook[
      selectedIndex
    ];

  const sheet =
    sheets[
      selectedIndex
    ];

  if (
    !worksheet ||
    !sheet
  ) {
    throw new Error(
      "Selected worksheet could not be resolved.",
    );
  }

  const rows =
    worksheet.data as
      unknown[][];

  const headerRow =
    rows[0];

  if (
    !headerRow
  ) {
    throw new Error(
      `Worksheet "${sheet.name}" has no header row.`,
    );
  }

  const headers =
    headerRow.map(
      (
        value,
        index,
      ) =>
        cellText(
          value,
        ).trim() ||
        `Column_${index + 1}`,
    );

  const records =
    rows
      .slice(
        1,
      )
      .filter(
        (row) =>
          row.some(
            (value) =>
              cellText(
                value,
              ).trim() !==
              "",
          ),
      )
      .map(
        (row) => {
          const record:
            Record<
              string,
              string
            > =
            {};

          headers.forEach(
            (
              header,
              index,
            ) => {
              record[
                header
              ] =
                cellText(
                  row[
                    index
                  ],
                );
            },
          );

          return record;
        },
      );

  return {
    format:
      "xlsx",

    inspection: {
      fileName:
        file.name,

      rowCount:
        records.length,

      columns:
        buildColumns(
          headers,
          records,
        ),

      suggestions:
        headers.map(
          suggestValidationColumn,
        ),

      rawRows:
        records,

      sheets,

      selectedSheet:
        sheet.name,
    },
  };
}

function inferredUnit(
  variable:
    ValidationStudioVariable,

  column:
    string,
): ValidationStudioUnit {
  const name =
    normalizeValidationColumnName(
      column,
    );

  if (
    variable ===
      "dcPowerKw" ||
    variable ===
      "acPowerKw"
  ) {
    if (
      name.endsWith(
        "_mw",
      )
    ) {
      return "MW";
    }

    if (
      name.endsWith(
        "_w",
      ) ||
      name.includes(
        "power_w",
      )
    ) {
      return "W";
    }

    return "kW";
  }

  if (
    variable ===
    "energyKWh"
  ) {
    if (
      name.endsWith(
        "_mwh",
      )
    ) {
      return "MWh";
    }

    if (
      name.endsWith(
        "_wh",
      )
    ) {
      return "Wh";
    }

    return "kWh";
  }

  return canonicalUnitForVariable(
    variable,
  );
}

export default function ValidationDatasetUpload({
  defaultSourceType =
    "pvlib",

  onDatasetAdded,
}: ValidationDatasetUploadProps) {
  const inputRef =
    useRef<HTMLInputElement>(
      null,
    );

  const [
    sourceType,
    setSourceType,
  ] =
    useState<SourceType>(
      defaultSourceType,
    );

  const [
    file,
    setFile,
  ] =
    useState<File | null>(
      null,
    );

  const [
    result,
    setResult,
  ] =
    useState<LocalInspection | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      false,
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    datasetName,
    setDatasetName,
  ] =
    useState(
      sourceLabel(
        defaultSourceType,
      ),
    );

  const [
    timestampColumn,
    setTimestampColumn,
  ] =
    useState(
      "",
    );

  const [
    timestampMode,
    setTimestampMode,
  ] =
    useState<
      "absolute" |
      "local_with_timezone"
    >(
      "absolute",
    );

  const [
    timezoneColumn,
    setTimezoneColumn,
  ] =
    useState(
      "",
    );

  const [
    timezoneValue,
    setTimezoneValue,
  ] =
    useState(
      "Asia/Dhaka",
    );

  const [
    intervalMinutes,
    setIntervalMinutes,
  ] =
    useState(
      60,
    );

  const [
    variableColumns,
    setVariableColumns,
  ] =
    useState<
      Partial<
        Record<
          ValidationStudioVariable,
          string
        >
      >
    >(
      {},
    );

  const [
    units,
    setUnits,
  ] =
    useState<
      Partial<
        Record<
          ValidationStudioVariable,
          ValidationStudioUnit
        >
      >
    >(
      {},
    );

  const columns =
    result?.inspection
      .columns ??
    [];

  const mappedVariableCount =
    useMemo(
      () =>
        Object.values(
          variableColumns,
        ).filter(
          Boolean,
        ).length,
      [
        variableColumns,
      ],
    );

  function initializeMapping(
    inspection:
      LocalInspection,
  ) {
    const suggestions =
      inspection.inspection
        .suggestions;

    const timestamp =
      suggestions.find(
        (item) =>
          item.variable ===
          "timestamp",
      )?.column ??
      "";

    setTimestampColumn(
      timestamp,
    );

    const nextColumns:
      Partial<
        Record<
          ValidationStudioVariable,
          string
        >
      > =
      {};

    const nextUnits:
      Partial<
        Record<
          ValidationStudioVariable,
          ValidationStudioUnit
        >
      > =
      {};

    for (
      const variable of
      variables
    ) {
      const suggestion =
        suggestions.find(
          (item) =>
            item.variable ===
            variable,
        );

      if (
        suggestion
      ) {
        nextColumns[
          variable
        ] =
          suggestion.column;

        nextUnits[
          variable
        ] =
          inferredUnit(
            variable,
            suggestion.column,
          );
      }
    }

    setVariableColumns(
      nextColumns,
    );

    setUnits(
      nextUnits,
    );

    const firstTimestamp =
      timestamp
        ? inspection
            .inspection
            .rawRows[0]?.[
              timestamp
            ] ??
          ""
        : "";

    const absolute =
      /(?:Z|[+-]\d{2}:\d{2})$/.test(
        firstTimestamp,
      );

    setTimestampMode(
      absolute
        ? "absolute"
        : "local_with_timezone",
    );

    const timezone =
      inspection
        .inspection
        .columns
        .find(
          (column) =>
            column.normalizedName ===
            "timezone",
        );

    setTimezoneColumn(
      timezone?.name ??
      "",
    );

    if (
      timezone
    ) {
      const value =
        inspection
          .inspection
          .rawRows[0]?.[
            timezone.name
          ];

      if (
        value
      ) {
        setTimezoneValue(
          value,
        );
      }
    }
  }

  async function inspectFile(
    sheet?:
      string,
  ) {
    if (
      !file
    ) {
      setError(
        "Choose a CSV or XLSX file first.",
      );

      return;
    }

    setLoading(
      true,
    );

    setError(
      null,
    );

    try {
      const lower =
        file.name.toLowerCase();

      const inspection =
        lower.endsWith(
          ".csv",
        )
          ? await inspectCsvFile(
              file,
            )
          : lower.endsWith(
              ".xlsx",
            )
            ? await inspectXlsxFile(
                file,
                sheet,
              )
            : null;

      if (
        !inspection
      ) {
        throw new Error(
          "Upload a .csv or .xlsx file.",
        );
      }

      setResult(
        inspection,
      );

      initializeMapping(
        inspection,
      );
    } catch (
      caught
    ) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Dataset inspection failed.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }

  function addDataset() {
    if (
      !result
    ) {
      setError(
        "Inspect the dataset first.",
      );

      return;
    }

    if (
      !timestampColumn
    ) {
      setError(
        "Select a timestamp column.",
      );

      return;
    }

    if (
      mappedVariableCount ===
      0
    ) {
      setError(
        "Map at least one comparison variable.",
      );

      return;
    }

    try {
      const resolvedTimezone =
        timestampMode ===
        "absolute"
          ? timezoneValue ||
            "UTC"
          : timezoneColumn
            ? result
                .inspection
                .rawRows[0]?.[
                  timezoneColumn
                ] ||
              timezoneValue
            : timezoneValue;

      if (
        !resolvedTimezone
      ) {
        throw new Error(
          "A timezone is required.",
        );
      }

      const mapping:
        ValidationColumnMapping =
        {
          timestampColumn,

          timestampMode,

          timezoneColumn:
            timestampMode ===
              "local_with_timezone" &&
            timezoneColumn
              ? timezoneColumn
              : null,

          timezoneValue:
            timestampMode ===
              "local_with_timezone"
              ? timezoneValue
              : null,

          variableColumns,

          units,
        };

      const dataset =
        buildValidationDatasetFromRows({
          id:
            crypto.randomUUID(),

          name:
            datasetName.trim() ||
            sourceLabel(
              sourceType,
            ),

          sourceType,

          sourceLabel:
            sourceLabel(
              sourceType,
            ),

          fileName:
            result.inspection
              .fileName,

          timezone:
            resolvedTimezone,

          intervalMinutes,

          mapping,

          rows:
            result.inspection
              .rawRows,
        });

      onDatasetAdded(
        dataset,
      );

      setError(
        null,
      );
    } catch (
      caught
    ) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to add dataset.",
      );
    }
  }

  return (
    <section
      className={
        styles.container
      }
    >
      <div
        className={
          styles.controls
        }
      >
        <label
          className={
            styles.field
          }
        >
          <span>
            Data source
          </span>

          <select
            value={
              sourceType
            }
            onChange={(
              event,
            ) => {
              const value =
                event.target
                  .value as
                  SourceType;

              setSourceType(
                value,
              );

              setDatasetName(
                sourceLabel(
                  value,
                ),
              );
            }}
          >
            {sourceOptions.map(
              (option) => (
                <option
                  key={
                    option.value
                  }
                  value={
                    option.value
                  }
                >
                  {
                    option.label
                  }
                </option>
              ),
            )}
          </select>
        </label>

        <div
          className={
            styles.fileArea
          }
        >
          <input
            ref={
              inputRef
            }
            type="file"
            accept=".csv,.xlsx"
            className={
              styles.hiddenInput
            }
            onChange={(
              event,
            ) => {
              setFile(
                event.target
                  .files?.[0] ??
                null,
              );

              setResult(
                null,
              );

              setError(
                null,
              );
            }}
          />

          <button
            type="button"
            className={
              styles.uploadButton
            }
            onClick={() =>
              inputRef.current?.click()
            }
          >
            Upload CSV / XLSX
          </button>

          <span
            className={
              styles.fileName
            }
          >
            {file?.name ??
              "No file selected"}
          </span>
        </div>

        <button
          type="button"
          className={
            styles.inspectButton
          }
          disabled={
            !file ||
            loading
          }
          onClick={() =>
            void inspectFile()
          }
        >
          {loading
            ? "Inspecting..."
            : "Inspect dataset"}
        </button>
      </div>

      {error && (
        <div
          className={
            styles.error
          }
        >
          {error}
        </div>
      )}

      {result && (
        <div
          className={
            styles.result
          }
        >
          <div
            className={
              styles.summary
            }
          >
            <div>
              <span>
                File
              </span>
              <strong>
                {
                  result.inspection
                    .fileName
                }
              </strong>
            </div>

            <div>
              <span>
                Format
              </span>
              <strong>
                {
                  result.format
                    .toUpperCase()
                }
              </strong>
            </div>

            <div>
              <span>
                Rows
              </span>
              <strong>
                {
                  result.inspection
                    .rowCount
                }
              </strong>
            </div>

            <div>
              <span>
                Columns
              </span>
              <strong>
                {
                  columns.length
                }
              </strong>
            </div>
          </div>

          {result.inspection
            .sheets && (
            <div
              className={
                styles.sheetSelector
              }
            >
              <label>
                <span>
                  Worksheet
                </span>

                <select
                  value={
                    result.inspection
                      .selectedSheet
                  }
                  onChange={(
                    event,
                  ) =>
                    void inspectFile(
                      event.target
                        .value,
                    )
                  }
                >
                  {result.inspection
                    .sheets
                    .map(
                      (sheet) => (
                        <option
                          key={
                            sheet.index
                          }
                          value={
                            sheet.name
                          }
                        >
                          {
                            sheet.name
                          }
                        </option>
                      ),
                    )}
                </select>
              </label>
            </div>
          )}

          <div
            className={
              styles.mappingPanel
            }
          >
            <h3>
              Confirm canonical
              mapping
            </h3>

            <div
              className={
                styles.mappingGrid
              }
            >
              <label>
                <span>
                  Dataset name
                </span>

                <input
                  value={
                    datasetName
                  }
                  onChange={(
                    event,
                  ) =>
                    setDatasetName(
                      event.target
                        .value,
                    )
                  }
                />
              </label>

              <label>
                <span>
                  Timestamp column
                </span>

                <select
                  value={
                    timestampColumn
                  }
                  onChange={(
                    event,
                  ) =>
                    setTimestampColumn(
                      event.target
                        .value,
                    )
                  }
                >
                  <option
                    value=""
                  >
                    Select...
                  </option>

                  {columns.map(
                    (column) => (
                      <option
                        key={
                          column.name
                        }
                        value={
                          column.name
                        }
                      >
                        {
                          column.name
                        }
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                <span>
                  Timestamp type
                </span>

                <select
                  value={
                    timestampMode
                  }
                  onChange={(
                    event,
                  ) =>
                    setTimestampMode(
                      event.target
                        .value as
                        typeof timestampMode,
                    )
                  }
                >
                  <option
                    value="absolute"
                  >
                    Absolute
                    timestamp
                  </option>

                  <option
                    value="local_with_timezone"
                  >
                    Local +
                    timezone
                  </option>
                </select>
              </label>

              <label>
                <span>
                  Interval
                  (minutes)
                </span>

                <input
                  type="number"
                  min="1"
                  value={
                    intervalMinutes
                  }
                  onChange={(
                    event,
                  ) =>
                    setIntervalMinutes(
                      Math.max(
                        1,
                        Number(
                          event.target
                            .value,
                        ) ||
                          1,
                      ),
                    )
                  }
                />
              </label>

              {timestampMode ===
                "local_with_timezone" && (
                <>
                  <label>
                    <span>
                      Timezone
                      column
                    </span>

                    <select
                      value={
                        timezoneColumn
                      }
                      onChange={(
                        event,
                      ) =>
                        setTimezoneColumn(
                          event.target
                            .value,
                        )
                      }
                    >
                      <option
                        value=""
                      >
                        None /
                        manual
                      </option>

                      {columns.map(
                        (
                          column,
                        ) => (
                          <option
                            key={
                              column.name
                            }
                            value={
                              column.name
                            }
                          >
                            {
                              column.name
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label>
                    <span>
                      Timezone
                    </span>

                    <input
                      value={
                        timezoneValue
                      }
                      onChange={(
                        event,
                      ) =>
                        setTimezoneValue(
                          event.target
                            .value,
                        )
                      }
                      placeholder="Asia/Dhaka"
                    />
                  </label>
                </>
              )}
            </div>

            <div
              className={
                styles.variableMapping
              }
            >
              <div
                className={
                  styles.mappingHeader
                }
              >
                <strong>
                  Canonical
                  variable
                </strong>
                <strong>
                  Source
                  column
                </strong>
                <strong>
                  Source unit
                </strong>
              </div>

              {variables.map(
                (variable) => (
                  <div
                    key={
                      variable
                    }
                    className={
                      styles.mappingRow
                    }
                  >
                    <span>
                      {
                        variableLabels[
                          variable
                        ]
                      }
                    </span>

                    <select
                      value={
                        variableColumns[
                          variable
                        ] ??
                        ""
                      }
                      onChange={(
                        event,
                      ) => {
                        const column =
                          event.target
                            .value;

                        setVariableColumns(
                          (
                            current,
                          ) => ({
                            ...current,

                            [
                              variable
                            ]:
                              column ||
                              undefined,
                          }),
                        );

                        if (
                          column
                        ) {
                          setUnits(
                            (
                              current,
                            ) => ({
                              ...current,

                              [
                                variable
                              ]:
                                inferredUnit(
                                  variable,
                                  column,
                                ),
                            }),
                          );
                        }
                      }}
                    >
                      <option
                        value=""
                      >
                        Unmapped
                      </option>

                      {columns.map(
                        (
                          column,
                        ) => (
                          <option
                            key={
                              column.name
                            }
                            value={
                              column.name
                            }
                          >
                            {
                              column.name
                            }
                          </option>
                        ),
                      )}
                    </select>

                    <select
                      value={
                        units[
                          variable
                        ] ??
                        canonicalUnitForVariable(
                          variable,
                        )
                      }
                      disabled={
                        !variableColumns[
                          variable
                        ]
                      }
                      onChange={(
                        event,
                      ) =>
                        setUnits(
                          (
                            current,
                          ) => ({
                            ...current,

                            [
                              variable
                            ]:
                              event.target
                                .value as
                                ValidationStudioUnit,
                          }),
                        )
                      }
                    >
                      {availableUnits.map(
                        (unit) => (
                          <option
                            key={
                              unit
                            }
                            value={
                              unit
                            }
                          >
                            {
                              unit
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                ),
              )}
            </div>

            <div
              className={
                styles.addDatasetBar
              }
            >
              <span>
                {
                  mappedVariableCount
                }
                {" "}
                comparison
                variables mapped
              </span>

              <button
                type="button"
                className={
                  styles.inspectButton
                }
                onClick={
                  addDataset
                }
              >
                Add Dataset
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
