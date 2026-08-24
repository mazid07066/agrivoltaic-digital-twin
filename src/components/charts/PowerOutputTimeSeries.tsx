"use client";

import {
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  runFlatRoofSimulation,
} from "@/lib/rooftop/simulation";

import {
  runLandAgrivoltaicSimulation,
} from "@/lib/sites/adapters/landAgrivoltaic";

import {
  chunkDateRange,
  summarizePowerSeries,
} from "@/lib/powerSeries/range";

import {
  getWeatherRange,
} from "@/lib/weather/rangeClient";

import {
  addUtcDays,
  OPEN_METEO_EARLIEST_DATE,
  OPEN_METEO_MAX_FUTURE_DAYS,
} from "@/lib/weather/range";

import type {
  FlatRoofSiteProfile,
  LandAgrivoltaicSiteProfile,
} from "@/lib/sites/schema";

import type {
  DailyPowerPoint,
  HourlyPowerPoint,
  PowerSeriesMode,
} from "@/types/powerSeries";

import type {
  WeatherRangeDay,
} from "@/types/weather";

type PowerOutputTimeSeriesProps =
  | {
      siteKind:
        "land";

      site:
        LandAgrivoltaicSiteProfile;
    }
  | {
      siteKind:
        "rooftop";

      site:
        FlatRoofSiteProfile;
    };

function localDateText():
  string {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1,
    ).padStart(
      2,
      "0",
    );

  const day =
    String(
      now.getDate(),
    ).padStart(
      2,
      "0",
    );

  return `${year}-${month}-${day}`;
}

function simulatePowerDay(
  props:
    PowerOutputTimeSeriesProps,

  day:
    WeatherRangeDay,
): {
  daily:
    DailyPowerPoint;

  hourly:
    HourlyPowerPoint[];
} {
  if (
    props.siteKind ===
    "land"
  ) {
    const result =
      runLandAgrivoltaicSimulation(
        {
          ...props.site,

          simulationDate:
            day.date,
        },
        day.weather,
      );

    const hourly =
      result.hourly.map(
        (
          point,
        ) => ({
          hour:
            point.hour,

          powerKw:
            point.pvPower,
        }),
      );

    return {
      daily: {
        date:
          day.date,

        dailyEnergyKWh:
          result.dailyEnergyKWh,

        peakPowerKw:
          hourly.reduce(
            (
              maximum,
              point,
            ) =>
              Math.max(
                maximum,
                point.powerKw,
              ),
            0,
          ),

        source:
          day.source,
      },

      hourly,
    };
  }

  const result =
    runFlatRoofSimulation(
      {
        ...props.site,

        simulationDate:
          day.date,
      },
      day.weather,
    );

  const hourly =
    result.hourly.map(
      (
        point,
      ) => ({
        hour:
          point.hour,

        powerKw:
          point.dcPowerKW,
      }),
    );

  return {
    daily: {
      date:
        day.date,

      dailyEnergyKWh:
        result.dailyEnergyKWh,

      peakPowerKw:
        hourly.reduce(
          (
            maximum,
            point,
          ) =>
            Math.max(
              maximum,
              point.powerKw,
            ),
          0,
        ),

      source:
        day.source,
    },

    hourly,
  };
}

function dateTick(
  value:
    string,
): string {
  const date =
    new Date(
      `${value}T00:00:00Z`,
    );

  return date.toLocaleDateString(
    undefined,
    {
      month:
        "short",

      day:
        "numeric",

      ...(value.endsWith("-01-01")
        ? {
            year:
              "2-digit" as const,
          }
        : {}),
    },
  );
}

function sourceLabel(
  source:
    string,
): string {
  if (source === "mixed") {
    return "Historical + forecast";
  }

  if (source === "forecast") {
    return "Forecast";
  }

  return "Historical";
}

export default function PowerOutputTimeSeries(
  props:
    PowerOutputTimeSeriesProps,
) {
  const today =
    useMemo(
      () =>
        localDateText(),
      [],
    );

  const latestForecastDate =
    useMemo(
      () =>
        addUtcDays(
          today,
          OPEN_METEO_MAX_FUTURE_DAYS,
        ),
      [
        today,
      ],
    );

  const [
    mode,
    setMode,
  ] =
    useState<PowerSeriesMode>(
      "day",
    );

  const [
    startDate,
    setStartDate,
  ] =
    useState(
      props.site.simulationDate,
    );

  const [
    endDate,
    setEndDate,
  ] =
    useState(
      props.site.simulationDate,
    );

  const [
    dailyPoints,
    setDailyPoints,
  ] =
    useState<
      DailyPowerPoint[]
    >([]);

  const [
    hourlyPoints,
    setHourlyPoints,
  ] =
    useState<
      HourlyPowerPoint[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    progress,
    setProgress,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    warnings,
    setWarnings,
  ] =
    useState<
      string[]
    >([]);

  const abortRef =
    useRef<
      AbortController |
      null
    >(null);

  const summary =
    useMemo(
      () =>
        summarizePowerSeries(
          dailyPoints,
        ),
      [
        dailyPoints,
      ],
    );

  function chooseDay(
    date:
      string,
  ) {
    setMode(
      "day",
    );

    setStartDate(
      date,
    );

    setEndDate(
      date,
    );
  }

  function chooseRange(
    days:
      number,
  ) {
    setMode(
      "range",
    );

    setEndDate(
      today,
    );

    setStartDate(
      addUtcDays(
        today,
        -(days - 1),
      ),
    );
  }

  async function loadSeries() {
    abortRef.current?.abort();

    const controller =
      new AbortController();

    abortRef.current =
      controller;

    const requestedEndDate =
      mode === "day"
        ? startDate
        : endDate;

    setLoading(
      true,
    );

    setError(
      "",
    );

    setWarnings(
      [],
    );

    setDailyPoints(
      [],
    );

    setHourlyPoints(
      [],
    );

    try {
      const chunks =
        chunkDateRange({
          startDate,

          endDate:
            requestedEndDate,

          maximumDays:
            31,
        });

      const collected:
        DailyPowerPoint[] = [];

      const collectedWarnings:
        string[] = [];

      let selectedHourly:
        HourlyPowerPoint[] = [];

      for (
        let index = 0;
        index < chunks.length;
        index += 1
      ) {
        const chunk =
          chunks[index];

        setProgress(
          `Loading weather batch ${index + 1} of ${chunks.length}…`,
        );

        const response =
          await getWeatherRange({
            latitude:
              props.site
                .location
                .latitude,

            longitude:
              props.site
                .location
                .longitude,

            startDate:
              chunk.startDate,

            endDate:
              chunk.endDate,

            signal:
              controller.signal,
          });

        collectedWarnings.push(
          ...response.warnings,
        );

        for (
          const day of
          response.days
        ) {
          const simulated =
            simulatePowerDay(
              props,
              day,
            );

          collected.push(
            simulated.daily,
          );

          if (
            mode === "day"
          ) {
            selectedHourly =
              simulated.hourly;
          }
        }

        /*
         * Allow React to repaint between larger
         * simulation batches.
         */
        await new Promise<void>(
          (
            resolve,
          ) => {
            window.setTimeout(
              resolve,
              0,
            );
          },
        );
      }

      collected.sort(
        (
          left,
          right,
        ) =>
          left.date.localeCompare(
            right.date,
          ),
      );

      if (
        collected.length === 0
      ) {
        throw new Error(
          "No power-series records were generated.",
        );
      }

      setDailyPoints(
        collected,
      );

      setHourlyPoints(
        selectedHourly,
      );

      setWarnings(
        collectedWarnings,
      );
    } catch (requestError) {
      if (
        !controller.signal
          .aborted
      ) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Power-series data could not be generated.",
        );
      }
    } finally {
      if (
        !controller.signal
          .aborted
      ) {
        setLoading(
          false,
        );

        setProgress(
          "",
        );
      }
    }
  }

  /*
   * Recharts receives one stable data shape for both
   * hourly-power and daily-energy display modes.
   */
  const chartData =
    mode === "day"
      ? hourlyPoints.map(
          (
            point,
          ) => ({
            label:
              point.hour,

            value:
              point.powerKw,
          }),
        )
      : dailyPoints.map(
          (
            point,
          ) => ({
            label:
              point.date,

            value:
              point.dailyEnergyKWh,
          }),
        );

  const hasData =
    chartData.length > 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
            Open-Meteo power series
          </span>

          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            PV power history and forecast
          </h2>

          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            View hourly modeled power for one day or daily
            modeled energy across a selected historical and
            forecast range. Existing digital-twin outputs
            remain unchanged.
          </p>
        </div>

        {hasData ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            {sourceLabel(
              summary.source,
            )}
          </span>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            chooseDay(
              today,
            )
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Today
        </button>

        <button
          type="button"
          onClick={() =>
            chooseDay(
              props.site
                .simulationDate,
            )
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Configured date
        </button>

        <button
          type="button"
          onClick={() =>
            chooseRange(
              7,
            )
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Last 7 days
        </button>

        <button
          type="button"
          onClick={() =>
            chooseRange(
              30,
            )
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Last 30 days
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[auto_1fr_1fr_auto] md:items-end">
        <label className="space-y-1 text-xs text-slate-700">
          <span className="font-medium">
            Display
          </span>

          <select
            value={mode}
            onChange={(
              event,
            ) => {
              const nextMode =
                event.target.value as
                  PowerSeriesMode;

              setMode(
                nextMode,
              );

              if (
                nextMode ===
                "day"
              ) {
                setEndDate(
                  startDate,
                );
              }
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="day">
              One-day hourly power
            </option>

            <option value="range">
              Date-range daily energy
            </option>
          </select>
        </label>

        <label className="space-y-1 text-xs text-slate-700">
          <span className="font-medium">
            {mode === "day"
              ? "Date"
              : "Start date"}
          </span>

          <input
            type="date"
            min={
              OPEN_METEO_EARLIEST_DATE
            }
            max={
              latestForecastDate
            }
            value={
              startDate
            }
            onChange={(
              event,
            ) => {
              setStartDate(
                event.target.value,
              );

              if (
                mode ===
                "day"
              ) {
                setEndDate(
                  event.target.value,
                );
              }
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-xs text-slate-700">
          <span className="font-medium">
            End date
          </span>

          <input
            type="date"
            min={
              startDate
            }
            max={
              latestForecastDate
            }
            value={
              mode === "day"
                ? startDate
                : endDate
            }
            disabled={
              mode === "day"
            }
            onChange={(
              event,
            ) =>
              setEndDate(
                event.target.value,
              )
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100"
          />
        </label>

        <button
          type="button"
          onClick={
            loadSeries
          }
          disabled={
            loading ||
            !startDate ||
            (
              mode === "range" &&
              !endDate
            )
          }
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading
            ? "Loading…"
            : "Generate graph"}
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Historical coverage begins{" "}
        {OPEN_METEO_EARLIEST_DATE}. Forecast availability
        currently ends{" "}
        {latestForecastDate}.
      </p>

      {progress ? (
        <p className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          {progress}
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {warnings.map(
        (
          warning,
        ) => (
          <p
            key={
              warning
            }
            className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
          >
            {warning}
          </p>
        ),
      )}

      {hasData ? (
        <>
          <dl className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-xs text-slate-500">
                Days
              </dt>

              <dd className="mt-1 font-semibold text-slate-900">
                {summary.dayCount}
              </dd>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-xs text-slate-500">
                Total energy
              </dt>

              <dd className="mt-1 font-semibold text-slate-900">
                {summary.totalEnergyKWh.toFixed(
                  1,
                )}{" "}
                kWh
              </dd>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-xs text-slate-500">
                Average/day
              </dt>

              <dd className="mt-1 font-semibold text-slate-900">
                {summary.averageDailyEnergyKWh.toFixed(
                  1,
                )}{" "}
                kWh
              </dd>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-xs text-slate-500">
                Peak daily energy
              </dt>

              <dd className="mt-1 font-semibold text-slate-900">
                {summary.peakDailyEnergyKWh.toFixed(
                  1,
                )}{" "}
                kWh
              </dd>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-xs text-slate-500">
                Peak power
              </dt>

              <dd className="mt-1 font-semibold text-slate-900">
                {summary.peakPowerKw.toFixed(
                  2,
                )}{" "}
                kW
              </dd>
            </div>
          </dl>

          <div className="mt-5 h-80 w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={
                  chartData
                }
                margin={{
                  top:
                    12,

                  right:
                    24,

                  left:
                    8,

                  bottom:
                    8,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#dbe5dc"
                />

                <XAxis
                  dataKey="label"
                  tick={{
                    fontSize:
                      11,

                    fill:
                      "#52645a",
                  }}
                  tickFormatter={(
                    value,
                  ) =>
                    mode === "day"
                      ? String(
                          value,
                        )
                      : dateTick(
                          String(
                            value,
                          ),
                        )
                  }
                  minTickGap={
                    28
                  }
                />

                <YAxis
                  tick={{
                    fontSize:
                      11,

                    fill:
                      "#52645a",
                  }}
                  width={
                    72
                  }
                  unit={
                    mode === "day"
                      ? " kW"
                      : " kWh"
                  }
                />

                <Tooltip
                  labelFormatter={(
                    label,
                  ) =>
                    mode === "day"
                      ? String(
                          label ?? "",
                        )
                      : dateTick(
                          String(
                            label ?? "",
                          ),
                        )
                  }
                  contentStyle={{
                    borderRadius:
                      "12px",

                    border:
                      "1px solid #dbe5dc",
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="value"
                  name={
                    mode === "day"
                      ? "PV power"
                      : "Daily PV energy"
                  }
                  unit={
                    mode === "day"
                      ? " kW"
                      : " kWh"
                  }
                  stroke="#047857"
                  strokeWidth={
                    2.5
                  }
                  dot={
                    chartData.length <=
                    31
                  }
                  activeDot={{
                    r:
                      5,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="mt-5 flex min-h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          Choose a date or range and generate the power-output graph.
        </div>
      )}
    </section>
  );
}
