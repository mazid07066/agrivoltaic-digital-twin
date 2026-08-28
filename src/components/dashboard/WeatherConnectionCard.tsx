"use client";

import {
  CloudRain,
  CloudSun,
  Droplets,
  LoaderCircle,
  RefreshCcw,
  Sun,
  Thermometer,
  Wifi,
  WifiOff,
  Wind,
} from "lucide-react";
import { WeatherResponse } from "@/types/weather";

interface WeatherConnectionCardProps {
  weather: WeatherResponse | null;
  loading: boolean;
  error: string;
  selectedHour: number;
  onRefresh: () => void;
}

export default function WeatherConnectionCard({
  weather,
  loading,
  error,
  selectedHour,
  onRefresh,
}: WeatherConnectionCardProps) {
  const currentPoint =
    weather?.hourly[selectedHour] ?? null;

  if (loading) {
    return (
      <section className="weather-card weather-card-loading">
        <div className="weather-loading-content">
          <LoaderCircle
            className="weather-spinner"
            size={27}
          />

          <div>
            <strong>Loading weather</strong>
            <span>
              Retrieving location-specific atmospheric data…
            </span>
          </div>
        </div>
      </section>
    );
  }

  if (error || !weather) {
    return (
      <section className="weather-card weather-card-error">
        <div className="weather-error-content">
          <WifiOff size={27} />

          <div>
            <strong>Weather data unavailable</strong>
            <span>
              {error || "No weather response was received."}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="weather-refresh-button"
          onClick={onRefresh}
        >
          <RefreshCcw size={16} />
          Try again
        </button>
      </section>
    );
  }

  return (
    <section className="weather-card">
      <div className="weather-card-header">
        <div className="weather-source">
          <div className="weather-source-icon">
            <CloudSun size={25} />
          </div>

          <div>
            <div className="weather-source-status">
              <span className="weather-live-dot" />
              <strong>Open-Meteo connected</strong>
            </div>

            <p>
              Location-specific weather for{" "}
              {weather.summary.date}
            </p>
          </div>
        </div>

        <div className="weather-card-actions">
          <div className="weather-time-badge">
            <Wifi size={14} />
            Weather model
          </div>

          <button
            type="button"
            className="weather-refresh-button"
            onClick={onRefresh}
          >
            <RefreshCcw size={15} />
            Refresh
          </button>
        </div>
      </div>

      <div className="weather-card-grid">
        <article className="weather-value-card solar">
          <div className="weather-value-icon">
            <Sun size={20} />
          </div>

          <div>
            <span>Daily solar resource</span>

            <strong>
              {weather.summary.dailyGHI.toFixed(2)}
              <small> kWh/m²</small>
            </strong>

            <p>Global horizontal irradiation</p>
          </div>
        </article>

        <article className="weather-value-card temperature">
          <div className="weather-value-icon">
            <Thermometer size={20} />
          </div>

          <div>
            <span>Temperature range</span>

            <strong>
              {weather.summary.minimumTemperature.toFixed(1)}
              –{weather.summary.maximumTemperature.toFixed(1)}
              <small> °C</small>
            </strong>

            <p>
              Current:{" "}
              {currentPoint
                ? `${currentPoint.temperature.toFixed(1)}°C`
                : "Unavailable"}
            </p>
          </div>
        </article>

        <article className="weather-value-card cloud">
          <div className="weather-value-icon">
            <CloudSun size={20} />
          </div>

          <div>
            <span>Cloud cover</span>

            <strong>
              {currentPoint?.cloudCover !== null && currentPoint?.cloudCover !== undefined
                ? currentPoint.cloudCover.toFixed(0)
                : weather.summary.averageCloudCover !== null
                  ? weather.summary.averageCloudCover.toFixed(0)
                  : "N/A"}
              {currentPoint?.cloudCover !== null && weather.summary.averageCloudCover !== null ? <small> %</small> : null}
            </strong>

            <p>
              Daily average:{" "}
              {weather.summary.averageCloudCover !== null
                ? `${weather.summary.averageCloudCover.toFixed(0)}%`
                : "N/A"}
            </p>
          </div>
        </article>

        <article className="weather-value-card humidity">
          <div className="weather-value-icon">
            <Droplets size={20} />
          </div>

          <div>
            <span>Relative humidity</span>

            <strong>
              {currentPoint
                ? currentPoint.relativeHumidity.toFixed(0)
                : "—"}
              <small> %</small>
            </strong>

            <p>At the selected simulation hour</p>
          </div>
        </article>

        <article className="weather-value-card wind">
          <div className="weather-value-icon">
            <Wind size={20} />
          </div>

          <div>
            <span>Maximum wind</span>

            <strong>
              {weather.summary.maximumWindSpeed.toFixed(1)}
              <small> km/h</small>
            </strong>

            <p>Panel safety consideration</p>
          </div>
        </article>

        <article className="weather-value-card rain">
          <div className="weather-value-icon">
            <CloudRain size={20} />
          </div>

          <div>
            <span>Daily precipitation</span>

            <strong>
              {weather.summary.totalPrecipitation.toFixed(1)}
              <small> mm</small>
            </strong>

            <p>Potential irrigation contribution</p>
          </div>
        </article>
      </div>
    </section>
  );
}
