"use client";

import {
  useState,
} from "react";

import type {
  Scenario,
} from "@/lib/scenarios/types";

interface PreviewSummary {
  recordCount: number;

  averageGhiWm2:
    number | null;

  maximumGhiWm2:
    number | null;

  maximumDniWm2:
    number | null;

  averageTemperatureC:
    number | null;

  minimumTemperatureC:
    number | null;

  maximumTemperatureC:
    number | null;

  totalPrecipitationMm:
    number;

  averageWindSpeedMs:
    number | null;

  maximumWindSpeedMs:
    number | null;

  averageCloudCoverPct:
    number | null;
}

interface PreviewDataset {
  provenance: {
    source:
      string;

    mode:
      string;

    provider?:
      string | null;

    requestedCoordinate: {
      latitude:
        number;

      longitude:
        number;
    };

    resolvedCoordinate?: {
      latitude:
        number;

      longitude:
        number;
    } | null;

    resolvedGridDistanceKm?:
      number | null;

    requestFingerprint?:
      string | null;

    datasetFingerprint?:
      string | null;

    timezone:
      string;
  };

  startTime:
    string;

  endTime:
    string;

  quality: {
    recordCount:
      number;

    missingValueCount:
      number;

    warnings:
      string[];

    expectedHourlyRecordCount?:
      number | null;

    coveragePercent?:
      number | null;
  };
}

interface PreviewResponse {
  ok:
    boolean;

  error?:
    string;

  summary?:
    PreviewSummary;

  dataset?:
    PreviewDataset;
}

interface ScenarioEnvironmentPreviewProps {
  scenario:
    Scenario;
}

function numberText(
  value:
    number | null | undefined,

  digits = 2,
): string {
  return value == null
    ? "Not available"
    : value.toFixed(
        digits,
      );
}

function shortHash(
  value:
    string | null | undefined,
): string {
  if (!value) {
    return "Not available";
  }

  if (
    value.length <= 30
  ) {
    return value;
  }

  return `${value.slice(
    0,
    22,
  )}…${value.slice(-8)}`;
}

export default function ScenarioEnvironmentPreview({
  scenario,
}: ScenarioEnvironmentPreviewProps) {
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
      PreviewResponse | null
    >(null);

  async function loadPreview() {
    setLoading(true);

    setResponse(null);

    try {
      const request =
        await fetch(
          `/api/scenario-environment?scenarioId=${encodeURIComponent(
            scenario.id,
          )}`,
          {
            method:
              "GET",

            cache:
              "no-store",
          },
        );

      const data =
        (await request.json()) as
          PreviewResponse;

      setResponse(
        data,
      );
    } catch (
      error
    ) {
      setResponse({
        ok:
          false,

        error:
          error instanceof Error
            ? error.message
            : "Environmental preview failed.",
      });
    } finally {
      setLoading(false);
    }
  }

  const dataset =
    response?.dataset;

  const summary =
    response?.summary;

  return (
    <div className="mt-3 rounded-xl border border-cyan-100 bg-cyan-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-cyan-700">
            Environmental input
          </p>

          <p className="mt-1 text-sm text-slate-700">
            Preview the normalized weather
            dataset that this scenario would
            use.
          </p>
        </div>

        <button
          type="button"
          onClick={
            loadPreview
          }
          disabled={
            loading
          }
          className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading
            ? "Loading..."
            : "Preview weather"}
        </button>
      </div>

      {response &&
      !response.ok ? (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {response.error ??
            "Environmental preview failed."}
        </div>
      ) : null}

      {response?.ok &&
      dataset &&
      summary ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Records
              </p>

              <p className="mt-1 text-lg font-semibold text-slate-900">
                {summary.recordCount}
              </p>
            </div>

            <div className="rounded-lg bg-white p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Average GHI
              </p>

              <p className="mt-1 text-lg font-semibold text-slate-900">
                {numberText(
                  summary.averageGhiWm2,
                  1,
                )}{" "}
                W/m²
              </p>
            </div>

            <div className="rounded-lg bg-white p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Avg. temperature
              </p>

              <p className="mt-1 text-lg font-semibold text-slate-900">
                {numberText(
                  summary.averageTemperatureC,
                  1,
                )}{" "}
                °C
              </p>
            </div>

            <div className="rounded-lg bg-white p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Rainfall
              </p>

              <p className="mt-1 text-lg font-semibold text-slate-900">
                {numberText(
                  summary.totalPrecipitationMm,
                  1,
                )}{" "}
                mm
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg bg-white p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">
                Environmental provenance
              </p>

              <div className="mt-2 space-y-1">
                <p>
                  Source:{" "}
                  {
                    dataset.provenance
                      .source
                  }
                </p>

                <p>
                  Mode:{" "}
                  {
                    dataset.provenance
                      .mode
                  }
                </p>

                <p>
                  Provider:{" "}
                  {
                    dataset.provenance
                      .provider ??
                    "Not available"
                  }
                </p>

                <p>
                  Timezone:{" "}
                  {
                    dataset.provenance
                      .timezone
                  }
                </p>

                <p>
                  Grid distance:{" "}
                  {numberText(
                    dataset.provenance
                      .resolvedGridDistanceKm,
                    2,
                  )}{" "}
                  km
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-white p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">
                Quality
              </p>

              <div className="mt-2 space-y-1">
                <p>
                  Coverage:{" "}
                  {numberText(
                    dataset.quality
                      .coveragePercent,
                    1,
                  )}
                  %
                </p>

                <p>
                  Missing values:{" "}
                  {
                    dataset.quality
                      .missingValueCount
                  }
                </p>

                <p>
                  Warnings:{" "}
                  {
                    dataset.quality
                      .warnings.length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-3 text-xs text-slate-600">
            <p>
              Request:{" "}
              {shortHash(
                dataset.provenance
                  .requestFingerprint,
              )}
            </p>

            <p className="mt-1">
              Dataset:{" "}
              {shortHash(
                dataset.provenance
                  .datasetFingerprint,
              )}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
