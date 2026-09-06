"use client";

import Link from "next/link";

import {
  useMemo,
  useState,
} from "react";

import {
  evaluateSynchronization,
} from "@/lib/validationStudio";

import type {
  ValidationStudioDataset,
} from "@/lib/validationStudio";

import AutoValidationDatasetUpload from "./AutoValidationDatasetUpload";
import ValidationComparisonPanel from "./ValidationComparisonPanel";
import ValidationExplainabilityPanel from "./ValidationExplainabilityPanel";
import ValidationMetricsPanel from "./ValidationMetricsPanel";
import ValidationScientificViews from "./ValidationScientificViews";

import styles from "./ValidationStudioDashboard.module.css";

type StudioTab =
  | "datasets"
  | "alignment"
  | "comparison"
  | "metrics"
  | "explain";

const tabs: {
  id:
    StudioTab;

  label:
    string;
}[] = [
  {
    id:
      "datasets",

    label:
      "Datasets",
  },
  {
    id:
      "alignment",

    label:
      "Alignment",
  },
  {
    id:
      "comparison",

    label:
      "Comparison",
  },
  {
    id:
      "metrics",

    label:
      "Metrics",
  },
  {
    id:
      "explain",

    label:
      "Explain",
  },
];

export default function ValidationStudioDashboard() {
  const [
    activeTab,
    setActiveTab,
  ] =
    useState<StudioTab>(
      "datasets",
    );

  const [
    datasets,
    setDatasets,
  ] =
    useState<
      ValidationStudioDataset[]
    >(
      [],
    );

  const alignmentReport =
    useMemo(
      () =>
        datasets.length >=
        2
          ? evaluateSynchronization(
              datasets,
            )
          : null,
      [
        datasets,
      ],
    );

  const alignmentReady =
    alignmentReport?.ready ??
    false;

  function addDataset(
    dataset:
      ValidationStudioDataset,
  ) {
    setDatasets(
      (current) => [
        ...current.filter(
          (item) =>
            !(
              item.sourceType ===
                dataset.sourceType &&
              item.fileName ===
                dataset.fileName
            ),
        ),

        dataset,
      ],
    );
  }

  function removeDataset(
    id:
      string,
  ) {
    setDatasets(
      (current) =>
        current.filter(
          (dataset) =>
            dataset.id !==
            id,
        ),
    );
  }

  return (
    <main
      className={
        styles.page
      }
    >
      <header
        className={
          styles.header
        }
      >
        <div>
          <Link
            href="/projects"
            className={
              styles.backLink
            }
          >
            ← Projects
          </Link>

          <p
            className={
              styles.eyebrow
            }
          >
            AgriTwin Phase 12
          </p>

          <h1>
            Validation &amp;
            Explainability
            Studio
          </h1>

          <p
            className={
              styles.subtitle
            }
          >
            Cross-model and
            measured-data
            validation with
            explicit
            synchronization,
            provenance and
            explainability.
          </p>
        </div>

        <div
          className={
            styles.statusCard
          }
        >
          <span
            className={
              styles.statusLabel
            }
          >
            Synchronization
          </span>

          <strong>
            {alignmentReady
              ? "READY"
              : datasets.length <
                  2
                ? "AWAITING DATASETS"
                : "BLOCKED"}
          </strong>

          <span
            className={
              styles.statusDetail
            }
          >
            {
              datasets.length
            }
            {" "}
            registered
            datasets
          </span>
        </div>
      </header>

      <nav
        className={
          styles.tabs
        }
      >
        {tabs.map(
          (tab) => (
            <button
              key={
                tab.id
              }
              type="button"
              className={
                activeTab ===
                tab.id
                  ? styles.activeTab
                  : styles.tab
              }
              onClick={() =>
                setActiveTab(
                  tab.id,
                )
              }
            >
              {tab.label}
            </button>
          ),
        )}
      </nav>

      {activeTab ===
        "datasets" && (
        <section
          className={
            styles.panel
          }
        >
          <div
            className={
              styles.panelHeading
            }
          >
            <div>
              <h2>
                Validation
                datasets
              </h2>

              <p>
                Inspect, map and
                register
                independent
                datasets.
              </p>
            </div>
          </div>

          <div
            className={
              styles.uploadStack
            }
          >
            <AutoValidationDatasetUpload
              sourceType="agritwin"
              onDatasetAdded={
                addDataset
              }
            />

            <AutoValidationDatasetUpload
              sourceType="pvlib"
              onDatasetAdded={
                addDataset
              }
            />

            <AutoValidationDatasetUpload
              sourceType="simulink"
              onDatasetAdded={
                addDataset
              }
            />
          </div>

          <div
            className={
              styles.registeredSection
            }
          >
            <h3>
              Registered
              canonical datasets
            </h3>

            {datasets.length ===
            0 ? (
              <div
                className={
                  styles.emptyState
                }
              >
                No datasets have
                been added yet.
              </div>
            ) : (
              <div
                className={
                  styles.registeredGrid
                }
              >
                {datasets.map(
                  (
                    dataset,
                  ) => (
                    <article
                      key={
                        dataset.id
                      }
                      className={
                        styles.registeredCard
                      }
                    >
                      <div>
                        <strong>
                          {
                            dataset.name
                          }
                        </strong>

                        <span>
                          {
                            dataset.sourceType
                          }
                        </span>
                      </div>

                      <dl>
                        <div>
                          <dt>
                            File
                          </dt>
                          <dd>
                            {
                              dataset.fileName
                            }
                          </dd>
                        </div>

                        <div>
                          <dt>
                            Rows
                          </dt>
                          <dd>
                            {
                              dataset
                                .observations
                                .length
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
                            Variables
                          </dt>
                          <dd>
                            {dataset.variables.join(
                              ", ",
                            )}
                          </dd>
                        </div>
                      </dl>

                      <button
                        type="button"
                        onClick={() =>
                          removeDataset(
                            dataset.id,
                          )
                        }
                      >
                        Remove
                      </button>
                    </article>
                  ),
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab ===
        "alignment" && (
        <section
          className={
            styles.panel
          }
        >
          <h2>
            Synchronization
            gate
          </h2>

          {!alignmentReport ? (
            <div
              className={
                styles.warning
              }
            >
              Add at least two
              canonical datasets
              to evaluate
              synchronization.
            </div>
          ) : (
            <>
              <div
                className={
                  styles.alignmentSummary
                }
              >
                <strong>
                  {alignmentReport.ready
                    ? "READY FOR COMPARISON"
                    : "COMPARISON BLOCKED"}
                </strong>

                <span>
                  Common
                  timestamps:
                  {" "}
                  {
                    alignmentReport
                      .commonTimestamps
                      .length
                  }
                </span>

                <span>
                  Common
                  variables:
                  {" "}
                  {alignmentReport
                    .commonVariables
                    .join(
                      ", ",
                    ) ||
                    "none"}
                </span>
              </div>

              <div
                className={
                  styles.checkGrid
                }
              >
                {alignmentReport.checks.map(
                  (
                    check,
                  ) => (
                    <div
                      key={
                        check.key
                      }
                      className={
                        styles.checkRow
                      }
                    >
                      <div>
                        <strong>
                          {
                            check.key
                          }
                        </strong>

                        <span>
                          {
                            check.message
                          }
                        </span>
                      </div>

                      <strong
                        className={
                          check.level ===
                          "PASS"
                            ? styles.pass
                            : check.level ===
                                "WARNING"
                              ? styles.pending
                              : styles.blocked
                        }
                      >
                        {
                          check.level
                        }
                      </strong>
                    </div>
                  ),
                )}
              </div>
            </>
          )}
        </section>
      )}

      {activeTab ===
        "comparison" && (
        <section
          className={
            styles.panel
          }
        >
          <h2>
            Comparison
          </h2>

          {alignmentReady ? (
            <>
              <ValidationComparisonPanel
                datasets={
                  datasets
                }
              />

              <ValidationScientificViews
                datasets={
                  datasets
                }
              />
            </>
          ) : (
            <div
              className={
                styles.warning
              }
            >
              Comparison is
              locked until
              alignment passes.
            </div>
          )}
        </section>
      )}

      {activeTab ===
        "metrics" && (
        <section
          className={
            styles.panel
          }
        >
          <h2>
            Validation metrics
          </h2>

          {alignmentReady ? (
            <ValidationMetricsPanel
              datasets={
                datasets
              }
            />
          ) : (
            <div
              className={
                styles.warning
              }
            >
              Metrics remain
              locked until
              datasets are
              synchronized.
            </div>
          )}
        </section>
      )}

      {activeTab ===
        "explain" && (
        <section
          className={
            styles.panel
          }
        >
          <h2>
            Physics
            explainability
          </h2>

          <ValidationExplainabilityPanel
            datasets={
              datasets
            }
          />
        </section>
      )}

    </main>
  );
}
