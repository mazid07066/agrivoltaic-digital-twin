import {
  WeatherApiError,
  WeatherResponse,
} from "@/types/weather";

interface WeatherRequest {
  latitude: number;
  longitude: number;
  date: string;
}

export async function getWeatherData({
  latitude,
  longitude,
  date,
}: WeatherRequest): Promise<WeatherResponse> {
  const parameters = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    date,
  });

  const response = await fetch(
    `/api/weather?${parameters.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  const data = (await response.json()) as
    | WeatherResponse
    | WeatherApiError;

  if (!response.ok || "error" in data) {
    const errorData = data as WeatherApiError;

    throw new Error(
      errorData.details
        ? `${errorData.error} ${errorData.details}`
        : errorData.error,
    );
  }

  return data;
}