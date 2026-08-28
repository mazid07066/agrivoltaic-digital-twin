import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { addUtcDays } from "./range";

import {
  FENI_COMPLETE_LOCAL_END_DATE,
  FENI_COMPLETE_LOCAL_START_DATE,
  FENI_DATASET_ID,
  FENI_DERIVATIVE_SHA256,
  FENI_STATION,
} from "./feniMeasured";

import type {
  WeatherHourlyPoint,
  WeatherRangeDay,
  WeatherRangePlan,
  WeatherRangeResponse,
} from "@/types/weather";

interface FeniHourlyRecord {
  timestampLocal: string;
  timestampUtc: string;
  point: WeatherHourlyPoint;
}

let recordPromise: Promise<Map<string, FeniHourlyRecord[]>> | null = null;

function numeric(value: string): number | null {
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function requiredNumeric(value: string, field: string, timestamp: string): number {
  const parsed = numeric(value);
  if (parsed === null) {
    throw new Error(`Measured Feni ${field} is missing at ${timestamp}.`);
  }
  return parsed;
}

async function loadRecords(): Promise<Map<string, FeniHourlyRecord[]>> {
  if (recordPromise) return recordPromise;

  recordPromise = (async () => {
    const path = join(process.cwd(), "data", "weather", "feni-bdfe2-hourly-bst-v1.csv");
    const content = await readFile(path, "utf8");
    const lines = content.trimEnd().split("\n");
    const headers = lines[0].split(",");
    const index = new Map(headers.map((header, position) => [header, position]));
    const field = (row: string[], name: string) => row[index.get(name) ?? -1] ?? "";
    const byDate = new Map<string, FeniHourlyRecord[]>();

    for (const line of lines.slice(1)) {
      const row = line.split(",");
      const timestampLocal = field(row, "timestamp_local");
      const timestampUtc = field(row, "timestamp_utc");
      const date = timestampLocal.slice(0, 10);
      const hour = timestampLocal.slice(11, 16);
      const quality = field(row, "quality_status") as WeatherHourlyPoint["qualityStatus"];

      const record: FeniHourlyRecord = {
        timestampLocal,
        timestampUtc,
        point: {
          time: timestampLocal,
          hour,
          shortwaveRadiation: requiredNumeric(field(row, "ghi_wm2"), "GHI", timestampLocal),
          directNormalIrradiance: numeric(field(row, "dni_wm2")) ?? 0,
          diffuseRadiation: numeric(field(row, "dhi_wm2")) ?? 0,
          temperature: requiredNumeric(field(row, "temperature_c"), "air temperature", timestampLocal),
          relativeHumidity: requiredNumeric(field(row, "relative_humidity_pct"), "relative humidity", timestampLocal),
          cloudCover: null,
          windSpeed: requiredNumeric(field(row, "wind_speed_ms"), "wind speed", timestampLocal),
          precipitation: requiredNumeric(field(row, "precipitation_mm"), "precipitation", timestampLocal),
          pressure: numeric(field(row, "pressure_hpa")),
          windDirection: numeric(field(row, "wind_direction_deg")),
          qualityStatus: quality,
          validSourceMinutes: Math.min(
            requiredNumeric(field(row, "ghi_valid_minutes"), "GHI completeness", timestampLocal),
            requiredNumeric(field(row, "dni_valid_minutes"), "DNI completeness", timestampLocal),
            requiredNumeric(field(row, "dhi_valid_minutes"), "DHI completeness", timestampLocal),
            requiredNumeric(field(row, "temperature_valid_minutes"), "temperature completeness", timestampLocal),
          ),
        },
      };

      const day = byDate.get(date) ?? [];
      day.push(record);
      byDate.set(date, day);
    }

    for (const records of byDate.values()) {
      records.sort((left, right) => left.timestampLocal.localeCompare(right.timestampLocal));
    }
    return byDate;
  })().catch((error) => {
    recordPromise = null;
    throw error;
  });

  return recordPromise;
}

function enumerateDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  for (let date = startDate; date <= endDate; date = addUtcDays(date, 1)) dates.push(date);
  return dates;
}

function spatialClassification(latitude: number, longitude: number): "co_located" | "spatial_transfer" {
  const tolerance = 0.01;
  return Math.abs(latitude - FENI_STATION.latitude) <= tolerance &&
    Math.abs(longitude - FENI_STATION.longitude) <= tolerance
    ? "co_located"
    : "spatial_transfer";
}

export async function getFeniMeasuredRange({
  startDate,
  endDate,
  targetLatitude,
  targetLongitude,
}: {
  startDate: string;
  endDate: string;
  targetLatitude: number;
  targetLongitude: number;
}): Promise<WeatherRangeResponse> {
  if (startDate > endDate) throw new Error("Start date must not be later than end date.");
  if (startDate < FENI_COMPLETE_LOCAL_START_DATE || endDate > FENI_COMPLETE_LOCAL_END_DATE) {
    throw new Error(
      `Feni measured weather is available only for complete Bangladesh local days ${FENI_COMPLETE_LOCAL_START_DATE} to ${FENI_COMPLETE_LOCAL_END_DATE}.`,
    );
  }

  const records = await loadRecords();
  const dates = enumerateDates(startDate, endDate);
  const warnings = new Set<string>();
  const days: WeatherRangeDay[] = dates.map((date) => {
    const dayRecords = records.get(date) ?? [];
    if (dayRecords.length !== 24) {
      throw new Error(`Feni measured weather has ${dayRecords.length} hourly records for ${date}; 24 are required.`);
    }
    const invalid = dayRecords.filter((record) => record.point.qualityStatus === "invalid");
    if (invalid.length) {
      throw new Error(
        `Feni measured weather cannot simulate ${date}: ${invalid.length} hourly record(s) have no valid DNI and/or DHI. Choose a range excluding 2017-07-07 and 2017-07-08.`,
      );
    }
    const partial = dayRecords.filter((record) => record.point.qualityStatus === "partial");
    if (partial.length) {
      warnings.add(`${date} contains ${partial.length} partial hourly measurement(s); valid-minute counts are preserved in the export.`);
    }
    const hourly = dayRecords.map((record) => record.point);
    const daylight = hourly.filter((point) => point.shortwaveRadiation > 5);
    const temperatures = hourly.map((point) => point.temperature);
    const wind = hourly.map((point) => point.windSpeed);

    return {
      date,
      source: "measured",
      weather: {
        summary: {
          date,
          latitude: FENI_STATION.latitude,
          longitude: FENI_STATION.longitude,
          timezone: "Asia/Dhaka",
          sunrise: daylight[0]?.time ?? "",
          sunset: daylight.at(-1)?.time ?? "",
          maximumTemperature: Math.max(...temperatures),
          minimumTemperature: Math.min(...temperatures),
          totalPrecipitation: hourly.reduce((sum, point) => sum + point.precipitation, 0),
          maximumWindSpeed: Math.max(...wind),
          averageCloudCover: null,
          dailyGHI: hourly.reduce((sum, point) => sum + point.shortwaveRadiation, 0) / 1000,
          source: "World Bank/ESMAP Feni BDFE2",
        },
        hourly,
      },
    };
  });

  const classification = spatialClassification(targetLatitude, targetLongitude);
  if (classification === "spatial_transfer") {
    warnings.add(
      `Measured weather is from Feni BDFE2 (${FENI_STATION.latitude}, ${FENI_STATION.longitude}), not the configured site (${targetLatitude}, ${targetLongitude}); results are classified as spatial transfer, not co-located validation.`,
    );
  }
  warnings.add("Cloud cover is not measured in this dataset and remains N/A; no Open-Meteo value is substituted.");

  const plan: WeatherRangePlan = {
    schema: "agritwin-weather-range-plan-v1",
    requestedStartDate: startDate,
    requestedEndDate: endDate,
    earliestHistoricalDate: FENI_COMPLETE_LOCAL_START_DATE,
    latestForecastDate: FENI_COMPLETE_LOCAL_END_DATE,
    source: "measured",
    segments: [],
    provider: "feni_measured",
    station: FENI_STATION,
    target: { latitude: targetLatitude, longitude: targetLongitude, classification },
    dataset: {
      id: FENI_DATASET_ID,
      license: "CC BY 4.0",
      sourceTimezone: "UTC",
      applicationTimezone: "Asia/Dhaka",
      normalizedResolution: "1 hour",
      sha256: FENI_DERIVATIVE_SHA256,
    },
  };

  return { schema: "agritwin-weather-range-v1", plan, days, warnings: [...warnings] };
}
