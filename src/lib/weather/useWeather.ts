"use client";

import { useEffect, useState } from "react";
import { getWeatherData } from "./client";
import { WeatherResponse } from "@/types/weather";

interface UseWeatherParameters {
  latitude: number;
  longitude: number;
  date: string;
}

interface UseWeatherResult {
  weather: WeatherResponse | null;
  loading: boolean;
  error: string;
  reload: () => void;
}

export function useWeather({
  latitude,
  longitude,
  date,
}: UseWeatherParameters): UseWeatherResult {
  const [weather, setWeather] =
    useState<WeatherResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestNumber, setRequestNumber] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadWeather() {
      setLoading(true);
      setError("");

      try {
        const response = await getWeatherData({
          latitude,
          longitude,
          date,
        });

        if (!controller.signal.aborted) {
          setWeather(response);
        }
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setWeather(null);

          setError(
            requestError instanceof Error
              ? requestError.message
              : "Weather data could not be loaded.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    const timeout = window.setTimeout(loadWeather, 500);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [
    latitude,
    longitude,
    date,
    requestNumber,
  ]);

  return {
    weather,
    loading,
    error,
    reload: () =>
      setRequestNumber((current) => current + 1),
  };
}