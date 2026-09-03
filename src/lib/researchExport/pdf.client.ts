"use client";

import {
  jsPDF,
} from "jspdf";

import {
  exportBasename,
  researchAssumptions,
  researchFormulaRows,
} from "./common";

import type {
  ResearchExportPayload,
} from "./types";

import {
  resolvePhysicsConfiguration,
} from "@/lib/physics/defaults";

interface ReportCursor {
  y: number;
}

function addHeader(
  document: jsPDF,
  payload: ResearchExportPayload,
) {
  document.setFillColor(
    4,
    120,
    87,
  );

  document.rect(
    0,
    0,
    210,
    29,
    "F",
  );

  document.setTextColor(
    255,
    255,
    255,
  );

  document.setFont(
    "helvetica",
    "bold",
  );

  document.setFontSize(
    18,
  );

  document.text(
    "AgriTwin Simulation Report",
    15,
    13,
  );

  document.setFont(
    "helvetica",
    "normal",
  );

  document.setFontSize(
    9,
  );

  document.text(
    payload.site.name,
    15,
    21,
  );

  document.text(
    `${payload.startDate} to ${payload.endDate}`,
    195,
    21,
    {
      align:
        "right",
    },
  );
}

function addFooter(
  document: jsPDF,
  page:
    number,
) {
  document.setDrawColor(
    203,
    213,
    225,
  );

  document.line(
    15,
    282,
    195,
    282,
  );

  document.setTextColor(
    100,
    116,
    139,
  );

  document.setFontSize(
    8,
  );

  document.text(
    "Modeled digital-twin output — external validation pending",
    15,
    288,
  );

  document.text(
    `Page ${page}`,
    195,
    288,
    {
      align:
        "right",
    },
  );
}

function nextPage(
  document: jsPDF,
  payload: ResearchExportPayload,
  cursor: ReportCursor,
) {
  addFooter(
    document,
    document.getNumberOfPages(),
  );

  document.addPage();

  addHeader(
    document,
    payload,
  );

  cursor.y =
    38;
}

function ensureSpace(
  document: jsPDF,
  payload: ResearchExportPayload,
  cursor: ReportCursor,
  required:
    number,
) {
  if (
    cursor.y +
    required >
    275
  ) {
    nextPage(
      document,
      payload,
      cursor,
    );
  }
}

function heading(
  document: jsPDF,
  payload: ResearchExportPayload,
  cursor: ReportCursor,
  title: string,
) {
  ensureSpace(
    document,
    payload,
    cursor,
    16,
  );

  document.setTextColor(
    15,
    23,
    42,
  );

  document.setFont(
    "helvetica",
    "bold",
  );

  document.setFontSize(
    12,
  );

  document.text(
    title,
    15,
    cursor.y,
  );

  document.setDrawColor(
    16,
    185,
    129,
  );

  document.line(
    15,
    cursor.y + 3,
    195,
    cursor.y + 3,
  );

  cursor.y +=
    10;
}

function keyValue(
  document: jsPDF,
  payload: ResearchExportPayload,
  cursor: ReportCursor,
  label: string,
  value: string,
) {
  ensureSpace(
    document,
    payload,
    cursor,
    9,
  );

  document.setFontSize(
    9,
  );

  document.setFont(
    "helvetica",
    "bold",
  );

  document.setTextColor(
    71,
    85,
    105,
  );

  document.text(
    label,
    17,
    cursor.y,
  );

  document.setFont(
    "helvetica",
    "normal",
  );

  document.setTextColor(
    15,
    23,
    42,
  );

  const lines =
    document.splitTextToSize(
      value,
      116,
    ) as string[];

  document.text(
    lines,
    75,
    cursor.y,
  );

  cursor.y +=
    Math.max(
      6,
      lines.length * 4.5,
    );
}

function paragraph(
  document: jsPDF,
  payload: ResearchExportPayload,
  cursor: ReportCursor,
  text: string,
) {
  const lines =
    document.splitTextToSize(
      text,
      176,
    ) as string[];

  ensureSpace(
    document,
    payload,
    cursor,
    lines.length * 4.5 +
      4,
  );

  document.setFont(
    "helvetica",
    "normal",
  );

  document.setFontSize(
    9,
  );

  document.setTextColor(
    51,
    65,
    85,
  );

  document.text(
    lines,
    17,
    cursor.y,
  );

  cursor.y +=
    lines.length * 4.5 +
    4;
}

function addChart(
  document: jsPDF,
  payload: ResearchExportPayload,
  cursor: ReportCursor,
) {
  const rows =
    payload.mode ===
    "day"
      ? payload.hourlyPower
          .filter(
            (
              row,
            ) =>
              row.date ===
              payload.startDate,
          )
          .map(
            (
              row,
            ) => ({
              label:
                row.hour,
              value:
                row.powerKw,
            }),
          )
      : payload.dailyPower.map(
          (
            row,
          ) => ({
            label:
              row.date,
            value:
              row.dailyEnergyKWh,
          }),
        );

  if (
    rows.length < 2
  ) {
    return;
  }

  ensureSpace(
    document,
    payload,
    cursor,
    76,
  );

  const x =
    20;

  const y =
    cursor.y;

  const width =
    170;

  const height =
    58;

  const maximum =
    Math.max(
      1,
      ...rows.map(
        (
          row,
        ) =>
          row.value,
      ),
    );

  document.setFillColor(
    248,
    250,
    252,
  );

  document.roundedRect(
    x,
    y,
    width,
    height,
    2,
    2,
    "F",
  );

  document.setDrawColor(
    203,
    213,
    225,
  );

  document.line(
    x + 8,
    y + height - 9,
    x + width - 5,
    y + height - 9,
  );

  document.line(
    x + 8,
    y + 7,
    x + 8,
    y + height - 9,
  );

  document.setDrawColor(
    4,
    120,
    87,
  );

  document.setLineWidth(
    0.65,
  );

  const plotWidth =
    width -
    18;

  const plotHeight =
    height -
    19;

  const maximumPoints =
    500;

  const stride =
    Math.max(
      1,
      Math.ceil(
        rows.length /
        maximumPoints,
      ),
    );

  const sampled =
    rows.filter(
      (
        _,
        index,
      ) =>
        index %
          stride ===
        0,
    );

  sampled.forEach(
    (
      row,
      index,
    ) => {
      if (
        index === 0
      ) {
        return;
      }

      const previous =
        sampled[index - 1];

      const x1 =
        x +
        8 +
        (
          (
            index - 1
          ) /
          Math.max(
            sampled.length - 1,
            1,
          )
        ) *
          plotWidth;

      const x2 =
        x +
        8 +
        (
          index /
          Math.max(
            sampled.length - 1,
            1,
          )
        ) *
          plotWidth;

      const y1 =
        y +
        7 +
        (
          1 -
          previous.value /
            maximum
        ) *
          plotHeight;

      const y2 =
        y +
        7 +
        (
          1 -
          row.value /
            maximum
        ) *
          plotHeight;

      document.line(
        x1,
        y1,
        x2,
        y2,
      );
    },
  );

  document.setFontSize(
    8,
  );

  document.setTextColor(
    71,
    85,
    105,
  );

  document.text(
    `0`,
    x + 6,
    y + height - 4,
    {
      align:
        "right",
    },
  );

  document.text(
    maximum.toFixed(
      1,
    ),
    x + 6,
    y + 9,
    {
      align:
        "right",
    },
  );

  document.text(
    payload.mode === "day"
      ? "Hourly modeled PV power (kW)"
      : "Daily modeled PV energy (kWh)",
    x + 10,
    y + 6,
  );

  cursor.y +=
    height + 7;
}

export function exportResearchPdf(
  payload: ResearchExportPayload,
): void {
  const document =
    new jsPDF({
      orientation:
        "portrait",
      unit:
        "mm",
      format:
        "a4",
      compress:
        true,
    });

  const cursor:
    ReportCursor = {
      y:
        38,
    };

  addHeader(
    document,
    payload,
  );

  const pv =
    payload.site
      .pvConfiguration;

  const installedModules =
    pv.numberOfRows *
    pv.modulesPerRow;

  const installedCapacityKw =
    installedModules *
    pv.modulePower /
    1000;

  const specificYield =
    installedCapacityKw > 0
      ? payload.summary
          .totalEnergyKWh /
        installedCapacityKw
      : 0;

  const capacityFactorPercent =
    installedCapacityKw > 0 &&
    payload.summary.dayCount > 0
      ? (
          payload.summary
            .totalEnergyKWh /
          (
            installedCapacityKw *
            payload.summary
              .dayCount *
            24
          )
        ) *
        100
      : 0;

  heading(
    document,
    payload,
    cursor,
    "1. Report identity",
  );

  keyValue(
    document,
    payload,
    cursor,
    "Generated",
    payload.generatedAt,
  );

  keyValue(
    document,
    payload,
    cursor,
    "Site",
    payload.site.name,
  );

  keyValue(
    document,
    payload,
    cursor,
    "Site type",
    payload.siteKind,
  );

  keyValue(
    document,
    payload,
    cursor,
    "Location",
    `${payload.site.location.latitude}, ${payload.site.location.longitude}`,
  );

  keyValue(
    document,
    payload,
    cursor,
    "Timezone",
    payload.site.location.timezone,
  );

  keyValue(
    document,
    payload,
    cursor,
    "Period",
    `${payload.startDate} to ${payload.endDate} (${payload.summary.source})`,
  );

  heading(
    document,
    payload,
    cursor,
    "2. PV and electrical configuration",
  );

  keyValue(
    document,
    payload,
    cursor,
    "PV module",
    pv.moduleProfileId,
  );

  keyValue(
    document,
    payload,
    cursor,
    "Installed modules",
    `${installedModules} (${pv.numberOfRows} rows x ${pv.modulesPerRow})`,
  );

  keyValue(
    document,
    payload,
    cursor,
    "Installed DC",
    `${installedCapacityKw.toFixed(2)} kWp`,
  );

  keyValue(
    document,
    payload,
    cursor,
    "Inverter",
    pv.inverterProfileId ??
      "Default inverter profile",
  );

  keyValue(
    document,
    payload,
    cursor,
    "Inverter units",
    String(
      pv.inverterCount ??
      1,
    ),
  );

  keyValue(
    document,
    payload,
    cursor,
    "String design",
    pv.modulesPerString &&
    pv.stringsPerInverter
      ? `${pv.modulesPerString} modules/string; ${pv.stringsPerInverter} strings/inverter`
      : "Incomplete or assumed topology",
  );

  keyValue(
    document,
    payload,
    cursor,
    "Array geometry",
    `${pv.rowSpacing} m spacing; ${pv.panelHeight} m height; ${pv.tilt} deg tilt; ${pv.azimuth} deg azimuth`,
  );

  keyValue(
    document,
    payload,
    cursor,
    "Tracking",
    pv.trackingMode,
  );

  const physicsConfiguration =
    resolvePhysicsConfiguration(
      pv.physicsConfiguration,
    );

  keyValue(
    document,
    payload,
    cursor,
    "Simulation model mode",
    physicsConfiguration.mode,
  );

  keyValue(
    document,
    payload,
    cursor,
    "Efficiency boundary",
    physicsConfiguration.mode === "legacy_parity"
      ? `Aggregate system efficiency ${(pv.systemEfficiency * 100).toFixed(1)}% with inverter passthrough`
      : "Explicit optical/DC/MPPT/inverter/AC losses; aggregate system efficiency disabled",
  );

  heading(
    document,
    payload,
    cursor,
    "3. Modeled performance summary",
  );

  keyValue(
    document,
    payload,
    cursor,
    "Total energy",
    `${payload.summary.totalEnergyKWh.toFixed(2)} kWh`,
  );

  keyValue(
    document,
    payload,
    cursor,
    "Average/day",
    `${payload.summary.averageDailyEnergyKWh.toFixed(2)} kWh/day`,
  );

  keyValue(
    document,
    payload,
    cursor,
    "Peak daily energy",
    `${payload.summary.peakDailyEnergyKWh.toFixed(2)} kWh`,
  );

  keyValue(
    document,
    payload,
    cursor,
    "Peak power",
    `${payload.summary.peakPowerKw.toFixed(2)} kW`,
  );

  keyValue(
    document,
    payload,
    cursor,
    "Period specific yield",
    `${specificYield.toFixed(2)} kWh/kWp`,
  );

  keyValue(
    document,
    payload,
    cursor,
    "Capacity factor",
    `${capacityFactorPercent.toFixed(2)}%`,
  );

  addChart(
    document,
    payload,
    cursor,
  );

  heading(
    document,
    payload,
    cursor,
    "4. Model equations",
  );

  for (
    const formula of
    researchFormulaRows()
  ) {
    paragraph(
      document,
      payload,
      cursor,
      `${formula.quantity}: ${formula.equation}. ${formula.note}`,
    );
  }

  heading(
    document,
    payload,
    cursor,
    "5. Data provenance and assumptions",
  );

  keyValue(
    document,
    payload,
    cursor,
    "Weather",
    payload.weatherProvider === "feni_measured"
      ? `World Bank/ESMAP Feni BDFE2 measured series (${payload.weatherApplicationClassification ?? "classification unavailable"})`
      : `Open-Meteo ${payload.summary.source} series`,
  );

  if (payload.weatherDatasetId) {
    keyValue(document, payload, cursor, "Weather dataset", payload.weatherDatasetId);
  }

  keyValue(
    document,
    payload,
    cursor,
    "Weather rows",
    String(
      payload.weather.length,
    ),
  );

  keyValue(
    document,
    payload,
    cursor,
    "Power rows",
    String(
      payload.hourlyPower.length,
    ),
  );

  for (
    const assumption of
    researchAssumptions()
  ) {
    paragraph(
      document,
      payload,
      cursor,
      `- ${assumption}`,
    );
  }

  if (
    [...new Set(payload.warnings)].length > 0
  ) {
    heading(
      document,
      payload,
      cursor,
      "6. Warnings",
    );

    for (
      const warning of
      [...new Set(payload.warnings)]
    ) {
      paragraph(
        document,
        payload,
        cursor,
        `- ${warning}`,
      );
    }
  }

  heading(
    document,
    payload,
    cursor,
    "7. Validation statement",
  );

  paragraph(
    document,
    payload,
    cursor,
    "This document reports AgriTwin modeled results. It does not by itself establish agreement with a physical plant. Research-publication claims require comparison against an independently configured PVlib model, an independently configured Simulink model, and preferably synchronized measured plant data using declared error metrics such as MBE, MAE, RMSE, normalized RMSE and R-squared.",
  );

  addFooter(
    document,
    document.getNumberOfPages(),
  );

  document.save(
    `${exportBasename(payload)}.pdf`,
  );
}
