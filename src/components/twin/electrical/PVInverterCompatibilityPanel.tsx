"use client";

import {
  assessPVInverterCompatibility,
} from "@/lib/electrical/compatibility";

import type {
  InverterCatalogueProfile,
} from "@/lib/electrical/inverter/catalogue";

import type {
  PVModuleProfile,
} from "@/lib/pv/moduleProfiles";

import type {
  PVConfiguration,
} from "@/types/simulation";

interface PVInverterCompatibilityPanelProps {
  module: PVModuleProfile;
  inverter: InverterCatalogueProfile;
  moduleCount: number | null;
  modulesPerString: number | null;
  stringsPerMppt: number | null;
  minimumDesignTemperatureC: number | null;
  onChange: (
    values: Partial<
      Pick<
        PVConfiguration,
        | "modulesPerString"
        | "stringsPerMppt"
        | "minimumDesignTemperatureC"
      >
    >,
  ) => void;
}

function optionalNumber(
  value: string,
): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function statusClass(
  status: string,
): string {
  switch (status) {
    case "PASS":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";

    case "FAIL":
      return "border-red-200 bg-red-50 text-red-800";

    case "WARNING":
      return "border-amber-200 bg-amber-50 text-amber-800";

    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default function PVInverterCompatibilityPanel({
  module,
  inverter,
  moduleCount,
  modulesPerString,
  stringsPerMppt,
  minimumDesignTemperatureC,
  onChange,
}: PVInverterCompatibilityPanelProps) {
  const report =
    assessPVInverterCompatibility({
      module,
      inverter,
      moduleCount,
      modulesPerString,
      stringsPerMppt,
      minimumDesignTemperatureC,
    });

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-slate-900">
            PV / inverter compatibility
          </h4>

          <p className="mt-1 text-xs text-slate-500">
            Electrical string design is independent of
            physical modules per row.
          </p>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(
            report.status,
          )}`}
        >
          {report.status}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="space-y-1 text-xs text-slate-700">
          <span className="font-medium">
            Modules per string
          </span>

          <input
            type="number"
            min={1}
            step={1}
            value={modulesPerString ?? ""}
            placeholder="Not specified"
            onChange={(event) =>
              onChange({
                modulesPerString:
                  optionalNumber(
                    event.target.value,
                  ),
              })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-xs text-slate-700">
          <span className="font-medium">
            Strings per MPPT
          </span>

          <input
            type="number"
            min={1}
            step={1}
            value={stringsPerMppt ?? ""}
            placeholder="Not specified"
            onChange={(event) =>
              onChange({
                stringsPerMppt:
                  optionalNumber(
                    event.target.value,
                  ),
              })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-xs text-slate-700">
          <span className="font-medium">
            Minimum design temperature
          </span>

          <div className="flex rounded-lg border border-slate-300">
            <input
              type="number"
              step={1}
              value={
                minimumDesignTemperatureC ??
                ""
              }
              placeholder="Not supplied"
              onChange={(event) =>
                onChange({
                  minimumDesignTemperatureC:
                    optionalNumber(
                      event.target.value,
                    ),
                })
              }
              className="min-w-0 flex-1 rounded-lg px-3 py-2"
            />

            <span className="flex items-center border-l border-slate-200 px-2">
              °C
            </span>
          </div>
        </label>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="rounded-lg bg-slate-50 p-2">
          <dt className="text-slate-500">
            Array STC
          </dt>
          <dd className="font-semibold text-slate-900">
            {report.calculations.totalArrayPowerW ===
            null
              ? "—"
              : `${(
                  report.calculations
                    .totalArrayPowerW / 1000
                ).toFixed(2)} kWp`}
          </dd>
        </div>

        <div className="rounded-lg bg-slate-50 p-2">
          <dt className="text-slate-500">
            Total strings
          </dt>
          <dd className="font-semibold text-slate-900">
            {report.calculations.totalStringCount ??
              "—"}
          </dd>
        </div>

        <div className="rounded-lg bg-slate-50 p-2">
          <dt className="text-slate-500">
            String Vmpp
          </dt>
          <dd className="font-semibold text-slate-900">
            {report.calculations.stringVmppV ===
            null
              ? "—"
              : `${report.calculations.stringVmppV.toFixed(
                  1,
                )} V`}
          </dd>
        </div>

        <div className="rounded-lg bg-slate-50 p-2">
          <dt className="text-slate-500">
            Cold-condition Voc
          </dt>
          <dd className="font-semibold text-slate-900">
            {report.calculations.stringVocColdV ===
            null
              ? "NOT_EVALUATED"
              : `${report.calculations.stringVocColdV.toFixed(
                  1,
                )} V`}
          </dd>
        </div>
      </dl>

      <details className="mt-4">
        <summary className="cursor-pointer text-xs font-semibold text-slate-700">
          View engineering checks
        </summary>

        <ul className="mt-3 space-y-2">
          {report.checks.map((check) => (
            <li
              key={check.id}
              className={`rounded-lg border p-2 text-xs ${statusClass(
                check.status,
              )}`}
            >
              <div className="flex justify-between gap-3">
                <strong>{check.label}</strong>
                <span>{check.status}</span>
              </div>

              <p className="mt-1">
                {check.message}
              </p>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
