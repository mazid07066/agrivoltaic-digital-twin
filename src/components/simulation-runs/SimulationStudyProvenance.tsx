import type {
  PersistedSimulationRun,
  SimulationRunReproducibilityReport,
} from "@/lib/execution/persistedRunTypes";

interface SimulationStudyProvenanceProps {
  run:
    PersistedSimulationRun;

  reproducibility:
    SimulationRunReproducibilityReport;
}

type UnknownRecord =
  Record<string, unknown>;

function isRecord(
  value:
    unknown,
): value is UnknownRecord {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(
      value,
    )
  );
}

function asRecord(
  value:
    unknown,
): UnknownRecord {
  return isRecord(
    value,
  )
    ? value
    : {};
}

function firstDefined(
  record:
    UnknownRecord,

  keys:
    string[],
): unknown {
  for (
    const key
    of keys
  ) {
    const value =
      record[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return null;
}

function displayValue(
  value:
    unknown,
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not recorded";
  }

  if (
    typeof value ===
    "boolean"
  ) {
    return value
      ? "Yes"
      : "No";
  }

  if (
    typeof value ===
      "number" ||
    typeof value ===
      "string"
  ) {
    return String(
      value,
    );
  }

  if (
    Array.isArray(
      value,
    )
  ) {
    return value.length
      ? value
          .map(
            (
              item,
            ) =>
              displayValue(
                item,
              ),
          )
          .join(
            ", ",
          )
      : "None";
  }

  try {
    return JSON.stringify(
      value,
    );
  } catch {
    return String(
      value,
    );
  }
}

function humanizeKey(
  key:
    string,
): string {
  return key
    .replace(
      /([a-z0-9])([A-Z])/g,
      "$1 $2",
    )
    .replace(
      /_/g,
      " ",
    )
    .replace(
      /\b\w/g,
      (
        character,
      ) =>
        character.toUpperCase(),
    );
}

interface ProvenanceRowProps {
  label:
    string;

  value:
    unknown;

  mono?:
    boolean;
}

function ProvenanceRow({
  label,
  value,
  mono =
    false,
}: ProvenanceRowProps) {
  return (
    <div className="grid gap-1 border-b border-slate-100 py-2 last:border-b-0 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-sm font-medium text-slate-500">
        {label}
      </dt>

      <dd
        className={`break-words text-sm text-slate-900 ${
          mono
            ? "font-mono text-xs"
            : ""
        }`}
      >
        {displayValue(
          value,
        )}
      </dd>
    </div>
  );
}

interface ConfigCardProps {
  title:
    string;

  description:
    string;

  values:
    UnknownRecord;

  keys:
    string[];
}

function ConfigCard({
  title,
  description,
  values,
  keys,
}: ConfigCardProps) {
  const visibleRows =
    keys
      .map(
        (
          key,
        ) => ({
          key,

          value:
            values[key],
        }),
      )
      .filter(
        (
          row,
        ) =>
          row.value !==
            undefined &&
          row.value !==
            null &&
          row.value !==
            "",
      );

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-slate-950">
        {title}
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>

      {visibleRows.length >
      0 ? (
        <dl className="mt-4">
          {visibleRows.map(
            (
              row,
            ) => (
              <ProvenanceRow
                key={
                  row.key
                }
                label={
                  humanizeKey(
                    row.key,
                  )
                }
                value={
                  row.value
                }
              />
            ),
          )}
        </dl>
      ) : (
        <p className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-500">
          No explicit assumptions were
          recorded in this category.
        </p>
      )}
    </article>
  );
}

export default function SimulationStudyProvenance({
  run,
  reproducibility,
}: SimulationStudyProvenanceProps) {
  const input =
    run.inputSnapshot;

  const scenarioIdentity =
    asRecord(
      input.scenario,
    );

  const siteIdentity =
    asRecord(
      input.site,
    );

  const environmentIdentity =
    asRecord(
      input.environment,
    );

  const scenarioConfiguration =
    asRecord(
      input.scenarioConfiguration,
    );

  const technical =
    asRecord(
      scenarioConfiguration
        .technical,
    );

  const agricultural =
    asRecord(
      scenarioConfiguration
        .agricultural,
    );

  const weather =
    asRecord(
      scenarioConfiguration
        .weather,
    );

  const policy =
    asRecord(
      scenarioConfiguration
        .policy,
    );

  const economic =
    asRecord(
      scenarioConfiguration
        .economic,
    );

  const metadata =
    asRecord(
      scenarioConfiguration
        .metadata,
    );

  const siteConfiguration =
    asRecord(
      input.siteConfiguration,
    );

  const scenarioName =
    firstDefined(
      scenarioIdentity,
      [
        "name",
        "scenarioName",
      ],
    );

  const scenarioVersion =
    firstDefined(
      scenarioIdentity,
      [
        "scenarioVersion",
        "version",
      ],
    );

  const scenarioType =
    firstDefined(
      scenarioIdentity,
      [
        "scenarioType",
        "type",
      ],
    );

  const baseline =
    firstDefined(
      scenarioIdentity,
      [
        "isBaseline",
        "baseline",
      ],
    );

  const parentScenarioId =
    firstDefined(
      scenarioIdentity,
      [
        "parentScenarioId",
      ],
    );

  const siteName =
    firstDefined(
      siteConfiguration,
      [
        "name",
      ],
    );

  const siteType =
    firstDefined(
      siteConfiguration,
      [
        "siteType",
      ],
    );

  const environmentSource =
    firstDefined(
      environmentIdentity,
      [
        "source",
      ],
    );

  const environmentMode =
    firstDefined(
      environmentIdentity,
      [
        "mode",
      ],
    );

  const environmentTimezone =
    firstDefined(
      environmentIdentity,
      [
        "timezone",
      ],
    );

  const environmentDataset =
    firstDefined(
      environmentIdentity,
      [
        "datasetId",
        "providerDataset",
      ],
    );

  const environmentRequestFingerprint =
    firstDefined(
      environmentIdentity,
      [
        "requestFingerprint",
      ],
    );

  const environmentDatasetFingerprint =
    firstDefined(
      environmentIdentity,
      [
        "datasetFingerprint",
      ],
    );

  const environmentStart =
    firstDefined(
      environmentIdentity,
      [
        "startTime",
        "startDate",
      ],
    );

  const environmentEnd =
    firstDefined(
      environmentIdentity,
      [
        "endTime",
        "endDate",
      ],
    );

  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
          Research provenance
        </p>

        <h2 className="mt-1 text-2xl font-semibold text-slate-950">
          Study definition and assumptions
        </h2>

        <p className="mt-2 max-w-4xl text-sm text-slate-600">
          This record describes the exact saved
          scenario, immutable site version,
          environmental input and research
          assumptions associated with this
          persisted simulation result.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
          <h3 className="text-lg font-semibold text-indigo-950">
            Study identity
          </h3>

          <dl className="mt-4">
            <ProvenanceRow
              label="Scenario"
              value={
                scenarioName ??
                run.scenarioId
              }
            />

            <ProvenanceRow
              label="Scenario ID"
              value={
                run.scenarioId
              }
              mono
            />

            <ProvenanceRow
              label="Scenario version"
              value={
                scenarioVersion
              }
            />

            <ProvenanceRow
              label="Scenario type"
              value={
                scenarioType
              }
            />

            <ProvenanceRow
              label="Baseline"
              value={
                baseline
              }
            />

            <ProvenanceRow
              label="Parent scenario"
              value={
                parentScenarioId
              }
              mono
            />

            <ProvenanceRow
              label="Study name"
              value={
                metadata.studyName
              }
            />

            <ProvenanceRow
              label="Researcher"
              value={
                metadata.researcher
              }
            />

            <ProvenanceRow
              label="Objective"
              value={
                metadata.objective
              }
            />

            <ProvenanceRow
              label="Tags"
              value={
                metadata.tags
              }
            />
          </dl>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-slate-950">
            Immutable site context
          </h3>

          <dl className="mt-4">
            <ProvenanceRow
              label="Site"
              value={
                siteName ??
                run.siteId
              }
            />

            <ProvenanceRow
              label="Site ID"
              value={
                run.siteId
              }
              mono
            />

            <ProvenanceRow
              label="Site type"
              value={
                siteType
              }
            />

            <ProvenanceRow
              label="Site version"
              value={
                run.siteVersionId
              }
              mono
            />

            <ProvenanceRow
              label="Site schema"
              value={
                run.siteSchemaVersion
              }
            />

            <ProvenanceRow
              label="Simulation date"
              value={
                run.simulationDate
              }
            />

            <ProvenanceRow
              label="Engine"
              value={
                run.engineVersion
              }
            />

            <ProvenanceRow
              label="Controller"
              value={
                run.controllerVersion
              }
            />
          </dl>
        </article>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ConfigCard
          title="Technical assumptions"
          description="PV system, geometry and tracking assumptions captured in the scenario."
          values={
            technical
          }
          keys={[
            "moduleId",
            "modulePowerW",
            "panelHeightM",
            "rowSpacingM",
            "tiltDeg",
            "azimuthDeg",
            "gcr",
            "trackingMode",
            "rows",
            "modulesPerRow",
            "systemEfficiency",
          ]}
        />

        <ConfigCard
          title="Agricultural assumptions"
          description="Crop, DLI and yield-related assumptions used by the policy study."
          values={
            agricultural
          }
          keys={[
            "cropName",
            "cropId",
            "season",
            "targetDliMolM2Day",
            "minimumDliMolM2Day",
            "minimumCropRetention",
            "yieldModel",
          ]}
        />

        <ConfigCard
          title="Policy constraints"
          description="Thresholds and policy-test-bench constraints recorded for this scenario."
          values={
            policy
          }
          keys={[
            "policyPreset",
            "minimumCropRetention",
            "maximumGcr",
            "minimumLer",
            "minimumPanelHeightM",
            "maximumDliReduction",
            "minimumRenewableEnergyKwh",
          ]}
        />

        <ConfigCard
          title="Economic assumptions"
          description="Economic parameters retained for later financial and MCDA evaluation."
          values={
            economic
          }
          keys={[
            "currency",
            "capex",
            "annualOpex",
            "electricityTariffPerKwh",
            "cropPrice",
            "discountRate",
            "projectLifetimeYears",
          ]}
        />
      </div>

      <article className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
        <h3 className="text-lg font-semibold text-cyan-950">
          Environmental provenance
        </h3>

        <p className="mt-1 text-sm text-cyan-900/70">
          Exact environmental identity associated
          with the persisted execution package.
        </p>

        <div className="mt-4 grid gap-x-8 lg:grid-cols-2">
          <dl>
            <ProvenanceRow
              label="Source"
              value={
                environmentSource ??
                weather.source
              }
            />

            <ProvenanceRow
              label="Mode"
              value={
                environmentMode ??
                weather.mode
              }
            />

            <ProvenanceRow
              label="Dataset"
              value={
                environmentDataset ??
                weather.datasetId
              }
            />

            <ProvenanceRow
              label="Timezone"
              value={
                environmentTimezone ??
                weather.timezone
              }
            />

            <ProvenanceRow
              label="Start"
              value={
                environmentStart ??
                weather.startDate
              }
            />

            <ProvenanceRow
              label="End"
              value={
                environmentEnd ??
                weather.endDate
              }
            />
          </dl>

          <dl>
            <ProvenanceRow
              label="Weather adapter"
              value={
                run.weatherAdapterVersion
              }
            />

            <ProvenanceRow
              label="Request fingerprint"
              value={
                environmentRequestFingerprint
              }
              mono
            />

            <ProvenanceRow
              label="Dataset fingerprint"
              value={
                environmentDatasetFingerprint
              }
              mono
            />

            <ProvenanceRow
              label="Execution fingerprint"
              value={
                reproducibility
                  .inputFingerprint
              }
              mono
            />

            <ProvenanceRow
              label="Reproducibility"
              value={
                reproducibility.verified
                  ? "Verified"
                  : "Not verified"
              }
            />
          </dl>
        </div>
      </article>

      {metadata.notes ? (
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-950">
            Research notes
          </h3>

          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
            {displayValue(
              metadata.notes,
            )}
          </p>
        </article>
      ) : null}

      {Object.keys(
        siteIdentity,
      ).length >
      0 ? (
        <details className="rounded-2xl border border-slate-200 bg-white">
          <summary className="cursor-pointer px-5 py-4 font-medium text-slate-800">
            Advanced execution identity
          </summary>

          <div className="border-t border-slate-100 p-5">
            <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
              {JSON.stringify(
                {
                  scenario:
                    scenarioIdentity,

                  site:
                    siteIdentity,

                  environment:
                    environmentIdentity,
                },
                null,
                2,
              )}
            </pre>
          </div>
        </details>
      ) : null}
    </section>
  );
}
