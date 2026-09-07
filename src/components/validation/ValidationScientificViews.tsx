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
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  buildComparisonSeries,
  buildCumulativeEnergySeries,
  buildDailyEnergySeries,
  buildParityPairs,
  buildResidualSeries,
  reduceComparisonForVisualization,
  supportsEnergyComparison,
  FENI_VALIDATION_SITE,
  formatValidationAxisTick,
  formatValidationDateRange,
  formatValidationLocalDateTime,
} from "@/lib/validationStudio";

import {
  exportResearchChartPng,
  exportResearchChartSvg,
} from "@/lib/validationStudio/export";

import type {
  ValidationStudioDataset,
  ValidationStudioVariable,
} from "@/lib/validationStudio";

import styles from "./ValidationScientificViews.module.css";

interface Props {
  datasets:
    ValidationStudioDataset[];
}

type ScientificView =
  | "residual"
  | "parity"
  | "daily_energy"
  | "cumulative_energy";

const colors = [
  "#147a4b",
  "#2768b2",
  "#d36b22",
  "#7d4ca5",
];

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

export default function ValidationScientificViews({
  datasets,
}: Props) {
  const chartRef =
    useRef<HTMLDivElement>(
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
      ValidationStudioVariable
    >(
      commonVariables.includes(
        "acPowerKw",
      )
        ? "acPowerKw"
        : commonVariables[0] ??
            "acPowerKw",
    );

  const [
    referenceId,
    setReferenceId,
  ] =
    useState(
      datasets[0]?.id ??
        "",
    );

  const [
    view,
    setView,
  ] =
    useState<
      ScientificView
    >(
      "residual",
    );

  const reference =
    datasets.find(
      (dataset) =>
        dataset.id ===
        referenceId,
    ) ??
    datasets[0];

  const candidates =
    datasets.filter(
      (dataset) =>
        dataset.id !==
        reference?.id,
    );

  const rawSeries =
    useMemo(
      () =>
        buildComparisonSeries(
          datasets,
          variable,
        ),
      [
        datasets,
        variable,
      ],
    );

  const residual =
    useMemo(
      () =>
        reference
          ? buildResidualSeries(
              rawSeries,
              reference.id,
              candidates.map(
                (candidate) =>
                  candidate.id,
              ),
            )
          : [],
      [
        candidates,
        rawSeries,
        reference,
      ],
    );

  const residualForDisplay =
    useMemo(
      () =>
        reduceComparisonForVisualization(
          residual,
          4000,
        ),
      [
        residual,
      ],
    );

  const dailyEnergy =
    useMemo(
      () =>
        buildDailyEnergySeries(
          rawSeries,
          datasets,
          variable,
        ),
      [
        datasets,
        rawSeries,
        variable,
      ],
    );

  const cumulativeEnergy =
    useMemo(
      () =>
        buildCumulativeEnergySeries(
          dailyEnergy,
          datasets,
        ),
      [
        dailyEnergy,
        datasets,
      ],
    );

  const parity =
    useMemo(
      () =>
        reference
          ? candidates.map(
              (
                candidate,
              ) => ({
                candidate,
                points:
                  reduceComparisonForVisualization(
                    buildParityPairs(
                      rawSeries,
                      reference.id,
                      candidate.id,
                    ),
                    5000,
                  ),
              }),
            )
          : [],
      [
        candidates,
        rawSeries,
        reference,
      ],
    );

  const parityExtent =
    useMemo(
      () => {
        const values =
          parity.flatMap(
            (item) =>
              item.points.flatMap(
                (point) => [
                  point.reference,
                  point.candidate,
                ],
              ),
          );

        if (
          values.length ===
          0
        ) {
          return {
            min:
              0,

            max:
              1,
          };
        }

        const rawMin =
          Math.min(
            ...values,
          );

        const rawMax =
          Math.max(
            ...values,
          );

        if (
          rawMin ===
          rawMax
        ) {
          const delta =
            Math.max(
              Math.abs(
                rawMin,
              ) *
                0.05,
              1,
            );

          return {
            min:
              rawMin -
              delta,

            max:
              rawMax +
              delta,
          };
        }

        const padding =
          (
            rawMax -
            rawMin
          ) *
          0.03;

        return {
          min:
            rawMin -
            padding,

          max:
            rawMax +
            padding,
        };
      },
      [
        parity,
      ],
    );

  const energyView =
    view ===
      "daily_energy" ||
    view ===
      "cumulative_energy";

  const periodLabel =
    rawSeries.length >
    0
      ? formatValidationDateRange(
          rawSeries[0]!.timestamp,
          rawSeries[
            rawSeries.length -
              1
          ]!.timestamp,
          FENI_VALIDATION_SITE.timezone,
        )
      : "No synchronized period";

  const title =
    view ===
    "residual"
      ? `${labels[variable]} residual comparison`
      : view ===
          "parity"
        ? `${labels[variable]} parity comparison`
        : view ===
            "daily_energy"
          ? "Daily energy comparison"
          : "Cumulative energy comparison";

  const exportOptions = {
    title,

    subtitle:
      reference
        ? `Reference: ${reference.name}`
        : undefined,

    variableLabel:
      energyView
        ? "Energy"
        : labels[
            variable
          ],

    unitLabel:
      energyView
        ? "kWh"
        : units[
            variable
          ] ?? "",

    periodLabel,

    resolutionLabel:
      view ===
      "parity"
        ? "raw synchronized"
        : view ===
            "residual"
          ? "raw synchronized"
          : "daily",

    series:
      candidates.map(
        (
          candidate,
          index,
        ) => ({
          name:
            view ===
            "residual"
              ? `${candidate.name} − ${reference?.name ?? "reference"}`
              : candidate.name,

          color:
            colors[
              index %
              colors.length
            ]!,
        }),
      ),

    widthPx:
      3000,
  };

  const lineData =
    view ===
    "residual"
      ? residualForDisplay.map(
          (point) => ({
            timestamp:
              point.timestamp,

            ...point.values,
          }),
        )
      : view ===
          "daily_energy"
        ? dailyEnergy.map(
            (point) => ({
              timestamp:
                point.timestamp,

              ...point.values,
            }),
          )
        : cumulativeEnergy.map(
            (point) => ({
              timestamp:
                point.timestamp,

              ...point.values,
            }),
          );

  return (
    <section
      className={
        styles.scientificSection
      }
    >
      <div
        className={
          styles.heading
        }
      >
        <div>
          <h3>
            Scientific figures
          </h3>

          <p>
            Residual, parity and
            energy-domain views for
            research interpretation.
            Large raw series are
            deterministically reduced
            for figure rendering only;
            validation statistics
            continue to use every
            synchronized observation.
          </p>
        </div>
      </div>

      <div
        className={
          styles.controls
        }
      >
        <label>
          View

          <select
            value={
              view
            }
            onChange={(
              event,
            ) =>
              setView(
                event.target
                  .value as
                  ScientificView,
              )
            }
          >
            <option
              value="residual"
            >
              Residual
            </option>

            <option
              value="parity"
            >
              Parity scatter
            </option>

            <option
              value="daily_energy"
            >
              Daily energy
            </option>

            <option
              value="cumulative_energy"
            >
              Cumulative energy
            </option>
          </select>
        </label>

        <label>
          Variable

          <select
            value={
              variable
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
          Reference

          <select
            value={
              reference?.id ??
              ""
            }
            onChange={(
              event,
            ) =>
              setReferenceId(
                event.target
                  .value,
              )
            }
          >
            {datasets.map(
              (dataset) => (
                <option
                  key={
                    dataset.id
                  }
                  value={
                    dataset.id
                  }
                >
                  {
                    dataset.name
                  }
                </option>
              ),
            )}
          </select>
        </label>
      </div>

      {energyView &&
      !supportsEnergyComparison(
        variable,
      ) ? (
        <div
          className={
            styles.notice
          }
        >
          Daily and cumulative
          energy views require
          AC power, DC power or
          energy as the selected
          variable.
        </div>
      ) : (
        <>
          <div
            ref={
              chartRef
            }
            className={
              styles.chart
            }
          >
            {view ===
            "parity" ? (
              <ResponsiveContainer>
                <ScatterChart
                  margin={{
                    top:
                      16,
                    right:
                      24,
                    bottom:
                      32,
                    left:
                      24,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    type="number"
                    dataKey="reference"
                    name={
                      reference?.name ??
                      "Reference"
                    }
                    domain={[
                      parityExtent.min,
                      parityExtent.max,
                    ]}
                    allowDataOverflow
                    unit={
                      units[
                        variable
                      ] ?? ""
                    }
                  />

                  <YAxis
                    type="number"
                    dataKey="candidate"
                    domain={[
                      parityExtent.min,
                      parityExtent.max,
                    ]}
                    allowDataOverflow
                    unit={
                      units[
                        variable
                      ] ?? ""
                    }
                  />

                  <Tooltip />

                  <Legend />

                  <ReferenceLine
                    segment={[
                      {
                        x:
                          parityExtent.min,
                        y:
                          parityExtent.min,
                      },
                      {
                        x:
                          parityExtent.max,
                        y:
                          parityExtent.max,
                      },
                    ]}
                    strokeDasharray="6 4"
                  />

                  {parity.map(
                    (
                      item,
                      index,
                    ) => (
                      <Scatter
                        key={
                          item
                            .candidate
                            .id
                        }
                        name={
                          item
                            .candidate
                            .name
                        }
                        data={
                          item.points
                        }
                        fill={
                          colors[
                            index %
                            colors.length
                          ]
                        }
                      />
                    ),
                  )}
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer>
                <LineChart
                  data={
                    lineData
                  }
                  margin={{
                    top:
                      16,
                    right:
                      24,
                    bottom:
                      32,
                    left:
                      24,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="timestamp"
                    minTickGap={
                      44
                    }
                    tickFormatter={(
                      value,
                    ) =>
                      view ===
                      "residual"
                        ? formatValidationAxisTick(
                            String(
                              value,
                            ),
                            FENI_VALIDATION_SITE.timezone,
                          )
                        : String(
                            value,
                          )
                    }
                  />

                  <YAxis />

                  <Tooltip
                    labelFormatter={(
                      value,
                    ) =>
                      view ===
                      "residual"
                        ? formatValidationLocalDateTime(
                            String(
                              value,
                            ),
                            FENI_VALIDATION_SITE.timezone,
                          )
                        : String(
                            value,
                          )
                    }
                  />

                  <Legend />

                  {view ===
                  "residual" && (
                    <ReferenceLine
                      y={
                        0
                      }
                      strokeDasharray="6 4"
                    />
                  )}

                  {(view ===
                  "residual"
                    ? candidates
                    : datasets
                  ).map(
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
                          view ===
                          "residual"
                            ? `${dataset.name} − ${reference?.name ?? "reference"}`
                            : dataset.name
                        }
                        stroke={
                          colors[
                            index %
                            colors.length
                          ]
                        }
                        strokeWidth={
                          1.8
                        }
                        dot={
                          false
                        }
                        connectNulls={
                          false
                        }
                      />
                    ),
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div
            className={
              styles.exportRow
            }
          >
            <button
              type="button"
              onClick={() => {
                if (
                  chartRef.current
                ) {
                  void exportResearchChartPng(
                    chartRef.current,
                    `agritwin-${view}-${variable}-research.png`,
                    exportOptions,
                  );
                }
              }}
            >
              Export 3000px PNG
            </button>

            <button
              type="button"
              onClick={() => {
                if (
                  chartRef.current
                ) {
                  exportResearchChartSvg(
                    chartRef.current,
                    `agritwin-${view}-${variable}-research.svg`,
                    exportOptions,
                  );
                }
              }}
            >
              Export Vector SVG
            </button>
          </div>
        </>
      )}

      <div
        className={
          styles.interpretation
        }
      >
        {view ===
        "residual"
          ? "Residual = candidate − reference. Values close to zero indicate agreement; persistent positive or negative residuals indicate systematic bias."
          : view ===
              "parity"
            ? "Parity compares synchronized candidate values directly against the selected reference. Points close to the 1:1 line indicate agreement."
            : view ===
                "daily_energy"
              ? "Daily energy integrates synchronized power using each dataset's declared interval. Energy-valued inputs are summed directly."
              : "Cumulative energy shows long-term divergence or convergence in integrated production across the synchronized period."}
      </div>
    </section>
  );
}
