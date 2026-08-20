import type { Scenario } from "@/lib/scenarios/types";

interface ScenarioCardProps {
  scenario: Scenario;
}

function formatScenarioType(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatPercentage(
  value: number | null | undefined,
): string {
  if (value === null || value === undefined) {
    return "Not set";
  }

  return `${(value * 100).toFixed(0)}%`;
}

export default function ScenarioCard({
  scenario,
}: ScenarioCardProps) {
  const technical =
    scenario.technicalConfig;

  const agriculture =
    scenario.agriculturalConfig;

  const weather =
    scenario.weatherConfig;

  const policy =
    scenario.policyConfig;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              {formatScenarioType(
                scenario.scenarioType,
              )}
            </span>

            {scenario.isBaseline ? (
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                Baseline
              </span>
            ) : null}

            <span
              className={[
                "rounded-full px-2.5 py-1 text-xs font-medium",
                scenario.status === "archived"
                  ? "bg-slate-100 text-slate-600"
                  : scenario.status === "ready"
                    ? "bg-emerald-50 text-emerald-700"
                    : scenario.status === "draft"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-sky-50 text-sky-700",
              ].join(" ")}
            >
              {scenario.status}
            </span>
          </div>

          <h3 className="mt-3 text-lg font-semibold text-slate-900">
            {scenario.name}
          </h3>

          {scenario.description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {scenario.description}
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-400">
              No description provided.
            </p>
          )}
        </div>

        <div className="rounded-xl bg-slate-50 px-3 py-2 text-right">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Version
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            v{scenario.scenarioVersion}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Technical
          </div>

          <div className="mt-2 space-y-1 text-sm text-slate-700">
            <p>
              Height:{" "}
              {technical.panelHeightM ??
                "Not set"}{" "}
              {technical.panelHeightM != null
                ? "m"
                : ""}
            </p>

            <p>
              Spacing:{" "}
              {technical.rowSpacingM ??
                "Not set"}{" "}
              {technical.rowSpacingM != null
                ? "m"
                : ""}
            </p>

            <p>
              GCR:{" "}
              {formatPercentage(
                technical.gcr,
              )}
            </p>

            <p>
              Tracking:{" "}
              {technical.trackingMode ??
                "Not set"}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Agriculture
          </div>

          <div className="mt-2 space-y-1 text-sm text-slate-700">
            <p>
              Crop:{" "}
              {agriculture.cropName ??
                agriculture.cropId ??
                "Not set"}
            </p>

            <p>
              Season:{" "}
              {agriculture.season ??
                "Not set"}
            </p>

            <p>
              Crop retention:{" "}
              {formatPercentage(
                agriculture.minimumCropRetention,
              )}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Weather
          </div>

          <div className="mt-2 space-y-1 text-sm text-slate-700">
            <p>
              Source:{" "}
              {weather.source ??
                "Not set"}
            </p>

            <p>
              Mode:{" "}
              {weather.mode ??
                "Not set"}
            </p>

            <p>
              Year:{" "}
              {weather.year ??
                "Not set"}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Policy
          </div>

          <div className="mt-2 space-y-1 text-sm text-slate-700">
            <p>
              Min. crop:{" "}
              {formatPercentage(
                policy.minimumCropRetention,
              )}
            </p>

            <p>
              Max. GCR:{" "}
              {formatPercentage(
                policy.maximumGcr,
              )}
            </p>

            <p>
              Min. LER:{" "}
              {policy.minimumLer ??
                "Not set"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-500">
          Updated {formatDate(scenario.updatedAt)}
        </p>

        <p className="text-xs font-medium text-slate-500">
          ID: {scenario.id.slice(0, 8)}…
        </p>
      </div>
    </article>
  );
}
