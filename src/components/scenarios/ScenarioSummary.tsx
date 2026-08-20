import type { Scenario } from "@/lib/scenarios/types";

interface ScenarioSummaryProps {
  scenarios: Scenario[];
}

export default function ScenarioSummary({
  scenarios,
}: ScenarioSummaryProps) {
  const activeScenarios =
    scenarios.filter(
      (scenario) =>
        scenario.status !== "archived",
    );

  const baselines =
    scenarios.filter(
      (scenario) =>
        scenario.isBaseline,
    );

  const ready =
    scenarios.filter(
      (scenario) =>
        scenario.status === "ready" ||
        scenario.status === "active",
    );

  const drafts =
    scenarios.filter(
      (scenario) =>
        scenario.status === "draft",
    );

  const cards = [
    {
      label: "Total scenarios",
      value: scenarios.length,
      description:
        "Saved experimental definitions",
    },
    {
      label: "Active study set",
      value: activeScenarios.length,
      description:
        "Non-archived scenarios",
    },
    {
      label: "Baselines",
      value: baselines.length,
      description:
        "Reference comparison cases",
    },
    {
      label: "Ready",
      value: ready.length,
      description:
        `${drafts.length} draft scenario${drafts.length === 1 ? "" : "s"}`,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {card.label}
          </p>

          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {card.value}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {card.description}
          </p>
        </div>
      ))}
    </div>
  );
}
