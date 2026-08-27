"use client";

import {
  createDefaultPhysicsModelConfiguration,
  resolvePhysicsConfiguration,
} from "@/lib/physics/defaults";
import type {
  ExplicitLossConfiguration,
  PhysicsModelConfiguration,
} from "@/lib/physics/types";
import type { PVConfiguration } from "@/types/simulation";

interface Props {
  pv: PVConfiguration;
  onUpdatePV: (values: Partial<PVConfiguration>) => void;
  compact?: boolean;
}

const lossLabels: Array<{
  key: keyof ExplicitLossConfiguration;
  label: string;
}> = [
  { key: "soiling", label: "Soiling" },
  { key: "moduleQuality", label: "Module quality" },
  { key: "moduleMismatch", label: "Module mismatch" },
  { key: "stringMismatch", label: "String mismatch" },
  { key: "dcOhmic", label: "DC ohmic" },
  { key: "acOhmic", label: "AC ohmic" },
  { key: "transformer", label: "Transformer" },
  { key: "auxiliary", label: "Auxiliary" },
  { key: "availability", label: "Availability loss" },
  { key: "degradationAnnual", label: "Annual degradation" },
  { key: "curtailment", label: "Curtailment" },
];

export default function PhysicsConfigurationPanel({
  pv,
  onUpdatePV,
  compact = false,
}: Props) {
  const configuration = resolvePhysicsConfiguration(pv.physicsConfiguration);
  const referenceLocked = configuration.mode === "reference_validation";

  const update = (values: Partial<PhysicsModelConfiguration>) => {
    onUpdatePV({
      physicsConfiguration: {
        ...configuration,
        ...values,
      },
    });
  };

  const selectClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";

  return (
    <section className={compact ? "space-y-3" : "rounded-xl border border-indigo-200 bg-indigo-50/40 p-4"}>
      <div>
        <h3 className="font-semibold text-slate-950">
          Physics, efficiency and loss model
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          Physics mode uses explicit optical, DC, inverter and AC stages.
          Aggregate system efficiency remains available only for legacy parity.
        </p>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1 text-xs text-slate-700">
          <span className="font-medium">Simulation mode</span>
          <select
            value={configuration.mode}
            onChange={(event) => {
              const mode = event.target.value as PhysicsModelConfiguration["mode"];
              const defaults = createDefaultPhysicsModelConfiguration(mode);
              onUpdatePV({
                physicsConfiguration: {
                  ...defaults,
                  losses:
                    mode === "reference_validation"
                      ? defaults.losses
                      : configuration.losses,
                },
              });
            }}
            className={selectClass}
          >
            <option value="legacy_parity">Legacy Web parity</option>
            <option value="physics_research">Physics / research</option>
            <option value="reference_validation">Reference validation</option>
          </select>
        </label>

        <label className="space-y-1 text-xs text-slate-700">
          <span className="font-medium">Irradiance</span>
          <select
            value={configuration.irradianceModel}
            onChange={(event) =>
              update({
                irradianceModel:
                  event.target.value as PhysicsModelConfiguration["irradianceModel"],
              })
            }
            className={selectClass}
            disabled={referenceLocked}
          >
            <option value="isotropic">Isotropic</option>
            <option value="perez">Perez anisotropic</option>
          </select>
        </label>

        <label className="space-y-1 text-xs text-slate-700">
          <span className="font-medium">Thermal model</span>
          <select
            value={configuration.thermalModel}
            onChange={(event) =>
              update({
                thermalModel:
                  event.target.value as PhysicsModelConfiguration["thermalModel"],
              })
            }
            className={selectClass}
            disabled={referenceLocked}
          >
            <option value="simple_noct">Simple NOCT</option>
            <option value="faiman">Faiman</option>
            <option value="pvsyst">PVsyst</option>
          </select>
        </label>

        <label className="space-y-1 text-xs text-slate-700">
          <span className="font-medium">Module electrical model</span>
          <select
            value={configuration.moduleElectricalModel}
            onChange={(event) =>
              update({
                moduleElectricalModel:
                  event.target.value as PhysicsModelConfiguration["moduleElectricalModel"],
              })
            }
            className={selectClass}
            disabled={referenceLocked}
          >
            <option value="simple_power">Simple power</option>
            <option value="single_diode">Single diode</option>
          </select>
        </label>

        <label className="space-y-1 text-xs text-slate-700">
          <span className="font-medium">IAM</span>
          <select
            value={configuration.iamModel}
            onChange={(event) =>
              update({
                iamModel: event.target.value as PhysicsModelConfiguration["iamModel"],
              })
            }
            className={selectClass}
            disabled={referenceLocked}
          >
            <option value="none">None</option>
            <option value="martin_ruiz">Martin–Ruiz</option>
          </select>
        </label>

        <label className="space-y-1 text-xs text-slate-700">
          <span className="font-medium">Tracker reference</span>
          <select
            value={configuration.trackingModel}
            onChange={(event) =>
              update({
                trackingModel:
                  event.target.value as PhysicsModelConfiguration["trackingModel"],
              })
            }
            className={selectClass}
            disabled={referenceLocked}
          >
            <option value="fixed_tilt">Fixed tilt</option>
            <option value="true_tracking">True tracking</option>
            <option value="standard_backtracking">Standard backtracking</option>
            <option value="adaptive_custom">Adaptive custom</option>
            <option value="measured_scada">Measured/SCADA</option>
          </select>
        </label>

        <label className="space-y-1 text-xs text-slate-700">
          <span className="font-medium">Minimum design cell temperature</span>
          <input
            type="number"
            value={configuration.minimumDesignCellTemperatureC}
            step={0.5}
            onChange={(event) =>
              onUpdatePV({
                minimumDesignTemperatureC: Number(event.target.value),
                physicsConfiguration: {
                  ...configuration,
                  minimumDesignCellTemperatureC: Number(event.target.value),
                },
              })
            }
            className={selectClass}
            disabled={referenceLocked}
          />
        </label>

        <label className="flex items-end gap-2 pb-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={configuration.backtrackingEnabled}
            disabled={referenceLocked}
            onChange={(event) => update({ backtrackingEnabled: event.target.checked })}
          />
          <span className="font-medium">Backtracking enabled</span>
        </label>
      </div>

      {configuration.mode !== "legacy_parity" ? (
        <details className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-900">
            Explicit loss assumptions
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {lossLabels.map(({ key, label }) => {
              if (key === "schemaVersion") return null;
              const parameter = configuration.losses[key];
              if (typeof parameter === "string") return null;
              return (
                <label key={key} className="space-y-1 text-xs text-slate-700">
                  <span className="flex items-center justify-between gap-2 font-medium">
                    {label}
                    <input
                      type="checkbox"
                      checked={parameter.enabled}
                      disabled={referenceLocked}
                      onChange={(event) =>
                        update({
                          losses: {
                            ...configuration.losses,
                            [key]: { ...parameter, enabled: event.target.checked },
                          },
                        })
                      }
                    />
                  </span>
                  <input
                    type="number"
                    value={parameter.value}
                    step={0.1}
                    disabled={!parameter.enabled || referenceLocked}
                    onChange={(event) =>
                      update({
                        losses: {
                          ...configuration.losses,
                          [key]: { ...parameter, value: Number(event.target.value) },
                        },
                      })
                    }
                    className={selectClass}
                  />
                  <span className="text-[10px] uppercase text-slate-500">
                    {parameter.unit} · {parameter.sourceCategory.replaceAll("_", " ")}
                  </span>
                </label>
              );
            })}
          </div>
        </details>
      ) : null}

      <div className="mt-3 rounded-lg bg-white p-3 text-xs text-slate-700">
        <strong>Active boundary:</strong>{" "}
        {configuration.mode === "legacy_parity"
          ? `aggregate systemEfficiency ${(pv.systemEfficiency * 100).toFixed(1)}%; downstream inverter passthrough`
          : "explicit losses → dynamic MPPT → fitted inverter curve → AC losses; aggregate systemEfficiency disabled"}
      </div>
      {referenceLocked ? (
        <p className="mt-2 text-xs font-medium text-indigo-800">
          Reference-validation equations and loss defaults are locked in this mode;
          change to Physics / research to edit assumptions.
        </p>
      ) : null}
    </section>
  );
}
