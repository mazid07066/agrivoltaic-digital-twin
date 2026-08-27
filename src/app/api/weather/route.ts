import { NextRequest, NextResponse } from "next/server";
import {
  WeatherHourlyPoint,
  WeatherResponse,
} from "@/types/weather";

interface OpenMeteoHourly {
  time: string[];
  shortwave_radiation: Array<number | null>;
  direct_normal_irradiance: Array<number | null>;
  diffuse_radiation: Array<number | null>;
  temperature_2m: Array<number | null>;
  relative_humidity_2m: Array<number | null>;
  cloud_cover: Array<number | null>;
  wind_speed_10m: Array<number | null>;
  precipitation: Array<number | null>;
}

interface OpenMeteoDaily {
  time: string[];
  sunrise: string[];
  sunset: string[];
  temperature_2m_max: Array<number | null>;
  temperature_2m_min: Array<number | null>;
  precipitation_sum: Array<number | null>;
  wind_speed_10m_max: Array<number | null>;
}

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  hourly: OpenMeteoHourly;
  daily: OpenMeteoDaily;
}

function numericValue(
  values: Array<number | null> | undefined,
  index: number,
): number {
  const value = values?.[index];

  return typeof value === "number" && Number.isFinite(value)
    ? value
    : 0;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) /
    values.length;
}

function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(new Date(`${date}T00:00:00Z`).getTime());
}

function differenceInDays(first: Date, second: Date): number {
  const millisecondsPerDay = 86_400_000;

  return Math.floor(
    (first.getTime() - second.getTime()) / millisecondsPerDay,
  );
}

const WEATHER_FETCH_ATTEMPTS = 3;
const WEATHER_FETCH_TIMEOUT_MS = 12_000;

async function fetchWeatherWithRetry(
  url: string,
): Promise<Response> {
  let lastError: unknown = null;

  for (
    let attempt = 1;
    attempt <= WEATHER_FETCH_ATTEMPTS;
    attempt += 1
  ) {
    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      WEATHER_FETCH_TIMEOUT_MS,
    );

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
        signal: controller.signal,
      });

      if (
        response.ok ||
        response.status < 500 ||
        attempt === WEATHER_FETCH_ATTEMPTS
      ) {
        return response;
      }

      lastError = new Error(
        `Open-Meteo returned HTTP ${response.status}.`,
      );
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, attempt * 300);
    });
  }

  throw (
    lastError instanceof Error
      ? lastError
      : new Error("Open-Meteo request failed.")
  );
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const latitude = Number(searchParams.get("latitude"));
    const longitude = Number(searchParams.get("longitude"));
    const requestedDate = searchParams.get("date");

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      return NextResponse.json(
        {
          error: "Latitude must be a number between -90 and 90.",
        },
        { status: 400 },
      );
    }

    if (
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        {
          error: "Longitude must be a number between -180 and 180.",
        },
        { status: 400 },
      );
    }

    if (!requestedDate || !isValidDate(requestedDate)) {
      return NextResponse.json(
        {
          error: "Date must use the YYYY-MM-DD format.",
        },
        { status: 400 },
      );
    }

    const selectedDate = new Date(`${requestedDate}T00:00:00Z`);
    const todayText = new Date().toISOString().slice(0, 10);
    const today = new Date(`${todayText}T00:00:00Z`);
    const dayDifference = differenceInDays(selectedDate, today);

    /*
     * Open-Meteo's forecast endpoint handles recent dates and
     * near-future dates. Its archive endpoint handles older dates.
     */
    const isHistorical = dayDifference < -5;

    if (dayDifference > 15) {
      return NextResponse.json(
        {
          error:
            "The selected date is outside the available forecast period.",
          details:
            "Select a date no more than 15 days in the future.",
        },
        { status: 400 },
      );
    }

    const baseUrl = isHistorical
      ? "https://archive-api.open-meteo.com/v1/archive"
      : "https://api.open-meteo.com/v1/forecast";

    const weatherUrl = new URL(baseUrl);

    weatherUrl.searchParams.set("latitude", latitude.toString());
    weatherUrl.searchParams.set("longitude", longitude.toString());
    weatherUrl.searchParams.set("start_date", requestedDate);
    weatherUrl.searchParams.set("end_date", requestedDate);
    weatherUrl.searchParams.set("timezone", "auto");
    weatherUrl.searchParams.set("wind_speed_unit", "ms");

    weatherUrl.searchParams.set(
      "hourly",
      [
        "shortwave_radiation",
        "direct_normal_irradiance",
        "diffuse_radiation",
        "temperature_2m",
        "relative_humidity_2m",
        "cloud_cover",
        "wind_speed_10m",
        "precipitation",
      ].join(","),
    );

    weatherUrl.searchParams.set(
      "daily",
      [
        "sunrise",
        "sunset",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_sum",
        "wind_speed_10m_max",
      ].join(","),
    );

    const weatherRequest =
      await fetchWeatherWithRetry(
        weatherUrl.toString(),
      );

    if (!weatherRequest.ok) {
      const responseText = await weatherRequest.text();

      return NextResponse.json(
        {
          error: "Open-Meteo could not provide weather data.",
          details: responseText,
        },
        { status: weatherRequest.status },
      );
    }

    const weather =
      (await weatherRequest.json()) as OpenMeteoResponse;

    if (!weather.hourly?.time?.length) {
      return NextResponse.json(
        {
          error: "No hourly weather data was returned.",
        },
        { status: 502 },
      );
    }

    const hourly: WeatherHourlyPoint[] =
      weather.hourly.time.map((time, index) => ({
        time,
        hour: time.slice(11, 16),
        shortwaveRadiation: numericValue(
          weather.hourly.shortwave_radiation,
          index,
        ),
        directNormalIrradiance: numericValue(
          weather.hourly.direct_normal_irradiance,
          index,
        ),
        diffuseRadiation: numericValue(
          weather.hourly.diffuse_radiation,
          index,
        ),
        temperature: numericValue(
          weather.hourly.temperature_2m,
          index,
        ),
        relativeHumidity: numericValue(
          weather.hourly.relative_humidity_2m,
          index,
        ),
        cloudCover: numericValue(
          weather.hourly.cloud_cover,
          index,
        ),
        windSpeed: numericValue(
          weather.hourly.wind_speed_10m,
          index,
        ),
        precipitation: numericValue(
          weather.hourly.precipitation,
          index,
        ),
      }));

    /*
     * Open-Meteo provides hourly mean shortwave radiation in W/m².
     * Summing 24 hourly means gives daily irradiation in Wh/m².
     * Dividing by 1000 produces kWh/m²/day.
     */
    const dailyGHI =
      hourly.reduce(
        (total, point) =>
          total + point.shortwaveRadiation,
        0,
      ) / 1000;

    const response: WeatherResponse = {
      summary: {
        date: requestedDate,
        latitude: weather.latitude,
        longitude: weather.longitude,
        timezone: weather.timezone,
        sunrise: weather.daily.sunrise[0],
        sunset: weather.daily.sunset[0],
        maximumTemperature: numericValue(
          weather.daily.temperature_2m_max,
          0,
        ),
        minimumTemperature: numericValue(
          weather.daily.temperature_2m_min,
          0,
        ),
        totalPrecipitation: numericValue(
          weather.daily.precipitation_sum,
          0,
        ),
        maximumWindSpeed: numericValue(
          weather.daily.wind_speed_10m_max,
          0,
        ),
        averageCloudCover: average(
          hourly.map((point) => point.cloudCover),
        ),
        dailyGHI,
        source: "Open-Meteo",
      },
      hourly,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Weather API error:", error);

    return NextResponse.json(
      {
        error: "Unexpected weather service error.",
        details:
          error instanceof Error
            ? error.message
            : "Unknown server error",
      },
      { status: 500 },
    );
  }
}
