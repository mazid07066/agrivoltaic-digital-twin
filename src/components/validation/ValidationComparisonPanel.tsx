"use client";

import {
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  aggregateComparisonSeries,
  automaticComparisonResolution,
  buildComparisonSeries,
  calculateValidationMetrics,
  filterComparisonRange,
} from "@/lib/validationStudio";

import {
  exportComparisonCsv,
  exportResearchChartPng,
  exportResearchChartSvg,
  exportValidationWorkbook,
  renderResearchChartPngDataUrl,
} from "@/lib/validationStudio/export";

import {
  FENI_VALIDATION_SITE,
  formatValidationAxisTick,
  formatValidationDateRange,
  validationSiteCoordinateLabel,
} from "@/lib/validationStudio";

import styles from "./ValidationComparisonPanel.module.css";

import type {
  ComparisonRange,
  ComparisonResolution,
  ValidationStudioDataset,
  ValidationStudioVariable,
} from "@/lib/validationStudio";

interface Props {
  datasets:
    ValidationStudioDataset[];
}

const labels:
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
      "POA",

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

const seriesColors = [
  "#147a4b",
  "#2768b2",
  "#d36b22",
  "#7d4ca5",
];

const units:
  Partial<
    Record<
      ValidationStudioVariable,
      string
    >
  > = {
    ghiWm2:
      "W/m²",

    dniWm2:
      "W/m²",

    dhiWm2:
      "W/m²",

    poaWm2:
      "W/m²",

    ambientTemperatureC:
      "°C",

    moduleTemperatureC:
      "°C",

    dcPowerKw:
      "kW",

    acPowerKw:
      "kW",

    energyKWh:
      "kWh",

    dcVoltageV:
      "V",

    dcCurrentA:
      "A",

    cropIrradianceWm2:
      "W/m²",
  };

function formatTimestamp(
  timestamp:
    string,

  resolution:
    ComparisonResolution,
): string {
  const date =
    new Date(
      timestamp,
    );

  if (
    resolution ===
    "monthly"
  ) {
    return new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone:
          FENI_VALIDATION_SITE.timezone,

        month:
          "short",

        year:
          "numeric",
      },
    ).format(
      date,
    );
  }

  if (
    resolution ===
    "daily"
  ) {
    return new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone:
          FENI_VALIDATION_SITE.timezone,

        day:
          "2-digit",

        month:
          "short",

        year:
          "numeric",
      },
    ).format(
      date,
    );
  }

  return formatValidationAxisTick(
    timestamp,
    FENI_VALIDATION_SITE.timezone,
  );
}

function safeNumber(
  value:
    number,
): string {
  return Number.isFinite(
    value,
  )
    ? value.toFixed(
        4,
      )
    : "N/A";
}

export default function ValidationComparisonPanel({
  datasets,
}: Props) {
  const chartRef =
    useRef<HTMLDivElement>(
      null,
    );

  const [
    printChartUrl,
    setPrintChartUrl,
  ] =
    useState<string | null>(
      null,
    );
  const commonVariables =
    useMemo(
      () => {
        if (
          datasets.length ===
          0
        ) {
          return [];
        }

        return datasets[0]!
          .variables
          .filter(
            (variable) =>
              datasets.every(
                (dataset) =>
                  dataset.variables.includes(
                    variable,
                  ),
              ),
          );
      },
      [
        datasets,
      ],
    );

  const [
    variable,
    setVariable,
  ] =
    useState<
      ValidationStudioVariable | ""
    >(
      "",
    );

  const [
    range,
    setRange,
  ] =
    useState<
      ComparisonRange
    >(
      "full",
    );

  const [
    requestedResolution,
    setRequestedResolution,
  ] =
    useState<
      "auto" |
      ComparisonResolution
    >(
      "auto",
    );

  const selectedVariable =
    variable ||
    commonVariables[0] ||
    "";

  const fullSeries =
    useMemo(
      () =>
        selectedVariable
          ? buildComparisonSeries(
              datasets,
              selectedVariable,
            )
          : [],
      [
        datasets,
        selectedVariable,
      ],
    );

  const rangedSeries =
    useMemo(
      () =>
        filterComparisonRange(
          fullSeries,
          range,
        ),
      [
        fullSeries,
        range,
      ],
    );

  const resolution =
    requestedResolution ===
    "auto"
      ? automaticComparisonResolution(
          rangedSeries,
        )
      : requestedResolution;

  const displaySeries =
    useMemo(
      () =>
        selectedVariable
          ? aggregateComparisonSeries(
              rangedSeries,
              datasets,
              selectedVariable,
              resolution,
            )
          : [],
      [
        rangedSeries,
        datasets,
        selectedVariable,
        resolution,
      ],
    );

  const chartData =
    displaySeries.map(
      (point) => ({
        timestamp:
          point.timestamp,

        label:
          formatTimestamp(
            point.timestamp,
            resolution,
          ),

        ...point.values,
      }),
    );

  const reference =
    datasets[0];

  const researchExportOptions =
    selectedVariable
      ? {
          title:
            `${labels[selectedVariable]} cross-model comparison`,

          subtitle:
            reference
              ? `Reference: ${reference.name}`
              : undefined,

          variableLabel:
            labels[selectedVariable],

          unitLabel:
            units[selectedVariable] ??
            "",

          periodLabel:
            rangedSeries.length > 0
              ? formatValidationDateRange(
                  rangedSeries[0]!.timestamp,
                  rangedSeries[
                    rangedSeries.length -
                      1
                  ]!.timestamp,
                  FENI_VALIDATION_SITE.timezone,
                )
              : "No displayed period",

          resolutionLabel:
            resolution,

          series:
            datasets.map(
              (
                dataset,
                index,
              ) => ({
                name:
                  dataset.name,

                color:
                  seriesColors[
                    index %
                    seriesColors.length
                  ]!,
              }),
            ),

          widthPx:
            3000,
        }
      : null;

  const metricResults =
    useMemo(
      () => {
        if (
          !reference ||
          !selectedVariable
        ) {
          return [];
        }

        return datasets
          .slice(
            1,
          )
          .map(
            (candidate) => {
              const referenceValues:
                number[] =
                [];

              const candidateValues:
                number[] =
                [];

              for (
                const point of
                fullSeries
              ) {
                const ref =
                  point.values[
                    reference.id
                  ];

                const candidateValue =
                  point.values[
                    candidate.id
                  ];

                if (
                  typeof ref ===
                    "number" &&
                  typeof candidateValue ===
                    "number"
                ) {
                  referenceValues.push(
                    ref,
                  );

                  candidateValues.push(
                    candidateValue,
                  );
                }
              }

              return {
                dataset:
                  candidate,

                metrics:
                  calculateValidationMetrics(
                    referenceValues,
                    candidateValues,
                  ),
              };
            },
          );
      },
      [
        datasets,
        reference,
        selectedVariable,
        fullSeries,
      ],
    );

  if (
    !reference
  ) {
    return (
      <p>
        No datasets available.
      </p>
    );
  }

  if (
    commonVariables.length ===
    0
  ) {
    return (
      <p>
        No common comparison
        variable exists across
        all registered datasets.
      </p>
    );
  }

  return (
    <div
      className={
        styles.comparisonPanel
      }
    >
      <div
        className={
          styles.controlGrid
        }
      >
        <label>
          Variable
          <select
            value={
              selectedVariable
            }
            onChange={(
              event,
            ) =>
              setVariable(
                event.target
                  .value as
                  ValidationStudioVariable,
              )
            }
          >
            {commonVariables.map(
              (item) => (
                <option
                  key={
                    item
                  }
                  value={
                    item
                  }
                >
                  {
                    labels[
                      item
                    ]
                  }
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          View range
          <select
            value={
              range
            }
            onChange={(
              event,
            ) =>
              setRange(
                event.target
                  .value as
                  ComparisonRange,
              )
            }
          >
            <option
              value="full"
            >
              Full period
            </option>

            <option
              value="year"
            >
              Latest year
            </option>

            <option
              value="three_months"
            >
              Latest 3 months
            </option>

            <option
              value="month"
            >
              Latest month
            </option>

            <option
              value="week"
            >
              Latest 7 days
            </option>
          </select>
        </label>

        <label>
          Display resolution
          <select
            value={
              requestedResolution
            }
            onChange={(
              event,
            ) =>
              setRequestedResolution(
                event.target
                  .value as
                  "auto" |
                  ComparisonResolution,
              )
            }
          >
            <option
              value="auto"
            >
              Auto
            </option>

            <option
              value="hourly"
            >
              Hourly
            </option>

            <option
              value="daily"
            >
              Daily
            </option>

            <option
              value="monthly"
            >
              Monthly
            </option>
          </select>
        </label>
      </div>

      <p>
        Display:
        {" "}
        <strong>
          {
            displaySeries.length
          }
        </strong>
        {" "}
        {
          resolution
        }
        {" "}
        points from
        {" "}
        <strong>
          {
            rangedSeries.length
          }
        </strong>
        {" "}
        synchronized raw
        observations. Validation
        metrics below always use
        the full synchronized
        series.
      </p>

      <div
        className={
          styles.exportToolbar
        }
      >
        <button
          type="button"
          className={
            styles.exportButton
          }
          onClick={() =>
            exportComparisonCsv({
              series:
                fullSeries,

              datasets,

              variable:
                selectedVariable,
            })
          }
        >
          Export Aligned CSV
        </button>

        <button
          type="button"
          className={
            styles.exportButton
          }
          onClick={() =>
            void exportValidationWorkbook({
              datasets,

              series:
                fullSeries,

              variable:
                selectedVariable,

              reference,

              metrics:
                metricResults,
            })
          }
        >
          Export XLSX Report
        </button>

        <button
          type="button"
          className={
            styles.exportButton
          }
          onClick={() => {
            if (
              chartRef.current
            ) {
              if (
                researchExportOptions
              ) {
                void exportResearchChartPng(
                  chartRef.current,
                  `agritwin-validation-${selectedVariable}-${resolution}-research.png`,
                  researchExportOptions,
                );
              }
            }
          }}
        >
          Export Graph PNG
        </button>

        <button
          type="button"
          className={
            styles.exportButton
          }
          onClick={() => {
            if (
              chartRef.current &&
              researchExportOptions
            ) {
              exportResearchChartSvg(
                chartRef.current,
                `agritwin-validation-${selectedVariable}-${resolution}-research.svg`,
                researchExportOptions,
              );
            }
          }}
        >
          Export Vector SVG
        </button>

        <button
          type="button"
          className={
            styles.exportButton
          }
          onClick={() => {
            void (
              async () => {
                if (
                  !chartRef.current
                ) {
                  return;
                }

                const snapshot =
                  researchExportOptions
                    ? await renderResearchChartPngDataUrl(
                        chartRef.current,
                        {
                          ...researchExportOptions,

                          widthPx:
                            3000,
                        },
                      )
                    : null;

                setPrintChartUrl(
                  snapshot,
                );

                await new Promise<void>(
                  (resolve) => {
                    requestAnimationFrame(
                      () => {
                        requestAnimationFrame(
                          () =>
                            resolve(),
                        );
                      },
                    );
                  },
                );

                window.print();
              }
            )();
          }}
        >
          Print / Save PDF
        </button>
      </div>


      {printChartUrl && (
        <img
          src={
            printChartUrl
          }
          alt={`${labels[selectedVariable]} cross-model comparison`}
          className={
            styles.printChartImage
          }
        />
      )}

      <div
        ref={
          chartRef
        }
        className={
          styles.chartShell
        }
      >
        <ResponsiveContainer>
          <LineChart
            data={
              chartData
            }
            margin={{
              top:
                12,

              right:
                18,

              bottom:
                18,

              left:
                8,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="label"
              minTickGap={
                55
              }
              tick={{
                fontSize:
                  11,
              }}
            />

            <YAxis
              width={
                72
              }
              tick={{
                fontSize:
                  11,
              }}
              label={{
                value:
                  selectedVariable
                    ? `${labels[selectedVariable]} (${units[selectedVariable] ?? ""})`
                    : "",

                angle:
                  -90,

                position:
                  "insideLeft",

                style: {
                  textAnchor:
                    "middle",

                  fontSize:
                    11,
                },
              }}
            />

            <Tooltip />

            <Legend />

            {datasets.map(
              (
                dataset,
                index,
              ) => (
                <Line
                  key={
                    dataset.id
                  }
                  type="monotone"
                  dataKey={
                    dataset.id
                  }
                  name={
                    dataset.name
                  }
                  dot={
                    false
                  }
                  isAnimationActive={
                    false
                  }
                  strokeWidth={
                    index ===
                    0
                      ? 2.4
                      : 1.7
                  }
                  stroke={
                    seriesColors[
                      index %
                      seriesColors.length
                    ]
                  }
                />
              ),
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div
        className={
          styles.interpretationStrip
        }
      >
        <strong>
          How to read this figure
        </strong>

        <span>
          AgriTwin is the reference series.
          The displayed curve uses
          {` ${resolution} `}
          aggregation for readability,
          while MBE, MAE, RMSE,
          nRMSE, R² and correlation
          are calculated using all
          synchronized raw observations.
        </span>
      </div>

      <div
        className={
          styles.metricsGrid
        }
      >
        {metricResults.map(
          ({
            dataset,
            metrics,
          }) => (
            <article
              key={
                dataset.id
              }
              className={
                styles.metricsCard
              }
            >
              <h3>
                {
                  dataset.name
                }
                {" "}
                vs
                {" "}
                {
                  reference.name
                }
              </h3>

              <table>
                <tbody>
                  <tr>
                    <td>
                      Samples
                    </td>
                    <td>
                      {
                        metrics.count
                      }
                    </td>
                  </tr>

                  <tr>
                    <td>
                      MBE
                    </td>
                    <td>
                      {
                        safeNumber(
                          metrics.mbe,
                        )
                      }
                    </td>
                  </tr>

                  <tr>
                    <td>
                      MAE
                    </td>
                    <td>
                      {
                        safeNumber(
                          metrics.mae,
                        )
                      }
                    </td>
                  </tr>

                  <tr>
                    <td>
                      RMSE
                    </td>
                    <td>
                      {
                        safeNumber(
                          metrics.rmse,
                        )
                      }
                    </td>
                  </tr>

                  <tr>
                    <td>
                      nRMSE
                    </td>
                    <td>
                      {
                        Number.isFinite(
                          metrics.nrmsePercent,
                        )
                          ? `${metrics.nrmsePercent.toFixed(2)}%`
                          : "N/A"
                      }
                    </td>
                  </tr>

                  <tr>
                    <td>
                      R²
                    </td>
                    <td>
                      {
                        safeNumber(
                          metrics.rSquared,
                        )
                      }
                    </td>
                  </tr>

                  <tr>
                    <td>
                      Correlation
                    </td>
                    <td>
                      {
                        safeNumber(
                          metrics.correlation,
                        )
                      }
                    </td>
                  </tr>

                  <tr>
                    <td>
                      Total-series
                      error
                    </td>
                    <td>
                      {
                        Number.isFinite(
                          metrics.energyErrorPercent,
                        )
                          ? `${metrics.energyErrorPercent.toFixed(3)}%`
                          : "N/A"
                      }
                    </td>
                  </tr>
                </tbody>
              </table>
            </article>
          ),
        )}
      </div>
    </div>
  );
}
