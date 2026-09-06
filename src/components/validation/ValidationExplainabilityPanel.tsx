"use client";

import type {
  ValidationStudioDataset,
  ValidationStudioVariable,
} from "@/lib/validationStudio";

import {
  exportValidationExplainabilityWorkbook,
} from "@/lib/validationStudio/export";

import styles from "./ValidationExplainabilityPanel.module.css";

interface Props {
  datasets:
    ValidationStudioDataset[];
}

interface PhysicsStage {
  name:
    string;

  description:
    string;

  variables:
    ValidationStudioVariable[];

  structural?:
    boolean;
}

const stages:
  PhysicsStage[] = [
    {
      name:
        "Weather resource",

      description:
        "Irradiance and ambient environmental drivers.",

      variables: [
        "ghiWm2",
        "dniWm2",
        "dhiWm2",
        "ambientTemperatureC",
      ],
    },
    {
      name:
        "Plane-of-array irradiance",

      description:
        "Irradiance transformed onto the PV plane.",

      variables: [
        "poaWm2",
      ],
    },
    {
      name:
        "Module thermal state",

      description:
        "PV cell/module operating temperature.",

      variables: [
        "moduleTemperatureC",
      ],
    },
    {
      name:
        "DC electrical output",

      description:
        "PV-side electrical response before inversion.",

      variables: [
        "dcPowerKw",
        "dcVoltageV",
        "dcCurrentA",
      ],
    },
    {
      name:
        "Agrivoltaic crop irradiance",

      description:
        "Below-array irradiance relevant to the crop layer.",

      variables: [
        "cropIrradianceWm2",
      ],
    },
    {
      name:
        "AC output",

      description:
        "Final inverter/plant AC power and energy.",

      variables: [
        "acPowerKw",
        "energyKWh",
      ],
    },
    {
      name:
        "IAM / optical losses",

      description:
        "Intermediate optical-loss stage.",

      variables:
        [],

      structural:
        true,
    },
    {
      name:
        "Row shading / soiling",

      description:
        "Intermediate irradiance-loss mechanisms.",

      variables:
        [],

      structural:
        true,
    },
    {
      name:
        "String / MPPT topology",

      description:
        "Electrical aggregation and MPPT topology stage.",

      variables:
        [],

      structural:
        true,
    },
    {
      name:
        "Inverter loss decomposition",

      description:
        "Intermediate DC-to-AC conversion-loss attribution.",

      variables:
        [],

      structural:
        true,
    },
  ];

function datasetStageStatus(
  dataset:
    ValidationStudioDataset,

  stage:
    PhysicsStage,
): {
  label:
    string;

  tone:
    "available" |
    "partial" |
    "unavailable";

  evidence:
    string;
} {
  if (
    stage.structural
  ) {
    return {
      label:
        "Not independently exposed",

      tone:
        "unavailable",

      evidence:
        dataset.sourceType ===
        "agritwin"
          ? "Stage may exist internally, but the canonical validation dataset does not independently expose this intermediate."
          : "External dataset does not expose an independently comparable intermediate for this stage.",
    };
  }

  const available =
    stage.variables.filter(
      (variable) =>
        dataset.variables.includes(
          variable,
        ),
    );

  if (
    available.length ===
    stage.variables.length
  ) {
    return {
      label:
        "Available",

      tone:
        "available",

      evidence:
        available.join(
          ", ",
        ),
    };
  }

  if (
    available.length >
    0
  ) {
    return {
      label:
        "Partially available",

      tone:
        "partial",

      evidence:
        available.join(
          ", ",
        ),
    };
  }

  return {
    label:
      "Unavailable",

    tone:
      "unavailable",

    evidence:
      "No canonical variable available.",
  };
}

export default function ValidationExplainabilityPanel({
  datasets,
}: Props) {
  if (
    datasets.length ===
    0
  ) {
    return (
      <p>
        Register datasets to
        inspect physics-stage
        availability and
        provenance.
      </p>
    );
  }

  const exportRows =
    stages.flatMap(
      (stage) =>
        datasets.map(
          (dataset) => {
            const status =
              datasetStageStatus(
                dataset,
                stage,
              );

            return {
              stage:
                stage.name,

              description:
                stage.description,

              datasetName:
                dataset.name,

              sourceType:
                dataset.sourceType,

              status:
                status.label,

              evidence:
                status.evidence,
            };
          },
        ),
    );

  return (
    <div
      className={
        styles.explainPanel
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
            Physics Explainability
            & Provenance Report
          </h3>

          <p>
            Evidence-based
            assessment of physics-stage
            availability, dataset
            provenance and preprocessing
            transformations across the
            synchronized validation
            sources.
          </p>
        </div>

        <dl
          className={
            styles.reportMeta
          }
        >
          <div>
            <dt>
              Datasets
            </dt>
            <dd>
              {
                datasets.length
              }
            </dd>
          </div>

          <div>
            <dt>
              Report type
            </dt>
            <dd>
              Cross-model
              explainability
            </dd>
          </div>

          <div>
            <dt>
              Validation class
            </dt>
            <dd>
              Verification
            </dd>
          </div>
        </dl>
      </header>
      <div
        className={
          styles.explainNotice
        }
      >
        <strong>
          Evidence-based
          explainability
        </strong>

        <span>
          This matrix reports
          which intermediate
          quantities are actually
          present in each canonical
          dataset. It does not
          assign a model difference
          to IAM, shading, thermal,
          topology or inverter
          effects unless the
          corresponding external
          intermediate is available.
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
            void exportValidationExplainabilityWorkbook({
              rows:
                exportRows,

              datasets,
            });
          }}
        >
          Export Explain XLSX
        </button>

        <button
          type="button"
          onClick={() =>
            window.print()
          }
        >
          Print / Save Explain PDF
        </button>
      </div>

      <div
        className={
          styles.matrixWrap
        }
      >
        <table
          className={
            styles.matrix
          }
        >
          <thead>
            <tr>
              <th>
                Physics stage
              </th>

              {datasets.map(
                (dataset) => (
                  <th
                    key={
                      dataset.id
                    }
                  >
                    {
                      dataset.name
                    }

                    <span>
                      {
                        dataset.sourceType
                      }
                    </span>
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody>
            {stages.map(
              (stage) => (
                <tr
                  key={
                    stage.name
                  }
                >
                  <td>
                    <strong>
                      {
                        stage.name
                      }
                    </strong>

                    <span>
                      {
                        stage.description
                      }
                    </span>
                  </td>

                  {datasets.map(
                    (dataset) => {
                      const status =
                        datasetStageStatus(
                          dataset,
                          stage,
                        );

                      return (
                        <td
                          key={
                            dataset.id
                          }
                        >
                          <span
                            className={
                              styles[
                                status.tone
                              ]
                            }
                          >
                            {
                              status.label
                            }
                          </span>

                          <small>
                            {
                              status.evidence
                            }
                          </small>
                        </td>
                      );
                    },
                  )}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      <section
        className={
          styles.provenanceSection
        }
      >
        <h3>
          Dataset provenance
        </h3>

        <div
          className={
            styles.provenanceGrid
          }
        >
          {datasets.map(
            (dataset) => (
              <article
                key={
                  dataset.id
                }
                className={
                  styles.provenanceCard
                }
              >
                <h4>
                  {
                    dataset.name
                  }
                </h4>

                <dl>
                  <div>
                    <dt>
                      Source
                    </dt>
                    <dd>
                      {
                        dataset.sourceLabel
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Timezone
                    </dt>
                    <dd>
                      {
                        dataset.timezone
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Interval
                    </dt>
                    <dd>
                      {
                        dataset.intervalMinutes
                      }
                      {" "}
                      min
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Transformations
                    </dt>
                    <dd>
                      {dataset.transformations.length ===
                      0
                        ? "None recorded"
                        : dataset.transformations
                            .map(
                              (item) =>
                                item.description,
                            )
                            .join(
                              "; ",
                            )}
                    </dd>
                  </div>
                </dl>

                <h5>
                  Variable
                  provenance
                </h5>

                <ul>
                  {dataset.variableProvenance.map(
                    (item) => (
                      <li
                        key={
                          item.variable
                        }
                      >
                        <strong>
                          {
                            item.variable
                          }
                        </strong>
                        {" — "}
                        {
                          item.sourceClassification
                        }
                        {"; "}
                        {item.originalColumn ??
                          "derived/canonical"}
                        {"; "}
                        {item.originalUnit ??
                          "unit not declared"}
                        {" → "}
                        {
                          item.canonicalUnit
                        }
                      </li>
                    ),
                  )}
                </ul>
              </article>
            ),
          )}
        </div>
      </section>

      <div
        className={
          styles.validationWarning
        }
      >
        <strong>
          Scientific interpretation
        </strong>

        <span>
          Cross-model agreement is
          verification, not empirical
          validation. Empirical
          validation requires
          synchronized measured
          observations.
        </span>
      </div>

      <footer
        className={
          styles.reportFooter
        }
      >
        AgriTwin Validation &
        Explainability Studio —
        Phase 12. Intermediate
        physics-stage attribution is
        reported only where the
        corresponding quantity is
        explicitly available in the
        canonical validation dataset.
      </footer>
    </div>
  );
}
