"use client";

import type {
  DemonstrationElectricalTimestep,
} from "@/lib/electrical/demonstration";

import type {
  InverterCatalogueProfile,
} from "@/lib/electrical/inverter/catalogue";

import {
  calculateLandModelTransparency,
} from "@/lib/modelTransparency/land";

import type {
  PVModuleProfile,
} from "@/lib/pv/moduleProfiles";

import type {
  LandAgrivoltaicSiteProfile,
} from "@/lib/sites/schema";

import type {
  PVConfiguration,
  SimulationResults,
  SiteConfiguration,
} from "@/types/simulation";

interface Props {
  site: LandAgrivoltaicSiteProfile;
  results: SimulationResults;
  selectedHour: number;
  module: PVModuleProfile;
  inverter: InverterCatalogueProfile;
  electrical: DemonstrationElectricalTimestep;
  onUpdatePV: (
    values: Partial<PVConfiguration>,
  ) => void;
  onUpdateSite: (
    values: Partial<SiteConfiguration>,
  ) => void;
}

interface NumberInputProps {
  label: string;
  value: number | null | undefined;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  optional?: boolean;
  onChange: (
    value: number | null,
  ) => void;
}

function NumberInput({
  label,
  value,
  unit,
  min,
  max,
  step = 1,
  optional = false,
  onChange,
}: NumberInputProps) {
  return (
    <label className="space-y-1 text-xs text-slate-700">
      <span className="font-medium">
        {label}
      </span>

      <div className="flex rounded-lg border border-slate-300 bg-white">
        <input
          type="number"
          value={value ?? ""}
          min={min}
          max={max}
          step={step}
          placeholder={
            optional
              ? "Not supplied"
              : undefined
          }
          onChange={(event) => {
            const text =
              event.target.value;

            if (
              !text.trim()
            ) {
              if (optional) {
                onChange(null);
              }

              return;
            }

            const parsed =
              Number(text);

            if (
              Number.isFinite(
                parsed,
              )
            ) {
              onChange(parsed);
            }
          }}
          className="min-w-0 flex-1 rounded-lg px-3 py-2 outline-none"
        />

        {unit ? (
          <span className="flex items-center border-l border-slate-200 px-2 text-slate-500">
            {unit}
          </span>
        ) : null}
      </div>
    </label>
  );
}

function Value({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <strong className="text-slate-950">
      {children}
    </strong>
  );
}

export default function LandScientificModelPanel({
  site,
  results,
  selectedHour,
  module,
  inverter,
  electrical,
  onUpdatePV,
  onUpdateSite,
}: Props) {
  const pv =
    site.pvConfiguration;

  const model =
    calculateLandModelTransparency({
      site,
      module,
      inverter,
      results,
      selectedHour,
    });

  const point =
    model.selectedPoint;

  const inverterState =
    electrical.inverter;

  const distribution =
    electrical.distribution;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">
            Scientific transparency
          </span>

          <h2 className="mt-1 text-lg font-semibold text-slate-950">
            Equations, parameters and live substitutions
          </h2>

          <p className="mt-1 max-w-4xl text-sm text-slate-600">
            These are the equations and active parameters used
            by the current Land digital-twin calculation.
            Manufacturer catalogue values remain read-only;
            design and model assumptions can be changed below.
          </p>
        </div>

        <span
          className={
            model.footprint.fitsField
              ? "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
              : "rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-800"
          }
        >
          Physical layout{" "}
          {model.footprint.fitsField
            ? "PASS"
            : "FAIL"}
        </span>
      </div>

      {!model.footprint.fitsField ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <strong>
            The configured array does not fit inside the site.
          </strong>

          <p className="mt-1">
            Available field:{" "}
            {model.footprint.fieldLengthM.toFixed(2)} ×{" "}
            {model.footprint.fieldWidthM.toFixed(2)} m.
            Required footprint:{" "}
            {model.footprint.requiredLengthM.toFixed(3)} ×{" "}
            {model.footprint.requiredWidthM.toFixed(3)} m.
            Recommended minimum field:{" "}
            {model.footprint.recommendedFieldLengthM} ×{" "}
            {model.footprint.recommendedFieldWidthM} m.
          </p>

          <p className="mt-1 font-medium">
            Energy output is still mathematically calculated
            from all configured modules, but the result must
            not be interpreted as a physically buildable plant.
          </p>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <span className="text-xs text-slate-500">
            Installed DC
          </span>
          <Value>
            {model.installedCapacityKw.toFixed(2)} kWp
          </Value>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <span className="text-xs text-slate-500">
            Rated AC
          </span>
          <Value>
            {model.configuredAcCapacityKw.toFixed(2)} kW
          </Value>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <span className="text-xs text-slate-500">
            DC/AC ratio
          </span>
          <Value>
            {model.inverterLoadingRatio?.toFixed(3) ?? "—"}
          </Value>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <span className="text-xs text-slate-500">
            Physical module coverage
          </span>
          <Value>
            {model.physicalModuleCoveragePercent.toFixed(1)}%
          </Value>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <span className="text-xs text-slate-500">
            Daily specific yield
          </span>
          <Value>
            {model.dailySpecificYieldKWhPerKwp?.toFixed(3) ?? "—"}{" "}
            kWh/kWp
          </Value>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <span className="text-xs text-slate-500">
            Daily capacity factor
          </span>
          <Value>
            {model.dailyCapacityFactorPercent?.toFixed(2) ?? "—"}%
          </Value>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <span className="text-xs text-slate-500">
            Selected-hour PV
          </span>
          <Value>
            {point?.pvPower.toFixed(2) ?? "—"} kW
          </Value>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <span className="text-xs text-slate-500">
            Inverter AC
          </span>
          <Value>
            {inverterState.ac.activePowerKw.toFixed(2)} kW
          </Value>
        </div>
      </div>

      <details className="mt-5 rounded-xl border border-slate-200 p-4" open>
        <summary className="cursor-pointer font-semibold text-slate-900">
          Active equations and substituted values
        </summary>

        <div className="mt-4 space-y-3 text-sm">
          <div className="rounded-lg bg-slate-50 p-3">
            <Value>
              Installed capacity
            </Value>
            <p className="mt-1 font-mono text-xs text-slate-700">
              Pdc,STC = Nrows × Nmodules/row × Pmodule / 1000
            </p>
            <p className="mt-1 text-slate-600">
              {pv.numberOfRows} × {pv.modulesPerRow} ×{" "}
              {pv.modulePower} / 1000 ={" "}
              {model.installedCapacityKw.toFixed(2)} kWp
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3">
            <Value>
              Plane-of-array irradiance
            </Value>
            <p className="mt-1 font-mono text-xs text-slate-700">
              POA = DNI·max(cos(AOI),0) +
              DHI·(1+cos β)/2 +
              GHI·ρg·(1-cos β)/2
            </p>
            <p className="mt-1 text-slate-600">
              Selected hour: beam{" "}
              {point?.poaBeam.toFixed(1) ?? "—"} +
              sky diffuse{" "}
              {point?.poaSkyDiffuse.toFixed(1) ?? "—"} +
              ground reflected{" "}
              {point?.poaGroundReflected.toFixed(1) ?? "—"} ={" "}
              {point?.poaIrradiance.toFixed(1) ?? "—"} W/m²
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3">
            <Value>
              Module temperature
            </Value>
            <p className="mt-1 font-mono text-xs text-slate-700">
              Tmodule = Tamb + ((NOCT − 20)/800)·POA
            </p>
            <p className="mt-1 text-slate-600">
              NOCT {pv.moduleNOCT}°C; calculated module
              temperature{" "}
              {point?.moduleTemperature.toFixed(1) ?? "—"}°C.
              Current implementation does not yet apply a
              wind-dependent thermal correction.
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3">
            <Value>
              Temperature power factor
            </Value>
            <p className="mt-1 font-mono text-xs text-slate-700">
              fT = clamp(1 + γPmax·(Tmodule−25)/100,
              0.65, 1.08)
            </p>
            <p className="mt-1 text-slate-600">
              γPmax = {pv.temperatureCoefficientPmax}%/°C;
              fT ={" "}
              {point?.temperatureFactor.toFixed(3) ?? "—"}.
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3">
            <Value>
              Hourly modeled PV power
            </Value>
            <p className="mt-1 font-mono text-xs text-slate-700">
              Ppv = Pdc,STC·(POA/1000)·ηsystem·fT
            </p>
            <p className="mt-1 text-slate-600">
              ηsystem = {(pv.systemEfficiency * 100).toFixed(1)}%;
              selected-hour result ={" "}
              {point?.pvPower.toFixed(2) ?? "—"} kW.
              This is modeled aggregate PV output, not measured
              revenue-meter export.
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3">
            <Value>
              Daily energy
            </Value>
            <p className="mt-1 font-mono text-xs text-slate-700">
              Edaily = Σ Phour·Δt; Δt = 1 hour
            </p>
            <p className="mt-1 text-slate-600">
              Current day = {results.dailyEnergyKWh.toFixed(2)} kWh.
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3">
            <Value>
              String and MPPT operating point
            </Value>
            <p className="mt-1 font-mono text-xs text-slate-700">
              Vmpp,string = Ns·Vmpp,module;
              Impp,MPPT = Nparallel·Impp,module
            </p>
            <p className="mt-1 text-slate-600">
              String Vmpp ={" "}
              {model.stringVmppV?.toFixed(1) ?? "NOT_EVALUATED"} V;
              string Voc at STC ={" "}
              {model.stringVocStcV?.toFixed(1) ?? "NOT_EVALUATED"} V;
              MPPT operating current ={" "}
              {model.mpptOperatingCurrentA?.toFixed(2) ?? "NOT_EVALUATED"} A.
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3">
            <Value>
              Three-phase AC current
            </Value>
            <p className="mt-1 font-mono text-xs text-slate-700">
              Iline = Pac / (√3·VLL·PF)
            </p>
            <p className="mt-1 text-slate-600">
              Pac = {inverterState.ac.activePowerKw.toFixed(2)} kW;
              VLL = {inverterState.ac.lineLineVoltageV.toFixed(0)} V;
              PF = {inverterState.ac.powerFactor.toFixed(2)};
              Iline = {inverterState.ac.lineCurrentA.toFixed(2)} A.
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3">
            <Value>
              Distribution balance
            </Value>
            <p className="mt-1 font-mono text-xs text-slate-700">
              Pac + Pgrid,in = Pload + Pgrid,out + Ploss
            </p>
            <p className="mt-1 text-slate-600">
              Served load {distribution.totalServedLoadKw.toFixed(2)} kW;
              grid import {distribution.gridImportKw.toFixed(2)} kW;
              grid export {distribution.gridExportKw.toFixed(2)} kW;
              balance{" "}
              {distribution.balanceWithinTolerance
                ? "PASS"
                : "CHECK"}.
            </p>
          </div>
        </div>
      </details>

      <details className="mt-4 rounded-xl border border-slate-200 p-4">
        <summary className="cursor-pointer font-semibold text-slate-900">
          Consolidated editable simulation parameters
        </summary>

        <p className="mt-2 text-xs text-slate-500">
          Changes are synchronized with the main configuration
          panel and invalidate previously generated power-series
          results.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <NumberInput
            label="Field length"
            value={site.siteGeometry.fieldLengthM}
            unit="m"
            min={5}
            max={500}
            onChange={(value) => {
              if (value !== null) {
                onUpdateSite({
                  fieldLength:
                    value,
                });
              }
            }}
          />

          <NumberInput
            label="Field width"
            value={site.siteGeometry.fieldWidthM}
            unit="m"
            min={5}
            max={500}
            onChange={(value) => {
              if (value !== null) {
                onUpdateSite({
                  fieldWidth:
                    value,
                });
              }
            }}
          />

          <NumberInput
            label="Panel rows"
            value={pv.numberOfRows}
            min={1}
            max={100}
            onChange={(value) => {
              if (value !== null) {
                onUpdatePV({
                  numberOfRows:
                    Math.round(value),
                });
              }
            }}
          />

          <NumberInput
            label="Modules per row"
            value={pv.modulesPerRow}
            min={1}
            max={100}
            onChange={(value) => {
              if (value !== null) {
                onUpdatePV({
                  modulesPerRow:
                    Math.round(value),
                });
              }
            }}
          />

          <NumberInput
            label="Row spacing"
            value={pv.rowSpacing}
            unit="m"
            min={1}
            max={20}
            step={0.25}
            onChange={(value) => {
              if (value !== null) {
                onUpdatePV({
                  rowSpacing:
                    value,
                });
              }
            }}
          />

          <NumberInput
            label="Panel height"
            value={pv.panelHeight}
            unit="m"
            min={0.5}
            max={10}
            step={0.25}
            onChange={(value) => {
              if (value !== null) {
                onUpdatePV({
                  panelHeight:
                    value,
                });
              }
            }}
          />

          <NumberInput
            label="Tilt"
            value={pv.tilt}
            unit="°"
            min={0}
            max={90}
            step={1}
            onChange={(value) => {
              if (value !== null) {
                onUpdatePV({
                  tilt:
                    value,
                });
              }
            }}
          />

          <NumberInput
            label="Azimuth"
            value={pv.azimuth}
            unit="°"
            min={0}
            max={360}
            step={1}
            onChange={(value) => {
              if (value !== null) {
                onUpdatePV({
                  azimuth:
                    value,
                });
              }
            }}
          />

          <NumberInput
            label="System efficiency"
            value={
              pv.systemEfficiency *
              100
            }
            unit="%"
            min={1}
            max={100}
            step={0.5}
            onChange={(value) => {
              if (value !== null) {
                onUpdatePV({
                  systemEfficiency:
                    value / 100,
                });
              }
            }}
          />

          <NumberInput
            label="Ground albedo"
            value={pv.groundAlbedo}
            min={0}
            max={1}
            step={0.01}
            onChange={(value) => {
              if (value !== null) {
                onUpdatePV({
                  groundAlbedo:
                    value,
                });
              }
            }}
          />

          <NumberInput
            label="Tracker limit"
            value={pv.maximumTrackerAngle}
            unit="°"
            min={0}
            max={90}
            step={1}
            onChange={(value) => {
              if (value !== null) {
                onUpdatePV({
                  maximumTrackerAngle:
                    value,
                });
              }
            }}
          />

          <label className="space-y-1 text-xs text-slate-700">
            <span className="font-medium">
              Tracking strategy
            </span>

            <select
              value={pv.trackingMode}
              onChange={(event) =>
                onUpdatePV({
                  trackingMode:
                    event.target
                      .value as PVConfiguration["trackingMode"],
                })
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            >
              <option value="fixed">Fixed</option>
              <option value="standard">Standard tracking</option>
              <option value="reverse">Reverse tracking</option>
              <option value="custom">Adaptive custom</option>
            </select>
          </label>

          <NumberInput
            label="Inverter units"
            value={pv.inverterCount}
            min={1}
            step={1}
            optional
            onChange={(value) =>
              onUpdatePV({
                inverterCount:
                  value === null
                    ? null
                    : Math.round(value),
              })
            }
          />

          <NumberInput
            label="Modules/string"
            value={pv.modulesPerString}
            min={1}
            step={1}
            optional
            onChange={(value) =>
              onUpdatePV({
                modulesPerString:
                  value === null
                    ? null
                    : Math.round(value),
              })
            }
          />

          <NumberInput
            label="Strings/inverter"
            value={pv.stringsPerInverter}
            min={1}
            step={1}
            optional
            onChange={(value) =>
              onUpdatePV({
                stringsPerInverter:
                  value === null
                    ? null
                    : Math.round(value),
              })
            }
          />

          <NumberInput
            label="Maximum strings/MPPT"
            value={pv.stringsPerMppt}
            min={1}
            step={1}
            optional
            onChange={(value) =>
              onUpdatePV({
                stringsPerMppt:
                  value === null
                    ? null
                    : Math.round(value),
              })
            }
          />

          <NumberInput
            label="Minimum design temperature"
            value={pv.minimumDesignTemperatureC}
            unit="°C"
            step={0.5}
            optional
            onChange={(value) =>
              onUpdatePV({
                minimumDesignTemperatureC:
                  value,
              })
            }
          />

          <NumberInput
            label="Maximum cell temperature"
            value={pv.maximumDesignCellTemperatureC}
            unit="°C"
            step={0.5}
            optional
            onChange={(value) =>
              onUpdatePV({
                maximumDesignCellTemperatureC:
                  value,
              })
            }
          />

          <NumberInput
            label="Bifacial current factor"
            value={pv.bifacialCurrentFactor}
            min={1}
            max={2}
            step={0.01}
            optional
            onChange={(value) =>
              onUpdatePV({
                bifacialCurrentFactor:
                  value,
              })
            }
          />
        </div>
      </details>

      <details className="mt-4 rounded-xl border border-slate-200 p-4">
        <summary className="cursor-pointer font-semibold text-slate-900">
          Read-only manufacturer equipment parameters
        </summary>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <dl className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-4 text-sm">
            <dt>PV module</dt>
            <dd className="text-right font-medium">{module.model}</dd>
            <dt>Pmax</dt>
            <dd className="text-right">{module.pmaxW} W</dd>
            <dt>Vmpp / Impp</dt>
            <dd className="text-right">
              {module.vmppV ?? "—"} V / {module.imppA ?? "—"} A
            </dd>
            <dt>Voc / Isc</dt>
            <dd className="text-right">
              {module.vocV ?? "—"} V / {module.iscA ?? "—"} A
            </dd>
            <dt>NOCT/NMOT</dt>
            <dd className="text-right">{module.noctC}°C</dd>
            <dt>Pmax coefficient</dt>
            <dd className="text-right">
              {module.tempCoeffPmaxPercentPerC}%/°C
            </dd>
            <dt>Source</dt>
            <dd className="text-right break-words">{module.source}</dd>
          </dl>

          <dl className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-4 text-sm">
            <dt>Inverter</dt>
            <dd className="text-right font-medium">{inverter.model}</dd>
            <dt>Rated AC</dt>
            <dd className="text-right">
              {inverter.ac.ratedActivePowerW / 1000} kW
            </dd>
            <dt>Maximum DC voltage</dt>
            <dd className="text-right">
              {inverter.dc.maxInputVoltageV} V
            </dd>
            <dt>MPP range</dt>
            <dd className="text-right">
              {inverter.dc.mppVoltageMinV}–
              {inverter.dc.mppVoltageMaxV} V
            </dd>
            <dt>Operating current/MPPT</dt>
            <dd className="text-right">
              {inverter.dc.maxOperatingCurrentPerMpptA} A
            </dd>
            <dt>Maximum efficiency</dt>
            <dd className="text-right">
              {(inverter.ac.maximumEfficiency * 100).toFixed(1)}%
            </dd>
          </dl>
        </div>
      </details>

      <p className="mt-4 rounded-lg bg-indigo-50 p-3 text-xs text-indigo-800">
        Model status: deterministic design-stage simulation.
        Open-Meteo values are modeled/reanalysis or forecast
        inputs. Outputs are not measured plant telemetry and
        require pvlib, Simulink and sensor validation before
        publication as validated performance.
      </p>
    </section>
  );
}
