import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  requestOpenMeteoWithRetry,
} from "@/lib/weather/openMeteoHttp.server";

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

import {
  getFeniMeasuredRange,
} from "@/lib/weather/feniMeasuredRange.server";

export const dynamic =
  "force-dynamic";

export const maxDuration =
  30;

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
    dates.push(
      date,
    );

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

  const provider =
    searchParams.get("provider") === "feni_measured"
      ? "feni_measured"
      : "open_meteo";

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

  if (provider === "feni_measured") {
    try {
      return NextResponse.json(
        await getFeniMeasuredRange({
          startDate,
          endDate,
          targetLatitude: latitude,
          targetLongitude: longitude,
        }),
      );
    } catch (error) {
      return NextResponse.json(
        {
          error: "Feni measured weather cannot provide the requested range.",
          details: error instanceof Error ? error.message : "Unknown measured-weather error.",
          retryable: false,
        },
        { status: 422 },
      );
    }
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

        retryable:
          false,
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
              await requestOpenMeteoWithRetry({
                url:
                  url.toString(),
              });

            if (
              response.statusCode < 200 ||
              response.statusCode >= 300
            ) {
              throw new Error(
                `Open-Meteo ${segment.source} request returned HTTP ${response.statusCode}. ${response.body.slice(0, 500)}`,
              );
            }

            let payload:
              OpenMeteoRangePayload;

            try {
              payload =
                JSON.parse(
                  response.body,
                ) as OpenMeteoRangePayload;
            } catch {
              throw new Error(
                `Open-Meteo returned invalid JSON for the ${segment.source} segment.`,
              );
            }

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

    if (
      days.length === 0
    ) {
      throw new Error(
        "No weather days were returned for the requested range.",
      );
    }

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
          `The upstream weather connection failed. Please retry the request. ${
            error instanceof Error
              ? error.message
              : "Unknown Open-Meteo error."
          }`,

        retryable:
          true,
      },
      {
        status:
          502,
      },
    );
  }
}
