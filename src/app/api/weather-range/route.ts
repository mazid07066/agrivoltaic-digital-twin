import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  buildOpenMeteoRangeUrl,
  normalizeOpenMeteoRange,
} from "@/lib/weather/openMeteoRange.server";

import {
  addUtcDays,
  planOpenMeteoRange,
} from "@/lib/weather/range";

import type {
  OpenMeteoRangePayload,
} from "@/lib/weather/openMeteoRange.server";

import type {
  WeatherRangeResponse,
} from "@/types/weather";

const WEATHER_FETCH_ATTEMPTS =
  3;

const WEATHER_FETCH_TIMEOUT_MS =
  20_000;

async function fetchWeatherWithRetry(
  url:
    string,
): Promise<Response> {
  let lastError:
    unknown = null;

  for (
    let attempt = 1;
    attempt <=
      WEATHER_FETCH_ATTEMPTS;
    attempt += 1
  ) {
    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () =>
          controller.abort(),
        WEATHER_FETCH_TIMEOUT_MS,
      );

    try {
      const response =
        await fetch(
          url,
          {
            headers: {
              Accept:
                "application/json",
            },

            cache:
              "no-store",

            signal:
              controller.signal,
          },
        );

      if (
        response.ok ||
        response.status < 500 ||
        attempt ===
          WEATHER_FETCH_ATTEMPTS
      ) {
        return response;
      }

      lastError =
        new Error(
          `Open-Meteo returned HTTP ${response.status}.`,
        );
    } catch (error) {
      lastError =
        error;
    } finally {
      clearTimeout(
        timeout,
      );
    }

    await new Promise<void>(
      (
        resolve,
      ) => {
        setTimeout(
          resolve,
          attempt * 300,
        );
      },
    );
  }

  throw (
    lastError instanceof Error
      ? lastError
      : new Error(
          "Open-Meteo request failed.",
        )
  );
}

function validCoordinate(
  value:
    number,

  minimum:
    number,

  maximum:
    number,
): boolean {
  return (
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum
  );
}

function enumerateDates(
  startDate:
    string,

  endDate:
    string,
): string[] {
  const dates:
    string[] = [];

  let date =
    startDate;

  while (date <= endDate) {
    dates.push(date);

    date =
      addUtcDays(
        date,
        1,
      );
  }

  return dates;
}

export async function GET(
  request:
    NextRequest,
) {
  const searchParams =
    request.nextUrl.searchParams;

  const latitude =
    Number(
      searchParams.get(
        "latitude",
      ),
    );

  const longitude =
    Number(
      searchParams.get(
        "longitude",
      ),
    );

  const startDate =
    searchParams.get(
      "startDate",
    ) ?? "";

  const endDate =
    searchParams.get(
      "endDate",
    ) ?? "";

  if (
    !validCoordinate(
      latitude,
      -90,
      90,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Latitude must be between -90 and 90.",
      },
      {
        status:
          400,
      },
    );
  }

  if (
    !validCoordinate(
      longitude,
      -180,
      180,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Longitude must be between -180 and 180.",
      },
      {
        status:
          400,
      },
    );
  }

  const todayDate =
    new Date()
      .toISOString()
      .slice(0, 10);

  let plan;

  try {
    plan =
      planOpenMeteoRange({
        startDate,
        endDate,
        todayDate,
      });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Invalid weather date range.",
      },
      {
        status:
          400,
      },
    );
  }

  try {
    const segmentDays =
      await Promise.all(
        plan.segments.map(
          async (
            segment,
          ) => {
            const url =
              buildOpenMeteoRangeUrl({
                latitude,
                longitude,
                segment,
              });

            const response =
              await fetchWeatherWithRetry(
                url.toString(),
              );

            if (!response.ok) {
              const details =
                await response.text();

              throw new Error(
                `Open-Meteo ${segment.source} request failed with HTTP ${response.status}. ${details}`,
              );
            }

            const payload =
              (
                await response.json()
              ) as OpenMeteoRangePayload;

            if (
              !payload.hourly
                ?.time?.length ||
              !payload.daily
                ?.time?.length
            ) {
              throw new Error(
                `Open-Meteo returned no ${segment.source} hourly weather records.`,
              );
            }

            return normalizeOpenMeteoRange(
              payload,
              segment,
            );
          },
        ),
      );

    const days =
      segmentDays
        .flat()
        .sort(
          (
            left,
            right,
          ) =>
            left.date.localeCompare(
              right.date,
            ),
        );

    const returnedDates =
      new Set(
        days.map(
          (
            day,
          ) =>
            day.date,
        ),
      );

    const missingDates =
      enumerateDates(
        startDate,
        endDate,
      ).filter(
        (
          date,
        ) =>
          !returnedDates.has(
            date,
          ),
      );

    const response:
      WeatherRangeResponse = {
      schema:
        "agritwin-weather-range-v1",

      plan,

      days,

      warnings:
        missingDates.length > 0
          ? [
              `Open-Meteo returned no records for ${missingDates.length} requested date(s).`,
            ]
          : [],
    };

    return NextResponse.json(
      response,
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          "Open-Meteo could not provide the requested weather range.",

        details:
          error instanceof Error
            ? error.message
            : "Unknown Open-Meteo error.",
      },
      {
        status:
          502,
      },
    );
  }
}
