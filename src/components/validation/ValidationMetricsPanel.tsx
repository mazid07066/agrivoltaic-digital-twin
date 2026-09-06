"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  buildComparisonSeries,
  calculateValidationMetrics,
} from "@/lib/validationStudio";

import type {
  ValidationStudioDataset,
  ValidationStudioVariable,
} from "@/lib/validationStudio";

import {
  exportValidationMetricsWorkbook,
} from "@/lib/validationStudio/export";

import styles from "./ValidationMetricsPanel.module.css";

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

function formatMetric(
  value:
    number,
  digits =
    4,
): string {
  return Number.isFinite(
    value,
  )
    ? value.toFixed(
        digits,
      )
    : "N/A";
}

export default function ValidationMetricsPanel({
  datasets,
}: Props) {
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
    selectedVariable,
    setSelectedVariable,
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

  const series =
    useMemo(
      () =>
        buildComparisonSeries(
          datasets,
          selectedVariable,
        ),
      [
        datasets,
        selectedVariable,
      ],
    );

  const reference =
    datasets.find(
      (dataset) =>
        dataset.id ===
        referenceId,
    ) ??
    datasets[0];

  const metrics =
    useMemo(
      () => {
        if (
          !reference
        ) {
          return [];
        }

        return datasets
          .filter(
            (dataset) =>
              dataset.id !==
              reference.id,
          )
          .map(
            (candidate) => ({
              candidate,
            metrics:
              (() => {
                const pairs =
                  series
                    .map(
                      (point) => ({
                        reference:
                          point.values[
                            reference.id
                          ],

                        candidate:
                          point.values[
                            candidate.id
                          ],
                      }),
                    )
                    .filter(
                      (
                        pair,
                      ): pair is {
                        reference:
                          number;

                        candidate:
                          number;
                      } =>
                        typeof pair.reference ===
                          "number" &&
                        Number.isFinite(
                          pair.reference,
                        ) &&
                        typeof pair.candidate ===
                          "number" &&
                        Number.isFinite(
                          pair.candidate,
                        ),
                    );

                return calculateValidationMetrics(
                  pairs.map(
                    (pair) =>
                      pair.reference,
                  ),

                  pairs.map(
                    (pair) =>
                      pair.candidate,
                  ),
                );
              })(),
            }),
          );
      },
      [
        datasets,
        reference,
        series,
      ],
    );

  if (
    datasets.length <
    2
  ) {
    return (
      <p>
        Add and synchronize at
        least two datasets to
        calculate validation
        metrics.
      </p>
    );
  }

  return (
    <div
      className={
        styles.metricsPanel
      }
    >
      <header
        className={
          styles.reportHeader
        }
      >
        <div>
          <span
            className={
              styles.reportKicker
            }
          >
            AGRITWIN PHASE 12
          </span>

          <h3>
            Statistical Validation
            Metrics Report
          </h3>

          <p>
            Synchronized raw-data
            comparison of the selected
            validation variable against
            the declared reference
            dataset.
          </p>
        </div>

        <dl
          className={
            styles.reportMeta
          }
        >
          <div>
            <dt>
              Variable
            </dt>
            <dd>
              {
                labels[
                  selectedVariable
                ]
              }
            </dd>
          </div>

          <div>
            <dt>
              Reference
            </dt>
            <dd>
              {
                reference?.name ??
                "Unavailable"
              }
            </dd>
          </div>

          <div>
            <dt>
              Samples
            </dt>
            <dd>
              {
                series.length
              }
            </dd>
          </div>
        </dl>
      </header>
      <div
        className={
          styles.controls
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
              setSelectedVariable(
                event.target
                  .value as
                  ValidationStudioVariable,
              )
            }
          >
            {commonVariables.map(
              (variable) => (
                <option
                  key={
                    variable
                  }
                  value={
                    variable
                  }
                >
                  {
                    labels[
                      variable
                    ]
                  }
                  {units[
                    variable
                  ]
                    ? ` (${units[variable]})`
                    : ""}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          Reference dataset

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

      <div
        className={
          styles.scienceNote
        }
      >
        <strong>
          Raw-data statistics
        </strong>

        <span>
          Every metric below is
          calculated from the full
          synchronized observation
          series. Chart aggregation
          used elsewhere in the
          studio does not alter
          these statistics.
        </span>
      </div>

      <div
        className={
          styles.exportToolbar
        }
      >
        <button
          type="button"
          onClick={() => {
            if (
              !reference
            ) {
              return;
            }

            void exportValidationMetricsWorkbook({
              variableLabel:
                labels[
                  selectedVariable
                ],

              unitLabel:
                units[
                  selectedVariable
                ] ?? "",

              referenceName:
                reference.name,

              referenceSourceType:
                reference.sourceType,

              startTimestamp:
                series[0]?.timestamp ??
                null,

              endTimestamp:
                series[
                  series.length -
                  1
                ]?.timestamp ??
                null,

              metrics:
                metrics.map(
                  ({
                    candidate,
                    metrics:
                      result,
                  }) => ({
                    candidateName:
                      candidate.name,

                    candidateSourceType:
                      candidate.sourceType,

                    count:
                      result.count,

                    mbe:
                      result.mbe,

                    mae:
                      result.mae,

                    rmse:
                      result.rmse,

                    nrmsePercent:
                      result.nrmsePercent,

                    rSquared:
                      result.rSquared,

                    correlation:
                      result.correlation,

                    totalSeriesErrorPercent:
                      result.energyErrorPercent,
                  }),
                ),

              datasets,
            });
          }}
        >
          Export Metrics XLSX
        </button>

        <button
          type="button"
          onClick={() =>
            window.print()
          }
        >
          Print / Save Metrics PDF
        </button>
      </div>

      <div
        className={
          styles.tableWrap
        }
      >
        <table
          className={
            styles.metricsTable
          }
        >
          <thead>
            <tr>
              <th>
                Candidate
              </th>
              <th>N</th>
              <th>MBE</th>
              <th>MAE</th>
              <th>RMSE</th>
              <th>
                nRMSE
              </th>
              <th>R²</th>
              <th>
                Correlation
              </th>
              <th>
                Total-series
                error
              </th>
            </tr>
          </thead>

          <tbody>
            {metrics.map(
              ({
                candidate,
                metrics:
                  result,
              }) => (
                <tr
                  key={
                    candidate.id
                  }
                >
                  <td>
                    <strong>
                      {
                        candidate.name
                      }
                    </strong>

                    <span
                      className={
                        styles.sourceType
                      }
                    >
                      {
                        candidate.sourceType
                      }
                    </span>
                  </td>

                  <td>
                    {
                      result.count
                    }
                  </td>

                  <td>
                    {
                      formatMetric(
                        result.mbe,
                      )
                    }
                  </td>

                  <td>
                    {
                      formatMetric(
                        result.mae,
                      )
                    }
                  </td>

                  <td>
                    {
                      formatMetric(
                        result.rmse,
                      )
                    }
                  </td>

                  <td>
                    {formatMetric(
                      result.nrmsePercent,
                      2,
                    )}
                    %
                  </td>

                  <td>
                    {
                      formatMetric(
                        result.rSquared,
                      )
                    }
                  </td>

                  <td>
                    {
                      formatMetric(
                        result.correlation,
                      )
                    }
                  </td>

                  <td>
                    {formatMetric(
                      result.energyErrorPercent,
                      3,
                    )}
                    %
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      <div
        className={
          styles.methodNote
        }
      >
        Cross-model agreement
        represents model
        verification. Empirical
        validation requires a
        synchronized measured
        reference dataset.
      </div>
    </div>
  );
}
