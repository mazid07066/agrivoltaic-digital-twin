"use client";

import {
  FormEvent,
  useState,
} from "react";

interface ExecutionResponse {
  ok: boolean;

  error?: string;

  preview?: {
    scenario: {
      id: string;
      name: string;
      version: number;
      type: string;
      baseline: boolean;
    };

    site: {
      id: string;
      name: string;
      type: string;
      versionId: string;
      versionNumber: number;
      schemaVersion: number;
    };

    engine: {
      kind: string;
      version: string;
      controllerVersion:
        string | null;
      weatherAdapterVersion:
        string | null;
    };

    environment: {
      source: string;
      mode: string;
      datasetId:
        string | null;
      startTime: string;
      endTime: string;
      recordCount: number;
      coveragePercent:
        number | null;
      missingRequiredValues:
        number;
      requestFingerprint:
        string | null;
      datasetFingerprint:
        string | null;
    };

    execution: {
      simulationDate: string;
      inputFingerprint:
        string | null;
    };
  };
}

export default function ExecutionTestPage() {
  const [
    scenarioId,
    setScenarioId,
  ] =
    useState(
      "12790cbf-3c8d-42bc-bb7a-2b58dbbadd50",
    );

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    response,
    setResponse,
  ] =
    useState<
      ExecutionResponse | null
    >(null);

  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setResponse(null);

    try {
      const request =
        await fetch(
          `/api/scenario-execution-input?scenarioId=${encodeURIComponent(
            scenarioId.trim(),
          )}`,
          {
            method:
              "GET",

            cache:
              "no-store",

            credentials:
              "same-origin",
          },
        );

      const data =
        (await request.json()) as
          ExecutionResponse;

      setResponse(
        data,
      );
    } catch (error) {
      setResponse({
        ok:
          false,

        error:
          error instanceof Error
            ? error.message
            : "Execution-input request failed.",
      });
    } finally {
      setLoading(false);
    }
  }

  const preview =
    response?.preview;

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
            AgriTwin Phase 9C
          </p>

          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Execution Input Verification
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Resolves a saved scenario into its
            immutable site version, environmental
            dataset and reproducible execution
            input snapshot.
          </p>

          <form
            onSubmit={
              submit
            }
            className="mt-6 flex flex-col gap-3 sm:flex-row"
          >
            <input
              value={
                scenarioId
              }
              onChange={(
                event,
              ) =>
                setScenarioId(
                  event.target.value,
                )
              }
              placeholder="Scenario UUID"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-2"
            />

            <button
              type="submit"
              disabled={
                loading ||
                !scenarioId.trim()
              }
              className="rounded-xl bg-cyan-700 px-5 py-2 font-medium text-white disabled:opacity-50"
            >
              {loading
                ? "Resolving..."
                : "Resolve execution input"}
            </button>
          </form>

          {response &&
          !response.ok ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {response.error ??
                "Execution resolution failed."}
            </div>
          ) : null}
        </div>

        {response?.ok &&
        preview ? (
          <div className="mt-6 grid gap-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-900">
                Scenario
              </h2>

              <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <p>
                  Name:{" "}
                  <strong>
                    {preview.scenario.name}
                  </strong>
                </p>

                <p>
                  Version:{" "}
                  <strong>
                    {preview.scenario.version}
                  </strong>
                </p>

                <p>
                  Type:{" "}
                  {preview.scenario.type}
                </p>

                <p>
                  Baseline:{" "}
                  {preview.scenario.baseline
                    ? "Yes"
                    : "No"}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-900">
                Immutable Site Version
              </h2>

              <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <p>
                  Site:{" "}
                  <strong>
                    {preview.site.name}
                  </strong>
                </p>

                <p>
                  Type:{" "}
                  {preview.site.type}
                </p>

                <p>
                  Version:{" "}
                  {preview.site.versionNumber}
                </p>

                <p className="break-all">
                  Version ID:{" "}
                  {preview.site.versionId}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-900">
                Engine
              </h2>

              <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <p>
                  Kind:{" "}
                  <strong>
                    {preview.engine.kind}
                  </strong>
                </p>

                <p>
                  Version:{" "}
                  {preview.engine.version}
                </p>

                <p>
                  Controller:{" "}
                  {preview.engine
                    .controllerVersion ??
                    "Not applicable"}
                </p>

                <p>
                  Weather adapter:{" "}
                  {preview.engine
                    .weatherAdapterVersion ??
                    "Not available"}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-900">
                Environment
              </h2>

              <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <p>
                  Source:{" "}
                  <strong>
                    {preview.environment.source}
                  </strong>
                </p>

                <p>
                  Mode:{" "}
                  {preview.environment.mode}
                </p>

                <p>
                  Dataset:{" "}
                  {preview.environment.datasetId ??
                    "Provider dataset"}
                </p>

                <p>
                  Records:{" "}
                  {preview.environment.recordCount}
                </p>

                <p>
                  Coverage:{" "}
                  {preview.environment.coveragePercent ??
                    "N/A"}
                  %
                </p>

                <p>
                  Missing required:{" "}
                  {preview.environment
                    .missingRequiredValues}
                </p>

                <p>
                  Start:{" "}
                  {preview.environment.startTime}
                </p>

                <p>
                  End:{" "}
                  {preview.environment.endTime}
                </p>
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-500">
                <p className="break-all">
                  Request fingerprint:{" "}
                  {preview.environment
                    .requestFingerprint ??
                    "Not available"}
                </p>

                <p className="break-all">
                  Dataset fingerprint:{" "}
                  {preview.environment
                    .datasetFingerprint ??
                    "Not available"}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <h2 className="font-semibold text-emerald-900">
                Reproducible Execution Package
              </h2>

              <div className="mt-3 text-sm text-emerald-900">
                <p>
                  Simulation date:{" "}
                  <strong>
                    {preview.execution
                      .simulationDate}
                  </strong>
                </p>

                <p className="mt-2 break-all">
                  Input fingerprint:{" "}
                  <strong>
                    {preview.execution
                      .inputFingerprint ??
                      "Not available"}
                  </strong>
                </p>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
