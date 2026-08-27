"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  Building2,
  CloudSun,
  Gauge,
  Grid3X3,
  LayoutDashboard,
  History,
  PanelTop,
  RefreshCcw,
  Save,
  Ruler,
  Sun,
  ThermometerSun,
  Zap,
} from "lucide-react";

import { solveRectangularRoofLayout } from "@/lib/geometry/rectangularRoof";
import type {
  SiteVersionHistoryEntry,
  SiteVersionOperationResult,
} from "@/lib/projects/types";
import {
  getPVModuleProfile,
  PV_MODULE_MANUFACTURERS,
  PV_MODULE_PROFILES,
} from "@/lib/pv/moduleProfiles";
import {
  FLAT_ROOF_STRUCTURAL_DISCLAIMER,
} from "@/lib/sites/adapters/flatRoof";
import { runFlatRoofSimulation } from "@/lib/rooftop/simulation";

import {
  simulateDemonstrationElectricalTimestep,
} from "@/lib/electrical/demonstration";

import {
  DEFAULT_INVERTER_PROFILE_ID,
  getInverterProfile,
  INVERTER_MANUFACTURERS,
  INVERTER_PROFILES,
} from "@/lib/electrical/inverter/catalogue";
import { useWeather } from "@/lib/weather/useWeather";
import { useRooftopStore } from "@/store/useRooftopStore";

import VersionHistory from "./VersionHistory";

import PowerOutputTimeSeries from "@/components/charts/PowerOutputTimeSeries";
import ElectricalStatusPanel from "@/components/twin/electrical/ElectricalStatusPanel";
import PVInverterCompatibilityPanel from "@/components/twin/electrical/PVInverterCompatibilityPanel";
import PhysicsConfigurationPanel from "@/components/twin/science/PhysicsConfigurationPanel";

const RooftopScene = dynamic(
  () => import("./RooftopScene"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[480px] items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
        Preparing rooftop digital twin…
      </div>
    ),
  },
);

interface NumberFieldProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 0.1,
  unit,
  onChange,
}: NumberFieldProps) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium text-slate-700">
        {label}
      </span>
      <div className="flex rounded-lg border border-slate-300 bg-white">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) =>
            onChange(
              Number(event.target.value),
            )
          }
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

function Metric({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-amber-50 p-2 text-amber-700">
          {icon}
        </div>
        <div>
          <p className="text-sm text-slate-500">
            {label}
          </p>
          <strong className="text-xl text-slate-900">
            {value}
          </strong>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {detail}
      </p>
    </article>
  );
}

export default function RooftopDashboard() {
  const site = useRooftopStore(
    (state) => state.activeSite,
  );
  const selectedHour = useRooftopStore(
    (state) => state.selectedHour,
  );
  const setSelectedHour = useRooftopStore(
    (state) => state.setSelectedHour,
  );
  const updateIdentity = useRooftopStore(
    (state) => state.updateIdentity,
  );
  const updateGeometry = useRooftopStore(
    (state) => state.updateGeometry,
  );
  const updateParapet = useRooftopStore(
    (state) => state.updateParapet,
  );
  const updateSetbacks = useRooftopStore(
    (state) => state.updateSetbacks,
  );
  const updateArray = useRooftopStore(
    (state) => state.updateArray,
  );
  const updatePV = useRooftopStore(
    (state) => state.updatePV,
  );
  const setModuleProfile = useRooftopStore(
    (state) => state.setModuleProfile,
  );
  const reset = useRooftopStore(
    (state) => state.reset,
  );
  const databaseSiteId = useRooftopStore(
    (state) => state.databaseSiteId,
  );
  const activeVersionId = useRooftopStore(
    (state) => state.activeVersionId,
  );
  const activeVersionNumber = useRooftopStore(
    (state) => state.activeVersionNumber,
  );
  const lastSavedAt = useRooftopStore(
    (state) => state.lastSavedAt,
  );
  const isDirty = useRooftopStore(
    (state) => state.isDirty,
  );
  const markSaved = useRooftopStore(
    (state) => state.markSaved,
  );
  const updateVersionMetadata = useRooftopStore(
    (state) => state.updateVersionMetadata,
  );
  const [changeSummary, setChangeSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [versionMessage, setVersionMessage] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const handleActiveMetadata = useCallback(
    (entry: SiteVersionHistoryEntry) => {
      updateVersionMetadata({
        activeVersionNumber: entry.versionNumber,
        lastSavedHash: entry.configurationHash,
        lastSavedAt: entry.createdAt,
      });
    },
    [updateVersionMetadata],
  );

  const handleVersionResult = useCallback(
    (result: SiteVersionOperationResult) => {
      markSaved(result);
      setChangeSummary("");
      setVersionMessage(`Version ${result.activeVersionNumber} is now active.`);
      setHistoryRefreshKey((value) => value + 1);
    },
    [markSaved],
  );

  async function saveNewVersion() {
    const summary = changeSummary.trim();

    if (!databaseSiteId || !activeVersionId) {
      setVersionMessage("Open a database-backed rooftop site from Projects first.");
      return;
    }

    if (!summary) {
      setVersionMessage("A change summary is required.");
      return;
    }

    if (summary.length > 500) {
      setVersionMessage("The change summary must not exceed 500 characters.");
      return;
    }

    setSaving(true);
    setVersionMessage("");

    try {
      const response = await fetch("/api/site-registry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-version",
          siteId: databaseSiteId,
          expectedActiveVersionId: activeVersionId,
          siteProfile: site,
          changeSummary: summary,
        }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        error?: string;
        result?: SiteVersionOperationResult;
      };

      if (!response.ok || !data.ok || !data.result) {
        throw new Error(data.error ?? "Unable to save the new version.");
      }

      handleVersionResult(data.result);
    } catch (caught) {
      setVersionMessage(
        caught instanceof Error
          ? caught.message
          : "Unable to save the new version.",
      );
    } finally {
      setSaving(false);
    }
  }

  const {
    weather,
    loading,
    error,
    reload,
  } = useWeather({
    latitude: site.location.latitude,
    longitude: site.location.longitude,
    date: site.simulationDate,
  });

  const layout = useMemo(
    () =>
      solveRectangularRoofLayout({
        geometry: site.siteGeometry,
        moduleWidthM:
          site.pvConfiguration.moduleWidth,
        moduleLengthM:
          site.pvConfiguration.moduleLength,
        modulePowerW:
          site.pvConfiguration.modulePower,
      }),
    [site],
  );

  const results = useMemo(
    () => runFlatRoofSimulation(site, weather),
    [site, weather],
  );

  const selectedPoint =
    results.hourly[selectedHour];

  const selectedInverter =
    getInverterProfile(
      site.pvConfiguration
        .inverterProfileId ??
        DEFAULT_INVERTER_PROFILE_ID,
    );

  const electrical =
    useMemo(
      () =>
        simulateDemonstrationElectricalTimestep({
          timestamp:
            `${site.simulationDate}T${String(
              selectedHour,
            ).padStart(
              2,
              "0",
            )}:00:00`,

          pvPowerKw:
            selectedPoint
              ?.dcPowerKW ??
            0,

          moduleCount:
            layout.moduleCount,

          moduleProfileId:
            site.pvConfiguration.moduleProfileId,

          modulesPerString:
            site.pvConfiguration
              .modulesPerString ??
            null,

          stringsPerInverter:
            site.pvConfiguration
              .stringsPerInverter ??
            null,

          stringsPerMppt:
            site.pvConfiguration
              .stringsPerMppt ??
            null,

          inverterCount:
            site.pvConfiguration
              .inverterCount ??
            1,

          moduleTemperatureC:
            selectedPoint
              ?.moduleTemperatureC ??
            null,

          inverterProfileId:
            selectedInverter.id,
        }),
      [
        selectedHour,
        selectedPoint,
        site.simulationDate,
        selectedInverter.id,
        layout.moduleCount,
        site.pvConfiguration.moduleProfileId,
        site.pvConfiguration.modulesPerString,
        site.pvConfiguration.stringsPerInverter,
        site.pvConfiguration.stringsPerMppt,
        site.pvConfiguration.inverterCount,
      ],
    );

  const selectedModule = getPVModuleProfile(
    site.pvConfiguration.moduleProfileId,
  );


  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="text-amber-600" />
              <h1 className="text-2xl font-bold text-slate-900">
                AgriTwin Rooftop
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              Rectangular flat-roof PV digital twin
            </p>
          </div>

          <nav className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              Land dashboard
            </Link>
            <Link
              href="/projects"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              Projects
            </Link>

            <Link
              href="/scenarios"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              Scenario Lab
            </Link>

            <Link
              href="/analytics"
              className="rounded-lg border border-indigo-300 px-3 py-2 text-sm text-indigo-700"
            >
              Analytics
            </Link>
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
            >
              <RefreshCcw size={15} />
              Reset rooftop
            </button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-[1600px] px-5 pt-5">
        <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-slate-900">
                  {activeVersionNumber
                    ? `Version ${activeVersionNumber}`
                    : "Version metadata loading"}
                </h2>
                <span
                  className={
                    isDirty
                      ? "rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800"
                      : "rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-800"
                  }
                >
                  {isDirty ? "Unsaved changes" : "Saved"}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {databaseSiteId
                  ? lastSavedAt
                    ? `Last saved: ${new Date(lastSavedAt).toLocaleString()}`
                    : "Database-backed rooftop design"
                  : "Local rooftop draft — open a site from Projects to save versions."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowHistory((value) => !value)}
              disabled={!databaseSiteId || !activeVersionId}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
            >
              <History size={16} />
              {showHistory ? "Hide history" : "Version history"}
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row">
            <input
              value={changeSummary}
              onChange={(event) => setChangeSummary(event.target.value)}
              maxLength={500}
              placeholder="Describe the design changes in this version"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void saveNewVersion()}
              disabled={
                saving ||
                !isDirty ||
                !changeSummary.trim() ||
                !databaseSiteId ||
                !activeVersionId
              }
              className="flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? "Saving…" : "Save new version"}
            </button>
          </div>

          {versionMessage ? (
            <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700" role="status">
              {versionMessage}
            </p>
          ) : null}
        </div>

        {showHistory && databaseSiteId && activeVersionId ? (
          <div className="mt-5">
            <VersionHistory
              siteId={databaseSiteId}
              activeVersionId={activeVersionId}
              refreshKey={historyRefreshKey}
              hasUnsavedChanges={isDirty}
              onActiveMetadata={handleActiveMetadata}
              onRestored={handleVersionResult}
            />
          </div>
        ) : null}
      </section>

      <div className="mx-auto grid max-w-[1600px] gap-6 p-5 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <LayoutDashboard size={18} />
              Site identity
            </h2>
            <div className="mt-4 space-y-3">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">
                  Site name
                </span>
                <input
                  value={site.name}
                  onChange={(event) =>
                    updateIdentity({
                      name: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label="Latitude"
                  value={site.location.latitude}
                  min={-90}
                  max={90}
                  step={0.0001}
                  onChange={(latitude) =>
                    updateIdentity({ latitude })
                  }
                />
                <NumberField
                  label="Longitude"
                  value={site.location.longitude}
                  min={-180}
                  max={180}
                  step={0.0001}
                  onChange={(longitude) =>
                    updateIdentity({ longitude })
                  }
                />
              </div>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">
                  Simulation date
                </span>
                <input
                  type="date"
                  value={site.simulationDate}
                  onChange={(event) =>
                    updateIdentity({
                      simulationDate:
                        event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <Ruler size={18} />
              Roof geometry
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <NumberField
                label="Building height"
                value={
                  site.siteGeometry
                    .buildingHeightM
                }
                min={0}
                unit="m"
                onChange={(buildingHeightM) =>
                  updateGeometry({
                    buildingHeightM,
                  })
                }
              />
              <NumberField
                label="Roof slope"
                value={
                  site.siteGeometry.roofSlopeDeg
                }
                min={0}
                max={10}
                unit="°"
                onChange={(roofSlopeDeg) =>
                  updateGeometry({ roofSlopeDeg })
                }
              />
              <NumberField
                label="Roof length"
                value={
                  site.siteGeometry.roofLengthM
                }
                min={1}
                unit="m"
                onChange={(roofLengthM) =>
                  updateGeometry({ roofLengthM })
                }
              />
              <NumberField
                label="Roof width"
                value={
                  site.siteGeometry.roofWidthM
                }
                min={1}
                unit="m"
                onChange={(roofWidthM) =>
                  updateGeometry({ roofWidthM })
                }
              />
              <NumberField
                label="Roof azimuth"
                value={
                  site.siteGeometry.roofAzimuthDeg
                }
                min={0}
                max={359.9}
                unit="°"
                onChange={(roofAzimuthDeg) =>
                  updateGeometry({ roofAzimuthDeg })
                }
              />
              <NumberField
                label="Surface albedo"
                value={
                  site.siteGeometry.surfaceAlbedo
                }
                min={0}
                max={1}
                step={0.01}
                onChange={(surfaceAlbedo) =>
                  updateGeometry({
                    surfaceAlbedo,
                  })
                }
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold">
              Setbacks and parapet
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {(
                [
                  "northM",
                  "southM",
                  "eastM",
                  "westM",
                ] as const
              ).map((key) => (
                <NumberField
                  key={key}
                  label={key.replace("M", "")}
                  value={
                    site.siteGeometry.setbacks[
                      key
                    ]
                  }
                  min={0}
                  unit="m"
                  onChange={(value) =>
                    updateSetbacks({
                      [key]: value,
                    })
                  }
                />
              ))}
              <NumberField
                label="Parapet height"
                value={
                  site.siteGeometry.parapet
                    .heightM
                }
                min={0}
                unit="m"
                onChange={(heightM) =>
                  updateParapet({ heightM })
                }
              />
              <NumberField
                label="Parapet width"
                value={
                  site.siteGeometry.parapet.widthM
                }
                min={0}
                unit="m"
                onChange={(widthM) =>
                  updateParapet({ widthM })
                }
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <PanelTop size={18} />
              PV array
            </h2>
            <div className="mt-4 space-y-3">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">
                  Module profile
                </span>
                <select
                  value={
                    site.pvConfiguration
                      .moduleProfileId
                  }
                  onChange={(event) =>
                    setModuleProfile(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  {PV_MODULE_MANUFACTURERS.map(
                    (manufacturer) => (
                      <optgroup
                        key={manufacturer}
                        label={manufacturer}
                      >
                        {PV_MODULE_PROFILES.filter(
                          (profile) =>
                            profile.manufacturer ===
                            manufacturer,
                        ).map((profile) => (
                          <option
                            key={profile.id}
                            value={profile.id}
                          >
                            {profile.model} ·{" "}
                            {profile.pmaxW} W
                          </option>
                        ))}
                      </optgroup>
                    ),
                  )}
                </select>
              </label>

              <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                {selectedModule.manufacturer}{" "}
                {selectedModule.model} ·{" "}
                {selectedModule.lengthM.toFixed(
                  3,
                )}{" "}
                ×{" "}
                {selectedModule.widthM.toFixed(
                  3,
                )}{" "}
                m
              </p>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">
                  Inverter profile
                </span>

                <select
                  value={selectedInverter.id}
                  onChange={(event) =>
                    updatePV({
                      inverterProfileId:
                        event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  {INVERTER_MANUFACTURERS.map(
                    (manufacturer) => (
                      <optgroup
                        key={manufacturer}
                        label={manufacturer}
                      >
                        {INVERTER_PROFILES.filter(
                          (profile) =>
                            profile.manufacturer ===
                            manufacturer,
                        ).map((profile) => (
                          <option
                            key={profile.id}
                            value={profile.id}
                          >
                            {profile.model} ·{" "}
                            {profile.ac.ratedActivePowerW /
                              1000}{" "}
                            kW
                          </option>
                        ))}
                      </optgroup>
                    ),
                  )}
                </select>
              </label>

              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-slate-700">
                <strong className="block text-sm text-slate-900">
                  {selectedInverter.manufacturer}{" "}
                  {selectedInverter.model}
                </strong>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <span>
                    Max PV:{" "}
                    {selectedInverter.dc.maxGeneratorPowerW /
                      1000}{" "}
                    kWp
                  </span>
                  <span>
                    Max DC:{" "}
                    {selectedInverter.dc.maxInputVoltageV} V
                  </span>
                  <span>
                    MPP:{" "}
                    {selectedInverter.dc.mppVoltageMinV}–
                    {selectedInverter.dc.mppVoltageMaxV} V
                  </span>
                  <span>
                    Topology:{" "}
                    {selectedInverter.dc.independentMpptInputs} ×{" "}
                    {selectedInverter.dc.stringsPerMppt}
                  </span>
                  <span>
                    Rated AC:{" "}
                    {selectedInverter.ac.ratedActivePowerW /
                      1000}{" "}
                    kW
                  </span>
                  <span>
                    Max efficiency:{" "}
                    {(
                      selectedInverter.ac.maximumEfficiency *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              </div>

              <PVInverterCompatibilityPanel
                module={selectedModule}
                inverter={selectedInverter}
                moduleCount={layout.moduleCount}
                inverterCount={
                  site.pvConfiguration
                    .inverterCount ??
                  1
                }
                modulesPerString={
                  site.pvConfiguration
                    .modulesPerString ??
                  null
                }
                stringsPerInverter={
                  site.pvConfiguration
                    .stringsPerInverter ??
                  null
                }
                stringsPerMppt={
                  site.pvConfiguration
                    .stringsPerMppt ??
                  null
                }
                minimumDesignTemperatureC={
                  site.pvConfiguration
                    .minimumDesignTemperatureC ??
                  null
                }
                maximumDesignCellTemperatureC={
                  site.pvConfiguration
                    .maximumDesignCellTemperatureC ??
                  null
                }
                bifacialCurrentFactor={
                  site.pvConfiguration
                    .bifacialCurrentFactor ??
                  null
                }
                onChange={updatePV}
              />

              <PhysicsConfigurationPanel
                pv={site.pvConfiguration}
                onUpdatePV={updatePV}
                compact
              />

              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label="Rack height"
                  value={
                    site.siteGeometry.array
                      .rackHeightM
                  }
                  min={0}
                  unit="m"
                  onChange={(rackHeightM) =>
                    updateArray({ rackHeightM })
                  }
                />
                <NumberField
                  label="Row spacing"
                  value={
                    site.siteGeometry.array
                      .rowSpacingM
                  }
                  min={0}
                  unit="m"
                  onChange={(rowSpacingM) =>
                    updateArray({ rowSpacingM })
                  }
                />
                <NumberField
                  label="Array tilt"
                  value={
                    site.siteGeometry.array.tiltDeg
                  }
                  min={0}
                  max={60}
                  unit="°"
                  onChange={(tiltDeg) =>
                    updateArray({ tiltDeg })
                  }
                />
                <NumberField
                  label="Array azimuth"
                  value={
                    site.siteGeometry.array
                      .azimuthDeg
                  }
                  min={0}
                  max={359.9}
                  unit="°"
                  onChange={(azimuthDeg) =>
                    updateArray({ azimuthDeg })
                  }
                />
              </div>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">
                  Module orientation
                </span>
                <select
                  value={
                    site.siteGeometry.array
                      .orientation
                  }
                  onChange={(event) =>
                    updateArray({
                      orientation:
                        event.target.value as
                          | "portrait"
                          | "landscape",
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="portrait">
                    Portrait
                  </option>
                  <option value="landscape">
                    Landscape
                  </option>
                </select>
              </label>
            </div>
          </section>
        </aside>

        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Installed DC capacity"
              value={`${results.installedCapacityKW.toFixed(
                2,
              )} kW`}
              detail={`${results.moduleCount} modules`}
              icon={<Zap size={20} />}
            />
            <Metric
              label="Daily PV energy"
              value={`${results.dailyEnergyKWh.toFixed(
                2,
              )} kWh`}
              detail={`${results.specificYieldKWhPerKW.toFixed(
                2,
              )} kWh/kW`}
              icon={<Sun size={20} />}
            />
            <Metric
              label="Usable roof area"
              value={`${results.usableRoofAreaM2.toFixed(
                1,
              )} m²`}
              detail={`${results.usableAreaPercent.toFixed(
                1,
              )}% of total roof`}
              icon={<Grid3X3 size={20} />}
            />
            <Metric
              label="Selected-hour power"
              value={`${selectedPoint.dcPowerKW.toFixed(
                2,
              )} kW`}
              detail={`${selectedPoint.poaIrradiance.toFixed(
                0,
              )} W/m² POA`}
              icon={<Gauge size={20} />}
            />
          </div>

          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <strong>
              Structural-engineering limitation
            </strong>
            <p className="mt-1">
              {FLAT_ROOF_STRUCTURAL_DISCLAIMER}
            </p>
          </section>

          <div className="rooftop-electrical-twin">
            <RooftopScene
              site={site}
              electrical={electrical}
            />

            <section className="rooftop-electrical-section">
              <div className="rooftop-electrical-section-heading">
                <div>
                  <span>
                    Phase 9E Electrical Balance-of-System
                  </span>

                  <h2>
                    Inverter & AC Distribution
                  </h2>

                  <p>
                    Selected-hour electrical state synchronized with the rooftop PV simulation.
                  </p>
                </div>

                <div className="rooftop-electrical-mode">
                  Grid connected
                </div>
              </div>

              <ElectricalStatusPanel
                data={electrical}
                embedded
              />
            </section>
          </div>

          <section className="grid gap-4 lg:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="flex items-center gap-2 font-semibold">
                <CloudSun size={18} />
                Weather connection
              </h2>
              <p className="mt-3 text-sm text-slate-600">
                {loading
                  ? "Loading Open-Meteo data…"
                  : error
                    ? error
                    : `${results.dataSource} data active`}
              </p>
              <button
                type="button"
                onClick={reload}
                className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                Reload weather
              </button>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="flex items-center gap-2 font-semibold">
                <ThermometerSun size={18} />
                Module temperature
              </h2>
              <p className="mt-3 text-3xl font-bold">
                {selectedPoint.moduleTemperatureC.toFixed(
                  1,
                )}
                °C
              </p>
              <p className="text-sm text-slate-500">
                Ambient{" "}
                {selectedPoint.ambientTemperatureC.toFixed(
                  1,
                )}
                °C
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold">
                Layout summary
              </h2>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <dt>Rows</dt>
                <dd className="text-right font-medium">
                  {layout.rows}
                </dd>
                <dt>Modules/row</dt>
                <dd className="text-right font-medium">
                  {layout.modulesPerRow}
                </dd>
                <dt>Total modules</dt>
                <dd className="text-right font-medium">
                  {layout.moduleCount}
                </dd>
                <dt>Coverage</dt>
                <dd className="text-right font-medium">
                  {(
                    layout.usableAreaCoverageRatio *
                    100
                  ).toFixed(1)}
                  %
                </dd>
              </dl>
            </article>
          </section>

          <PowerOutputTimeSeries
            key={site.updatedAt}
            siteKind="rooftop"
            site={site}
          />

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">
                  Hourly rooftop performance
                </h2>
                <p className="text-sm text-slate-500">
                  Select an hour to synchronize
                  engineering outputs.
                </p>
              </div>
              <strong>
                {selectedPoint.hour}
              </strong>
            </div>

            <input
              type="range"
              min={0}
              max={23}
              value={selectedHour}
              onChange={(event) =>
                setSelectedHour(
                  Number(event.target.value),
                )
              }
              className="mt-5 w-full"
            />

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="p-2">Hour</th>
                    <th className="p-2">GHI</th>
                    <th className="p-2">POA</th>
                    <th className="p-2">
                      Module °C
                    </th>
                    <th className="p-2">
                      DC power
                    </th>
                    <th className="p-2">
                      Net AC
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.hourly.map(
                    (point, index) => (
                      <tr
                        key={point.hour}
                        className={
                          index === selectedHour
                            ? "bg-amber-50"
                            : "border-b border-slate-100"
                        }
                      >
                        <td className="p-2">
                          {point.hour}
                        </td>
                        <td className="p-2">
                          {point.ghi.toFixed(0)} W/m²
                        </td>
                        <td className="p-2">
                          {point.poaIrradiance.toFixed(
                            0,
                          )}{" "}
                          W/m²
                        </td>
                        <td className="p-2">
                          {point.moduleTemperatureC.toFixed(
                            1,
                          )}
                        </td>
                        <td className="p-2">
                          {point.dcPowerKW.toFixed(2)} kW
                        </td>
                        <td className="p-2">
                          {point.deliveredAcPowerKW?.toFixed(2) ?? "—"} kW
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
