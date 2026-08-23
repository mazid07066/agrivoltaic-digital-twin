"use client";

import {
  assessPVInverterCompatibility,
} from "@/lib/electrical/compatibility";

import {
  recommendPVStringDesign,
} from "@/lib/electrical/stringDesign";

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
  stringsPerInverter?: number | null;
  stringsPerMppt: number | null;
  minimumDesignTemperatureC: number | null;
  maximumDesignCellTemperatureC?: number | null;
  bifacialCurrentFactor?: number | null;
  inverterCount?: number | null;
  onChange: (
    values: Partial<
      Pick<
        PVConfiguration,
        | "modulesPerString"
        | "stringsPerInverter"
        | "stringsPerMppt"
        | "minimumDesignTemperatureC"
        | "maximumDesignCellTemperatureC"
        | "bifacialCurrentFactor"
        | "inverterCount"
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
  stringsPerInverter = null,
  stringsPerMppt,
  minimumDesignTemperatureC,
  maximumDesignCellTemperatureC = null,
  bifacialCurrentFactor = null,
  inverterCount = 1,
  onChange,
}: PVInverterCompatibilityPanelProps) {
  const derivedStringsPerMppt =
    stringsPerInverter !== null &&
    Number.isInteger(stringsPerInverter) &&
    stringsPerInverter > 0
      ? Math.ceil(
          stringsPerInverter /
          inverter.dc.independentMpptInputs,
        )
      : stringsPerMppt;

  const mpptAllocation =
    stringsPerInverter !== null &&
    Number.isInteger(stringsPerInverter) &&
    stringsPerInverter > 0
      ? Array.from(
          {
            length:
              inverter.dc.independentMpptInputs,
          },
          (_, index) => {
            const base =
              Math.floor(
                stringsPerInverter /
                inverter.dc.independentMpptInputs,
              );

            const remainder =
              stringsPerInverter %
              inverter.dc.independentMpptInputs;

            return base +
              (index < remainder ? 1 : 0);
          },
        )
      : null;

  const report =
    assessPVInverterCompatibility({
      module,
      inverter,
      moduleCount,
      modulesPerString,
      stringsPerMppt:
        derivedStringsPerMppt,
      minimumDesignTemperatureC,
      maximumDesignCellTemperatureC,
      bifacialCurrentFactor,
      inverterCount,
    });

  const recommendation =
    moduleCount !== null
      ? recommendPVStringDesign({
          module,
          inverter,
          moduleCount,
          minimumDesignTemperatureC,
          maximumDesignCellTemperatureC,
          bifacialCurrentFactor,
        })
      : null;

  const recommendedDesign =
    recommendation?.selected ??
    null;

  return (
    <section className="pv-inverter-compatibility-panel rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-slate-900">
            PV / inverter compatibility
          </h4>

          <p className="mt-1 text-xs text-slate-500">
            Enter a chosen string design directly, or apply
            the calculated recommendation below. Manual
            values are applied live when the topology is
            physically representable.
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

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="space-y-1 text-xs text-slate-700">
          <span className="font-medium">
            Inverter units
          </span>

          <input
            type="number"
            min={1}
            step={1}
            value={inverterCount ?? ""}
            placeholder="1"
            onChange={(event) =>
              onChange({
                inverterCount:
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
            Total strings per inverter
          </span>

          <input
            type="number"
            min={1}
            step={1}
            value={stringsPerInverter ?? ""}
            placeholder="Not specified"
            onChange={(event) => {
              const total =
                optionalNumber(
                  event.target.value,
                );

              onChange({
                stringsPerInverter:
                  total,

                stringsPerMppt:
                  total === null
                    ? null
                    : Math.ceil(
                        total /
                        inverter.dc
                          .independentMpptInputs,
                      ),
              });
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-xs text-slate-700">
          <span className="font-medium">
            Maximum strings on one MPPT
          </span>

          <input
            type="number"
            min={1}
            step={1}
            value={derivedStringsPerMppt ?? ""}
            placeholder="Not specified"
            readOnly
            aria-readonly="true"
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
        <label className="space-y-1 text-xs text-slate-700">
          <span className="font-medium">
            Maximum cell temperature
          </span>

          <div className="flex rounded-lg border border-slate-300">
            <input
              type="number"
              step={1}
              value={maximumDesignCellTemperatureC ?? ""}
              placeholder="Not supplied"
              onChange={(event) =>
                onChange({
                  maximumDesignCellTemperatureC:
                    optionalNumber(event.target.value),
                })
              }
              className="min-w-0 flex-1 rounded-lg px-3 py-2"
            />

            <span className="flex items-center border-l border-slate-200 px-2">
              °C
            </span>
          </div>
        </label>

        <label className="space-y-1 text-xs text-slate-700">
          <span className="font-medium">
            Bifacial current factor
          </span>

          <input
            type="number"
            min={1}
            step={0.01}
            value={bifacialCurrentFactor ?? ""}
            placeholder="1.00"
            onChange={(event) =>
              onChange({
                bifacialCurrentFactor:
                  optionalNumber(event.target.value),
              })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
      </div>

      {mpptAllocation ? (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">
          <strong>
            Generated MPPT allocation:
          </strong>{" "}
          [{mpptAllocation.join(", ")}]
        </div>
      ) : null}

      <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-900">
        <strong>Chosen-design mode:</strong>{" "}
        minimum and maximum design temperatures are advisory
        engineering checks. The hourly module temperature is
        still used to calculate operating string voltage.
        Connector, MPPT-current and inverter-capacity limits
        remain operational checks.
      </div>

      <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <strong className="text-sm text-teal-950">
              Recommended alternative
            </strong>

            {recommendedDesign ? (
              <p className="mt-1 text-xs leading-5 text-teal-800">
                {recommendedDesign.modulesPerString} modules/string
                {" • "}
                {recommendedDesign.totalStrings} strings
                {" • "}
                {recommendedDesign.inverterCount} inverter
                {recommendedDesign.inverterCount === 1
                  ? ""
                  : "s"}
                {" • "}
                ILR{" "}
                {recommendedDesign.inverterLoadingRatio.toFixed(
                  2,
                )}
              </p>
            ) : (
              <p className="mt-1 text-xs leading-5 text-amber-800">
                {recommendation?.reasons[0] ??
                  "Complete the environmental and module electrical inputs."}
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={!recommendedDesign}
            onClick={() => {
              if (!recommendedDesign) {
                return;
              }

              onChange({
                modulesPerString:
                  recommendedDesign.modulesPerString,
                stringsPerInverter:
                  Math.ceil(
                    recommendedDesign.totalStrings /
                    recommendedDesign.inverterCount,
                  ),
                stringsPerMppt:
                  recommendedDesign.stringsPerMppt,
                inverterCount:
                  recommendedDesign.inverterCount,
              });
            }}
            className="shrink-0 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Apply recommendation
          </button>
        </div>

        {recommendedDesign ? (
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="text-teal-700">
                Cold Voc
              </dt>
              <dd className="font-semibold text-teal-950">
                {recommendedDesign.stringVocColdV.toFixed(
                  1,
                )} V
              </dd>
            </div>

            <div>
              <dt className="text-teal-700">
                Hot Vmpp
              </dt>
              <dd className="font-semibold text-teal-950">
                {recommendedDesign.stringVmppHotV.toFixed(
                  1,
                )} V
              </dd>
            </div>

            <div>
              <dt className="text-teal-700">
                Modules assigned
              </dt>
              <dd className="font-semibold text-teal-950">
                {recommendedDesign.assignedModules}
              </dd>
            </div>

            <div>
              <dt className="text-teal-700">
                Modules unassigned
              </dt>
              <dd className="font-semibold text-teal-950">
                {recommendedDesign.unassignedModules}
              </dd>
            </div>
          </dl>
        ) : null}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-slate-50 p-2">
          <dt className="text-slate-500">
            Inverter units
          </dt>
          <dd className="font-semibold text-slate-900">
            {report.calculations.inverterCount ?? "—"}
          </dd>
        </div>

        <div className="rounded-lg bg-slate-50 p-2">
          <dt className="text-slate-500">
            Total rated AC
          </dt>
          <dd className="font-semibold text-slate-900">
            {report.calculations.totalAcCapacityW ===
            null
              ? "—"
              : `${(
                  report.calculations
                    .totalAcCapacityW / 1000
                ).toFixed(1)} kW`}
          </dd>
        </div>
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
            Configured strings
            <span className="block text-[10px] font-normal">
              Capacity{" "}
              {inverter.dc.independentMpptInputs *
                inverter.dc.stringsPerMppt}
            </span>
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
