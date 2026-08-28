"use client";

import {
  useMemo,
  useState,
} from "react";

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

import {
  createBalancedMpptAllocation,
  parseMpptAllocation,
  validateMpptAllocation,
} from "@/lib/electrical/mpptAllocation";

interface PVInverterCompatibilityPanelProps {
  module: PVModuleProfile;
  inverter: InverterCatalogueProfile;
  moduleCount: number | null;
  modulesPerString: number | null;
  stringsPerInverter?: number | null;
  stringsPerMppt: number | null;
  mpptStringAllocation?: number[] | null;
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
        | "mpptStringAllocation"
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
  mpptStringAllocation = null,
  minimumDesignTemperatureC,
  maximumDesignCellTemperatureC = null,
  bifacialCurrentFactor = null,
  inverterCount = 1,
  onChange,
}: PVInverterCompatibilityPanelProps) {
  const generatedMpptAllocation =
    stringsPerInverter !== null &&
    Number.isInteger(stringsPerInverter) &&
    stringsPerInverter > 0
      ? createBalancedMpptAllocation(
          stringsPerInverter,
          inverter.dc.independentMpptInputs,
        )
      : null;

  const effectiveMpptAllocation =
    mpptStringAllocation ??
    generatedMpptAllocation;

  const derivedStringsPerMppt =
    effectiveMpptAllocation &&
    effectiveMpptAllocation.length > 0
      ? Math.max(...effectiveMpptAllocation)
      : stringsPerMppt;

  const [allocationDraftOverride, setAllocationDraftOverride] =
    useState<string | null>(null);

  const allocationDraft =
    allocationDraftOverride ??
    effectiveMpptAllocation?.join(", ") ??
    "";

  const allocationValidation = useMemo(() => {
    if (
      stringsPerInverter === null ||
      !Number.isInteger(stringsPerInverter) ||
      stringsPerInverter <= 0
    ) {
      return {
        valid: false,
        allocation: [] as number[],
        errors: [
          "Enter total strings per inverter before editing the MPPT allocation.",
        ],
      };
    }

    const parsed = parseMpptAllocation(
      allocationDraft,
    );

    if (!parsed) {
      return {
        valid: false,
        allocation: [] as number[],
        errors: [
          "Enter comma-separated whole numbers, for example 1,1,1,1,1,2.",
        ],
      };
    }

    return validateMpptAllocation(parsed, {
      mpptCount:
        inverter.dc.independentMpptInputs,
      totalStrings:
        stringsPerInverter,
      maximumStringsPerMppt:
        inverter.dc.stringsPerMppt,
    });
  }, [
    allocationDraft,
    inverter.dc.independentMpptInputs,
    inverter.dc.stringsPerMppt,
    stringsPerInverter,
  ]);

  const report =
    assessPVInverterCompatibility({
      module,
      inverter,
      moduleCount,
      modulesPerString,
      stringsPerInverter,
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
              setAllocationDraftOverride(null);

              const total =
                optionalNumber(
                  event.target.value,
                );

              onChange({
                stringsPerInverter:
                  total,

                mpptStringAllocation:
                  null,

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

      <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">
        <label className="block font-semibold" htmlFor="mppt-string-allocation">
          MPPT string allocation
        </label>

        <p className="mt-1 text-emerald-800">
          Enter one value per MPPT. Zero keeps an MPPT inactive.
          The values must sum to the total strings per inverter.
        </p>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="mppt-string-allocation"
            type="text"
            value={allocationDraft}
            placeholder={
              createBalancedMpptAllocation(
                stringsPerInverter ?? 0,
                inverter.dc.independentMpptInputs,
              ).join(",")
            }
            onChange={(event) =>
              setAllocationDraftOverride(
                event.target.value,
              )
            }
            className="min-w-0 flex-1 rounded-lg border border-emerald-300 bg-white px-3 py-2 font-mono"
          />

          <button
            type="button"
            disabled={!allocationValidation.valid}
            onClick={() => {
              setAllocationDraftOverride(null);

              onChange({
                mpptStringAllocation:
                  allocationValidation.allocation,
                stringsPerMppt:
                  Math.max(
                    ...allocationValidation.allocation,
                  ),
              });
            }}
            className="rounded-lg bg-emerald-700 px-3 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Apply allocation
          </button>

          <button
            type="button"
            onClick={() => {
              const balanced =
                createBalancedMpptAllocation(
                  stringsPerInverter ?? 0,
                  inverter.dc.independentMpptInputs,
                );

              setAllocationDraftOverride(null);

              onChange({
                mpptStringAllocation: null,
                stringsPerMppt:
                  balanced.length > 0
                    ? Math.max(...balanced)
                    : null,
              });
            }}
            className="rounded-lg border border-emerald-300 bg-white px-3 py-2 font-semibold text-emerald-800"
          >
            Use balanced
          </button>
        </div>

        {!allocationValidation.valid ? (
          <ul className="mt-2 list-disc pl-5 text-amber-800">
            {allocationValidation.errors.map(
              (error) => (
                <li key={error}>{error}</li>
              ),
            )}
          </ul>
        ) : (
          <p className="mt-2 font-medium text-emerald-800">
            Valid allocation: [{allocationValidation.allocation.join(", ")}]
          </p>
        )}
      </div>

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
                mpptStringAllocation:
                  null,
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
            Installed array STC
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
              Plant capacity{" "}
              {(report.calculations.inverterCount ?? 1) *
                inverter.dc.independentMpptInputs *
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
            Installed modules
          </dt>
          <dd className="font-semibold text-slate-900">
            {moduleCount ?? "—"}
          </dd>
        </div>

        <div className="rounded-lg bg-slate-50 p-2">
          <dt className="text-slate-500">
            Required modules
          </dt>
          <dd className="font-semibold text-slate-900">
            {report.calculations.requiredModuleCount ??
              "—"}
          </dd>
        </div>

        <div className="rounded-lg bg-slate-50 p-2">
          <dt className="text-slate-500">
            Configured design STC
          </dt>
          <dd className="font-semibold text-slate-900">
            {report.calculations.configuredArrayPowerW ===
            null
              ? "—"
              : `${(
                  report.calculations
                    .configuredArrayPowerW / 1000
                ).toFixed(2)} kWp`}
          </dd>
        </div>

        <div className="rounded-lg bg-slate-50 p-2">
          <dt className="text-slate-500">
            Module balance
          </dt>
          <dd
            className={`font-semibold ${
              (report.calculations.moduleShortfall ??
                0) > 0
                ? "text-red-700"
                : (report.calculations.moduleSurplus ??
                      0) > 0
                  ? "text-amber-700"
                  : "text-emerald-700"
            }`}
          >
            {(report.calculations.moduleShortfall ??
              0) > 0
              ? `Short ${report.calculations.moduleShortfall}`
              : (report.calculations.moduleSurplus ??
                    0) > 0
                ? `Extra ${report.calculations.moduleSurplus}`
                : report.calculations
                      .requiredModuleCount === null
                  ? "—"
                  : "Exact"}
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
