"use client";

import writeXlsxFile from "write-excel-file/browser";

import {
  buildPayloadTopology,
  exportBasename,
  flattenConfiguration,
  researchAssumptions,
  researchFormulaRows,
} from "./common";

import type {
  ResearchExportPayload,
} from "./types";

type ExportCell =
  | string
  | number
  | boolean
  | null;

type ExportRecord =
  Record<
    string,
    ExportCell
  >;

function normalizedCell(
  value: ExportCell,
): ExportCell {
  if (
    typeof value === "number" &&
    !Number.isFinite(value)
  ) {
    return null;
  }

  return value;
}

function createSheet(
  name: string,
  records: ExportRecord[],
) {
  const safeRecords =
    records.length > 0
      ? records
      : [
          {
            status:
              "No records available",
          },
        ];

  const headers =
    Array.from(
      new Set(
        safeRecords.flatMap(
          (
            record,
          ) =>
            Object.keys(
              record,
            ),
        ),
      ),
    );

  const data = [
    headers.map(
      (
        header,
      ) => ({
        value:
          header,
        fontWeight:
          "bold" as const,
        backgroundColor:
          "#047857",
        textColor:
          "#FFFFFF",
        align:
          "center" as const,
        verticalAlign:
          "center" as const,
        wrap:
          true,
      }),
    ),

    ...safeRecords.map(
      (
        record,
      ) =>
        headers.map(
          (
            header,
          ) =>
            normalizedCell(
              record[
                header
              ] ??
              null,
            ),
        ),
    ),
  ];

  return {
    sheet:
      name,

    data,

    stickyRowsCount:
      1,

    columns:
      headers.map(
        (
          header,
        ) => ({
          width:
            Math.min(
              48,
              Math.max(
                14,
                header.length +
                  3,
              ),
            ),
        }),
      ),
  };
}

export async function exportResearchWorkbook(
  payload: ResearchExportPayload,
): Promise<void> {
  const pv =
    payload.site
      .pvConfiguration;

  const installedCapacityKw =
    pv.numberOfRows *
    pv.modulesPerRow *
    pv.modulePower /
    1000;

  const sheets = [
    createSheet(
      "Summary",
      [
        {
          metric:
            "Export schema",
          value:
            payload.schema,
          unit:
            "",
        },
        {
          metric:
            "Generated at",
          value:
            payload.generatedAt,
          unit:
            "",
        },
        {
          metric:
            "Site",
          value:
            payload.site.name,
          unit:
            "",
        },
        {
          metric:
            "Site type",
          value:
            payload.siteKind,
          unit:
            "",
        },
        {
          metric:
            "Start date",
          value:
            payload.startDate,
          unit:
            "",
        },
        {
          metric:
            "End date",
          value:
            payload.endDate,
          unit:
            "",
        },
        {
          metric:
            "Installed DC capacity",
          value:
            installedCapacityKw,
          unit:
            "kWp",
        },
        {
          metric:
            "Days",
          value:
            payload.summary.dayCount,
          unit:
            "day",
        },
        {
          metric:
            "Total modeled energy",
          value:
            payload.summary.totalEnergyKWh,
          unit:
            "kWh",
        },
        {
          metric:
            "Average daily energy",
          value:
            payload.summary
              .averageDailyEnergyKWh,
          unit:
            "kWh/day",
        },
        {
          metric:
            "Peak daily energy",
          value:
            payload.summary
              .peakDailyEnergyKWh,
          unit:
            "kWh",
        },
        {
          metric:
            "Peak modeled power",
          value:
            payload.summary
              .peakPowerKw,
          unit:
            "kW",
        },
        {
          metric:
            "Weather period",
          value:
            payload.summary.source,
          unit:
            "",
        },
        {
          metric:
            "Validation status",
          value:
            "Pending PVlib, Simulink and measured-data validation",
          unit:
            "",
        },
      ],
    ),

    createSheet(
      "Configuration",
      flattenConfiguration(
        payload.site,
      ).map(
        (
          row,
        ) => ({
          section:
            row.section,
          parameter:
            row.parameter,
          value:
            row.value,
          unit:
            row.unit,
        }),
      ),
    ),

    createSheet(
      "Daily Energy",
      payload.dailyPower.map(
        (
          row,
        ) => ({
          date:
            row.date,
          source_period:
            row.source,
          daily_energy_kwh:
            row.dailyEnergyKWh,
          peak_power_kw:
            row.peakPowerKw,
        }),
      ),
    ),

    createSheet(
      "Hourly Power",
      payload.hourlyPower.map(
        (
          row,
        ) => ({
          date:
            row.date,
          hour:
            row.hour,
          timestamp_local:
            row.timestampLocal,
          timezone:
            row.timezone,
          source_period:
            row.source,
          modeled_power_kw:
            row.powerKw,
        }),
      ),
    ),

    createSheet(
      "Hourly Weather",
      payload.weather.map(
        (
          row,
        ) => ({
          date:
            row.date,
          hour:
            row.hour,
          timestamp_local:
            row.timestampLocal,
          timezone:
            row.timezone,
          source_period:
            row.source,
          ghi_w_m2:
            row.ghiWM2,
          dni_w_m2:
            row.dniWM2,
          dhi_w_m2:
            row.dhiWM2,
          temperature_c:
            row.temperatureC,
          relative_humidity_pct:
            row.relativeHumidityPercent,
          cloud_cover_pct:
            row.cloudCoverPercent,
          wind_speed:
            row.windSpeed,
          precipitation_mm:
            row.precipitationMm,
        }),
      ),
    ),

    createSheet(
      "Electrical Topology",
      buildPayloadTopology(
        payload,
      ).map(
        (
          row,
        ) => ({
          inverter_index:
            row.inverterIndex,
          inverter_profile_id:
            row.inverterProfileId,
          mppt_index:
            row.mpptIndex,
          string_index:
            row.stringIndex,
          modules_per_string:
            row.modulesPerString,
          string_module_count:
            row.stringModuleCount,
          module_profile_id:
            row.moduleProfileId,
          allocation_status:
            row.allocationStatus,
        }),
      ),
    ),

    createSheet(
      "Model Formulas",
      researchFormulaRows().map(
        (
          row,
        ) => ({
          quantity:
            row.quantity,
          equation:
            row.equation,
          parameters:
            row.parameters,
          note:
            row.note,
        }),
      ),
    ),

    createSheet(
      "Assumptions",
      researchAssumptions().map(
        (
          assumption,
          index,
        ) => ({
          number:
            index + 1,
          assumption,
        }),
      ),
    ),

    createSheet(
      "Warnings",
      payload.warnings.map(
        (
          warning,
          index,
        ) => ({
          number:
            index + 1,
          warning,
        }),
      ),
    ),

    createSheet(
      "Provenance",
      [
        {
          field:
            "schema",
          value:
            payload.schema,
        },
        {
          field:
            "generated_at",
          value:
            payload.generatedAt,
        },
        {
          field:
            "weather_provider",
          value:
            "Open-Meteo",
        },
        {
          field:
            "weather_period",
          value:
            payload.summary.source,
        },
        {
          field:
            "module_profile_id",
          value:
            pv.moduleProfileId,
        },
        {
          field:
            "inverter_profile_id",
          value:
            pv.inverterProfileId ??
            "",
        },
        {
          field:
            "site_updated_at",
          value:
            payload.site.updatedAt,
        },
        {
          field:
            "research_status",
          value:
            "Model output; independent external validation pending",
        },
      ],
    ),
  ];

  await writeXlsxFile(
    sheets,
  ).toFile(
    `${exportBasename(payload)}.xlsx`,
  );
}
