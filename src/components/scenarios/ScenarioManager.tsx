"use client";

import {
  useState,
} from "react";

import ScenarioEnvironmentPreview from "./ScenarioEnvironmentPreview";
import ScenarioSimulationRuns from "./ScenarioSimulationRuns";


import {
  useRouter,
} from "next/navigation";

import ScenarioCard from "./ScenarioCard";

import type {
  Scenario,
  ScenarioStatus,
  ScenarioType,
  TrackingMode,
} from "@/lib/scenarios/types";

import {
  PV_MODULE_MANUFACTURERS,
  PV_MODULE_PROFILES,
} from "@/lib/pv/moduleProfiles";

import {
  INVERTER_MANUFACTURERS,
  INVERTER_PROFILES,
} from "@/lib/electrical/inverter/catalogue";

interface ScenarioManagerProps {
  projectId: string;
  siteId: string;
  scenarios: Scenario[];
}

interface FormState {
  name: string;
  description: string;

  scenarioType: ScenarioType;

  status: ScenarioStatus;

  isBaseline: boolean;

  moduleId: string;
  inverterId: string;
  inverterCount: string;
  modulesPerString: string;
  stringsPerInverter: string;
  stringsPerMppt: string;
  minimumDesignTemperatureC: string;
  maximumDesignCellTemperatureC: string;
  bifacialCurrentFactor: string;

  panelHeightM: string;
  rowSpacingM: string;
  tiltDeg: string;
  azimuthDeg: string;
  gcrPercent: string;

  trackingMode: TrackingMode;

  cropId: string;
  cropName: string;
  cropRetentionPercent: string;

  weatherSource:
    | "open_meteo"
    | "sensor"
    | "uploaded_dataset"
    | "synthetic"
    | "manual";

  weatherMode:
    | "historical"
    | "forecast"
    | "typical"
    | "dataset"
    | "sensor";

  weatherYear: string;

  weatherStartDate: string;
  weatherEndDate: string;

  weatherDatasetId: string;

  maximumGcrPercent: string;

  minimumLer: string;

  policyCropRetentionPercent: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",

  scenarioType:
    "agrivoltaic",

  status:
    "draft",

  isBaseline:
    false,

  moduleId:
    "",

  inverterId:
    "",

  inverterCount:
    "",

  modulesPerString:
    "",

  stringsPerInverter:
    "",

  stringsPerMppt:
    "",

  minimumDesignTemperatureC:
    "",

  maximumDesignCellTemperatureC:
    "",

  bifacialCurrentFactor:
    "",

  panelHeightM:
    "",

  rowSpacingM:
    "",

  tiltDeg:
    "",

  azimuthDeg:
    "",

  gcrPercent:
    "",

  trackingMode:
    "fixed",

  cropId:
    "",

  cropName:
    "",

  cropRetentionPercent:
    "80",

  weatherSource:
    "open_meteo",

  weatherMode:
    "historical",

  weatherYear:
    new Date()
      .getFullYear()
      .toString(),

  weatherStartDate:
    "",

  weatherEndDate:
    "",

  weatherDatasetId:
    "",

  maximumGcrPercent:
    "40",

  minimumLer:
    "1.1",

  policyCropRetentionPercent:
    "80",
};

function optionalNumber(
  value: string,
): number | null {
  const trimmed =
    value.trim();

  if (!trimmed) {
    return null;
  }

  const number =
    Number(trimmed);

  if (
    !Number.isFinite(number)
  ) {
    return null;
  }

  return number;
}

function optionalPercent(
  value: string,
): number | null {
  const number =
    optionalNumber(value);

  if (number === null) {
    return null;
  }

  return number / 100;
}

function valueOrEmpty(
  value:
    | number
    | null
    | undefined,
): string {
  return value == null
    ? ""
    : String(value);
}

function percentOrEmpty(
  value:
    | number
    | null
    | undefined,
): string {
  return value == null
    ? ""
    : String(
        Math.round(
          value * 10000,
        ) / 100,
      );
}

export default function ScenarioManager({
  projectId,
  siteId,
  scenarios,
}: ScenarioManagerProps) {
  const router =
    useRouter();

  const [
    editingScenario,
    setEditingScenario,
  ] =
    useState<Scenario | null>(
      null,
    );

  const [
    form,
    setForm,
  ] =
    useState<FormState>(
      EMPTY_FORM,
    );

  const [
    formOpen,
    setFormOpen,
  ] =
    useState(false);

  const [
    busy,
    setBusy,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState<string | null>(
      null,
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  function updateField<K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function openNew() {
    setEditingScenario(null);

    setForm({
      ...EMPTY_FORM,

      weatherYear:
        new Date()
          .getFullYear()
          .toString(),
    });

    setMessage(null);
    setError(null);

    setFormOpen(true);
  }

  function openEdit(
    scenario: Scenario,
  ) {
    setEditingScenario(
      scenario,
    );

    setForm({
      name:
        scenario.name,

      description:
        scenario.description ??
        "",

      scenarioType:
        scenario.scenarioType as ScenarioType,

      status:
        scenario.status,

      isBaseline:
        scenario.isBaseline,

      moduleId:
        scenario
          .technicalConfig
          .moduleId ??
        "",

      inverterId:
        scenario
          .technicalConfig
          .inverterId ??
        "",

      inverterCount:
        valueOrEmpty(
          scenario
            .technicalConfig
            .inverterCount,
        ),

      modulesPerString:
        valueOrEmpty(
          scenario
            .technicalConfig
            .modulesPerString,
        ),

      stringsPerInverter:
        valueOrEmpty(
          scenario
            .technicalConfig
            .stringsPerInverter,
        ),

      stringsPerMppt:
        valueOrEmpty(
          scenario
            .technicalConfig
            .stringsPerMppt,
        ),

      minimumDesignTemperatureC:
        valueOrEmpty(
          scenario
            .technicalConfig
            .minimumDesignTemperatureC,
        ),

      maximumDesignCellTemperatureC:
        valueOrEmpty(
          scenario
            .technicalConfig
            .maximumDesignCellTemperatureC,
        ),

      bifacialCurrentFactor:
        valueOrEmpty(
          scenario
            .technicalConfig
            .bifacialCurrentFactor,
        ),

      panelHeightM:
        valueOrEmpty(
          scenario
            .technicalConfig
            .panelHeightM,
        ),

      rowSpacingM:
        valueOrEmpty(
          scenario
            .technicalConfig
            .rowSpacingM,
        ),

      tiltDeg:
        valueOrEmpty(
          scenario
            .technicalConfig
            .tiltDeg,
        ),

      azimuthDeg:
        valueOrEmpty(
          scenario
            .technicalConfig
            .azimuthDeg,
        ),

      gcrPercent:
        percentOrEmpty(
          scenario
            .technicalConfig
            .gcr,
        ),

      trackingMode:
        scenario
          .technicalConfig
          .trackingMode ??
        "fixed",

      cropId:
        scenario
          .agriculturalConfig
          .cropId ??
        "",

      cropName:
        scenario
          .agriculturalConfig
          .cropName ??
        "",

      cropRetentionPercent:
        percentOrEmpty(
          scenario
            .agriculturalConfig
            .minimumCropRetention,
        ),

      weatherSource:
        scenario
          .weatherConfig
          .source ??
        "open_meteo",

      weatherMode:
        scenario
          .weatherConfig
          .mode ??
        "historical",

      weatherYear:
        valueOrEmpty(
          scenario
            .weatherConfig
            .year,
        ),

      weatherStartDate:
        scenario
          .weatherConfig
          .startDate ??
        "",

      weatherEndDate:
        scenario
          .weatherConfig
          .endDate ??
        "",

      weatherDatasetId:
        scenario
          .weatherConfig
          .datasetId ??
        "",

      maximumGcrPercent:
        percentOrEmpty(
          scenario
            .policyConfig
            .maximumGcr,
        ),

      minimumLer:
        valueOrEmpty(
          scenario
            .policyConfig
            .minimumLer,
        ),

      policyCropRetentionPercent:
        percentOrEmpty(
          scenario
            .policyConfig
            .minimumCropRetention,
        ),
    });

    setMessage(null);
    setError(null);

    setFormOpen(true);
  }

  function closeForm() {
    if (busy) {
      return;
    }

    setFormOpen(false);

    setEditingScenario(
      null,
    );

    setError(null);
  }

  async function callApi(
    body: unknown,
  ) {
    const response =
      await fetch(
        "/api/scenarios",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              body,
            ),
        },
      );

    const payload =
      (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

    if (
      !response.ok ||
      !payload.ok
    ) {
      throw new Error(
        payload.error ??
        "Scenario operation failed.",
      );
    }

    return payload;
  }

  async function saveScenario() {
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const technicalConfig = {
        moduleId:
          form.moduleId.trim() ||
          null,

        inverterId:
          form.inverterId.trim() ||
          null,

        inverterCount:
          optionalNumber(
            form.inverterCount,
          ),

        modulesPerString:
          optionalNumber(
            form.modulesPerString,
          ),

        stringsPerInverter:
          optionalNumber(
            form.stringsPerInverter,
          ),

        stringsPerMppt:
          optionalNumber(
            form.stringsPerMppt,
          ),

        minimumDesignTemperatureC:
          optionalNumber(
            form.minimumDesignTemperatureC,
          ),

        maximumDesignCellTemperatureC:
          optionalNumber(
            form.maximumDesignCellTemperatureC,
          ),

        bifacialCurrentFactor:
          optionalNumber(
            form.bifacialCurrentFactor,
          ),

        panelHeightM:
          optionalNumber(
            form.panelHeightM,
          ),

        rowSpacingM:
          optionalNumber(
            form.rowSpacingM,
          ),

        tiltDeg:
          optionalNumber(
            form.tiltDeg,
          ),

        azimuthDeg:
          optionalNumber(
            form.azimuthDeg,
          ),

        gcr:
          optionalPercent(
            form.gcrPercent,
          ),

        trackingMode:
          form.trackingMode,
      };

      const agriculturalConfig = {
        cropId:
          form.cropId.trim() ||
          null,

        cropName:
          form.cropName.trim() ||
          null,

        minimumCropRetention:
          optionalPercent(
            form.cropRetentionPercent,
          ),
      };

      const weatherConfig = {
        source:
          form.weatherSource,

        mode:
          form.weatherMode,

        year:
          optionalNumber(
            form.weatherYear,
          ),

        startDate:
          form.weatherStartDate.trim() ||
          null,

        endDate:
          form.weatherEndDate.trim() ||
          null,

        datasetId:
          form.weatherSource ===
            "uploaded_dataset"
            ? (
                form.weatherDatasetId.trim() ||
                null
              )
            : null,
      };

      const policyConfig = {
        minimumCropRetention:
          optionalPercent(
            form.policyCropRetentionPercent,
          ),

        maximumGcr:
          optionalPercent(
            form.maximumGcrPercent,
          ),

        minimumLer:
          optionalNumber(
            form.minimumLer,
          ),
      };

      if (
        editingScenario
      ) {
        await callApi({
          action:
            "update",

          scenarioId:
            editingScenario.id,

          input: {
            name:
              form.name,

            description:
              form.description ||
              null,

            scenarioType:
              form.scenarioType,

            status:
              form.status,

            isBaseline:
              form.isBaseline,

            technicalConfig,

            agriculturalConfig,

            weatherConfig,

            policyConfig,
          },
        });

        setMessage(
          "Scenario updated successfully.",
        );
      } else {
        await callApi({
          action:
            "create",

          input: {
            projectId,
            siteId,

            name:
              form.name,

            description:
              form.description ||
              null,

            scenarioType:
              form.scenarioType,

            status:
              form.status,

            isBaseline:
              form.isBaseline,

            technicalConfig,

            agriculturalConfig,

            weatherConfig,

            policyConfig,

            economicConfig: {
              currency:
                "BDT",
            },

            metadata: {
              objective:
                "Agrivoltaic policy test-bench scenario",
            },
          },
        });

        setMessage(
          "Scenario created successfully.",
        );
      }

      setFormOpen(false);

      setEditingScenario(
        null,
      );

      router.refresh();
    } catch (
      caughtError
    ) {
      setError(
        caughtError
          instanceof Error
          ? caughtError.message
          : "Scenario operation failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function duplicateScenario(
    scenario: Scenario,
  ) {
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      await callApi({
        action:
          "duplicate",

        scenarioId:
          scenario.id,

        name:
          `${scenario.name} — Alternative`,
      });

      setMessage(
        "Alternative scenario created.",
      );

      router.refresh();
    } catch (
      caughtError
    ) {
      setError(
        caughtError
          instanceof Error
          ? caughtError.message
          : "Unable to duplicate scenario.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function archiveScenario(
    scenario: Scenario,
  ) {
    const confirmed =
      window.confirm(
        `Archive "${scenario.name}"?\n\n` +
        "The scenario will remain stored for research provenance.",
      );

    if (!confirmed) {
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      await callApi({
        action:
          "archive",

        scenarioId:
          scenario.id,
      });

      setMessage(
        "Scenario archived.",
      );

      router.refresh();
    } catch (
      caughtError
    ) {
      setError(
        caughtError
          instanceof Error
          ? caughtError.message
          : "Unable to archive scenario.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Saved scenarios
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Create baselines and alternative
            agrivoltaic policy experiments.
          </p>
        </div>

        <button
          type="button"
          onClick={openNew}
          disabled={busy}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          New scenario
        </button>
      </div>

      {message ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {formOpen ? (
        <section className="mt-5 rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                {editingScenario
                  ? "Edit experiment"
                  : "New experiment"}
              </p>

              <h3 className="mt-1 text-xl font-semibold text-slate-900">
                {editingScenario
                  ? editingScenario.name
                  : "Create policy scenario"}
              </h3>
            </div>

            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700"
            >
              Close
            </button>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900">
                Scenario identity
              </h4>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Name
                </span>

                <input
                  value={form.name}
                  onChange={(event) =>
                    updateField(
                      "name",
                      event.target.value,
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Description
                </span>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target.value,
                    )
                  }
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="text-sm font-medium text-slate-700">
                    Scenario type
                  </span>

                  <select
                    value={
                      form.scenarioType
                    }
                    onChange={(event) =>
                      updateField(
                        "scenarioType",
                        event.target
                          .value as ScenarioType,
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  >
                    <option value="agrivoltaic">
                      Agrivoltaic
                    </option>

                    <option value="agriculture_baseline">
                      Agriculture baseline
                    </option>

                    <option value="pv_baseline">
                      PV baseline
                    </option>

                    <option value="rooftop_pv">
                      Rooftop PV
                    </option>

                    <option value="research">
                      Research
                    </option>

                    <option value="custom">
                      Custom
                    </option>
                  </select>
                </label>

                <label>
                  <span className="text-sm font-medium text-slate-700">
                    Status
                  </span>

                  <select
                    value={
                      form.status
                    }
                    onChange={(event) =>
                      updateField(
                        "status",
                        event.target
                          .value as ScenarioStatus,
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  >
                    <option value="draft">
                      Draft
                    </option>

                    <option value="ready">
                      Ready
                    </option>

                    <option value="active">
                      Active
                    </option>
                  </select>
                </label>
              </div>

              <label className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-3">
                <input
                  type="checkbox"
                  checked={
                    form.isBaseline
                  }
                  onChange={(event) =>
                    updateField(
                      "isBaseline",
                      event.target.checked,
                    )
                  }
                />

                <span className="text-sm font-medium text-blue-900">
                  Use as comparison baseline
                </span>
              </label>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900">
                Technical configuration
              </h4>

              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="text-sm font-medium text-slate-700">
                    PV module
                  </span>

                  <select
                    value={form.moduleId}
                    onChange={(event) =>
                      updateField(
                        "moduleId",
                        event.target.value,
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  >
                    <option value="">
                      Inherit saved site module
                    </option>

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

                <label>
                  <span className="text-sm font-medium text-slate-700">
                    Inverter
                  </span>

                  <select
                    value={form.inverterId}
                    onChange={(event) =>
                      updateField(
                        "inverterId",
                        event.target.value,
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  >
                    <option value="">
                      Inherit saved site inverter
                    </option>

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

                {[
                  [
                    "inverterCount",
                    "Inverter units",
                  ],
                  [
                    "modulesPerString",
                    "Modules per string",
                  ],
                  [
                    "stringsPerInverter",
                    "Total strings per inverter",
                  ],
                  [
                    "stringsPerMppt",
                    "Maximum occupied strings per MPPT",
                  ],
                  [
                    "minimumDesignTemperatureC",
                    "Minimum design temperature (°C)",
                  ],
                  [
                    "maximumDesignCellTemperatureC",
                    "Maximum cell temperature (°C)",
                  ],
                  [
                    "bifacialCurrentFactor",
                    "Bifacial current factor",
                  ],
                  [
                    "panelHeightM",
                    "Panel height (m)",
                  ],
                  [
                    "rowSpacingM",
                    "Row spacing (m)",
                  ],
                  [
                    "tiltDeg",
                    "Tilt (°)",
                  ],
                  [
                    "azimuthDeg",
                    "Azimuth (°)",
                  ],
                  [
                    "gcrPercent",
                    "GCR (%)",
                  ],
                ].map(
                  ([key, label]) => (
                    <label key={key}>
                      <span className="text-sm font-medium text-slate-700">
                        {label}
                      </span>

                      <input
                        type="number"
                        step="any"
                        value={
                          form[
                            key as keyof FormState
                          ] as string
                        }
                        onChange={(event) =>
                          updateField(
                            key as keyof FormState,
                            event.target
                              .value as never,
                          )
                        }
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                      />
                    </label>
                  ),
                )}

                <label>
                  <span className="text-sm font-medium text-slate-700">
                    Tracking
                  </span>

                  <select
                    value={
                      form.trackingMode
                    }
                    onChange={(event) =>
                      updateField(
                        "trackingMode",
                        event.target
                          .value as TrackingMode,
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  >
                    <option value="fixed">
                      Fixed
                    </option>

                    <option value="standard">
                      Standard
                    </option>

                    <option value="reverse">
                      Reverse
                    </option>

                    <option value="custom">
                      Custom
                    </option>
                  </select>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900">
                Agriculture
              </h4>

              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="text-sm font-medium text-slate-700">
                    Crop ID
                  </span>

                  <input
                    value={
                      form.cropId
                    }
                    onChange={(event) =>
                      updateField(
                        "cropId",
                        event.target.value,
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>

                <label>
                  <span className="text-sm font-medium text-slate-700">
                    Crop name
                  </span>

                  <input
                    value={
                      form.cropName
                    }
                    onChange={(event) =>
                      updateField(
                        "cropName",
                        event.target.value,
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>

                <label>
                  <span className="text-sm font-medium text-slate-700">
                    Crop retention (%)
                  </span>

                  <input
                    type="number"
                    value={
                      form.cropRetentionPercent
                    }
                    onChange={(event) =>
                      updateField(
                        "cropRetentionPercent",
                        event.target.value,
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900">
                Weather assumption
              </h4>

              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="text-sm font-medium text-slate-700">
                    Source
                  </span>

                  <select
                    value={
                      form.weatherSource
                    }
                    onChange={(event) => {
                      const source =
                        event.target
                          .value as FormState["weatherSource"];

                      setForm(
                        (current) => ({
                          ...current,

                          weatherSource:
                            source,

                          weatherMode:
                            source ===
                            "uploaded_dataset"
                              ? "dataset"
                              : source ===
                                  "sensor"
                                ? "sensor"
                                : current.weatherMode ===
                                      "dataset" ||
                                    current.weatherMode ===
                                      "sensor"
                                  ? "historical"
                                  : current.weatherMode,

                          weatherDatasetId:
                            source ===
                            "uploaded_dataset"
                              ? (
                                  current.weatherDatasetId ||
                                  "solar-mem-data-v1"
                                )
                              : "",
                        }),
                      );
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  >
                    <option value="open_meteo">
                      Open-Meteo
                    </option>

                    <option value="uploaded_dataset">
                      Uploaded dataset
                    </option>

                    <option value="sensor">
                      Sensor
                    </option>

                    <option value="manual">
                      Manual
                    </option>

                    <option value="synthetic">
                      Synthetic
                    </option>
                  </select>
                </label>

                <label>
                  <span className="text-sm font-medium text-slate-700">
                    Mode
                  </span>

                  <select
                    value={
                      form.weatherMode
                    }
                    onChange={(event) =>
                      updateField(
                        "weatherMode",
                        event.target
                          .value as FormState["weatherMode"],
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  >
                    <option value="historical">
                      Historical
                    </option>

                    <option value="forecast">
                      Forecast
                    </option>

                    <option value="typical">
                      Typical
                    </option>

                    <option value="dataset">
                      Dataset
                    </option>

                    <option value="sensor">
                      Sensor
                    </option>
                  </select>
                </label>

                <label>
                  <span className="text-sm font-medium text-slate-700">
                    Weather year
                  </span>

                  <input
                    type="number"
                    value={
                      form.weatherYear
                    }
                    onChange={(event) =>
                      updateField(
                        "weatherYear",
                        event.target.value,
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>

                <label>
                  <span className="text-sm font-medium text-slate-700">
                    Start date
                  </span>

                  <input
                    type="date"
                    value={
                      form.weatherStartDate
                    }
                    onChange={(event) =>
                      updateField(
                        "weatherStartDate",
                        event.target.value,
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>

                <label>
                  <span className="text-sm font-medium text-slate-700">
                    End date
                  </span>

                  <input
                    type="date"
                    value={
                      form.weatherEndDate
                    }
                    onChange={(event) =>
                      updateField(
                        "weatherEndDate",
                        event.target.value,
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>

                {form.weatherSource ===
                "uploaded_dataset" ? (
                  <label className="sm:col-span-2">
                    <span className="text-sm font-medium text-slate-700">
                      Environmental dataset
                    </span>

                    <select
                      value={
                        form.weatherDatasetId
                      }
                      onChange={(event) =>
                        updateField(
                          "weatherDatasetId",
                          event.target.value,
                        )
                      }
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                    >
                      <option value="phase9d-rice-study-20260820">
                        Phase 9D Rice AV Frozen Weather — 20 August 2026
                      </option>

                      <option value="solar-mem-data-v1">
                        Solar-MEM Measurement Dataset
                      </option>
                    </select>

                    <p className="mt-1 text-xs text-slate-500">
                      {form.weatherDatasetId ===
                      "phase9d-rice-study-20260820"
                        ? "Frozen 24-hour environmental evidence for controlled Phase 9D scenario comparison, MCDA, Pareto and sensitivity analysis."
                        : "Local 1-minute measurement data are streamed and normalized to hourly AgriTwin environmental records."}
                    </p>
                  </label>
                ) : null}
              </div>
            </div>

            <div className="space-y-4 lg:col-span-2">
              <h4 className="font-semibold text-slate-900">
                Policy constraints
              </h4>

              <div className="grid gap-3 sm:grid-cols-3">
                <label>
                  <span className="text-sm font-medium text-slate-700">
                    Minimum crop retention (%)
                  </span>

                  <input
                    type="number"
                    value={
                      form.policyCropRetentionPercent
                    }
                    onChange={(event) =>
                      updateField(
                        "policyCropRetentionPercent",
                        event.target.value,
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>

                <label>
                  <span className="text-sm font-medium text-slate-700">
                    Maximum GCR (%)
                  </span>

                  <input
                    type="number"
                    value={
                      form.maximumGcrPercent
                    }
                    onChange={(event) =>
                      updateField(
                        "maximumGcrPercent",
                        event.target.value,
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>

                <label>
                  <span className="text-sm font-medium text-slate-700">
                    Minimum LER
                  </span>

                  <input
                    type="number"
                    step="0.01"
                    value={
                      form.minimumLer
                    }
                    onChange={(event) =>
                      updateField(
                        "minimumLer",
                        event.target.value,
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={closeForm}
              disabled={busy}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={
                saveScenario
              }
              disabled={
                busy ||
                !form.name.trim()
              }
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy
                ? "Saving..."
                : editingScenario
                  ? "Save changes"
                  : "Create scenario"}
            </button>
          </div>
        </section>
      ) : null}

      {scenarios.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h3 className="text-lg font-semibold text-slate-900">
            No scenarios yet
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Create the first reproducible
            baseline or agrivoltaic
            alternative for this site.
          </p>

          <button
            type="button"
            onClick={openNew}
            className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          >
            Create first scenario
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {scenarios.map(
            (scenario) => (
              <div
                key={scenario.id}
              >
                <ScenarioCard
                  scenario={
                    scenario
                  }
                />

                <ScenarioEnvironmentPreview
                  scenario={
                    scenario
                  }
                />

                <ScenarioSimulationRuns
                  scenario={
                    scenario
                  }
                />

                {scenario.status !==
                "archived" ? (
                  <div className="-mt-2 flex flex-wrap justify-end gap-2 rounded-b-2xl border border-t-0 border-slate-200 bg-white px-5 pb-4 pt-3">
                    <button
                      type="button"
                      onClick={() =>
                        openEdit(
                          scenario,
                        )
                      }
                      disabled={busy}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        duplicateScenario(
                          scenario,
                        )
                      }
                      disabled={busy}
                      className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-800"
                    >
                      Duplicate
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        archiveScenario(
                          scenario,
                        )
                      }
                      disabled={busy}
                      className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800"
                    >
                      Archive
                    </button>
                  </div>
                ) : null}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
