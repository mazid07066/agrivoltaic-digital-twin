"use client";
import { useWeather } from "@/lib/weather/useWeather";
import { useState } from "react";
import {
  CloudRain,
  CloudSun,
  LoaderCircle,
  MapPin,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react";
import { getWeatherData } from "@/lib/weather/client";
import { WeatherResponse } from "@/types/weather";

export default function WeatherTestPage() {
  const [latitude, setLatitude] = useState(23.8103);
  const [longitude, setLongitude] = useState(90.4125);
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const [weather, setWeather] =
    useState<WeatherResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadWeather() {
    setLoading(true);
    setError("");

    try {
      const response = await getWeatherData({
        latitude,
        longitude,
        date,
      });

      setWeather(response);
    } catch (requestError) {
      setWeather(null);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Weather request failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="weather-test-page">
      <section className="weather-test-card">
        <div className="weather-test-heading">
          <div>
            <span className="eyebrow">Phase 3A</span>
            <h1>Weather service verification</h1>
            <p>
              Verify the selected site before connecting weather
              data to the digital-twin simulation.
            </p>
          </div>

          <CloudSun size={40} />
        </div>

        <div className="weather-test-form">
          <label className="field">
            <span>Latitude</span>
            <input
              type="number"
              min={-90}
              max={90}
              step={0.0001}
              value={latitude}
              onChange={(event) =>
                setLatitude(Number(event.target.value))
              }
            />
          </label>

          <label className="field">
            <span>Longitude</span>
            <input
              type="number"
              min={-180}
              max={180}
              step={0.0001}
              value={longitude}
              onChange={(event) =>
                setLongitude(Number(event.target.value))
              }
            />
          </label>

          <label className="field">
            <span>Date</span>
            <input
              type="date"
              value={date}
              onChange={(event) =>
                setDate(event.target.value)
              }
            />
          </label>

          <button
            className="weather-load-button"
            onClick={loadWeather}
            disabled={loading}
          >
            {loading ? (
              <LoaderCircle
                className="weather-spinner"
                size={18}
              />
            ) : (
              <CloudSun size={18} />
            )}

            {loading ? "Loading…" : "Load real weather"}
          </button>
        </div>

        {error && (
          <div className="weather-error">
            <strong>Weather request failed</strong>
            <p>{error}</p>
          </div>
        )}

        {weather && (
          <>
            <div className="weather-location">
              <MapPin size={18} />

              <div>
                <strong>
                  {weather.summary.latitude.toFixed(4)}°,{" "}
                  {weather.summary.longitude.toFixed(4)}°
                </strong>

                <span>
                  {weather.summary.date} •{" "}
                  {weather.summary.timezone}
                </span>
              </div>
            </div>

            <section className="weather-test-metrics">
              <article>
                <Sun size={23} />
                <span>Daily GHI</span>
                <strong>
                  {weather.summary.dailyGHI.toFixed(2)} kWh/m²
                </strong>
              </article>

              <article>
                <Thermometer size={23} />
                <span>Temperature</span>
                <strong>
                  {weather.summary.minimumTemperature.toFixed(1)}
                  –{weather.summary.maximumTemperature.toFixed(1)}
                  °C
                </strong>
              </article>

              <article>
                <CloudRain size={23} />
                <span>Precipitation</span>
                <strong>
                  {weather.summary.totalPrecipitation.toFixed(1)} mm
                </strong>
              </article>

              <article>
                <Wind size={23} />
                <span>Maximum wind</span>
                <strong>
                  {weather.summary.maximumWindSpeed.toFixed(1)} km/h
                </strong>
              </article>
            </section>

            <div className="weather-table-wrapper">
              <table className="weather-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>GHI</th>
                    <th>DNI</th>
                    <th>DHI</th>
                    <th>Temperature</th>
                    <th>Humidity</th>
                    <th>Cloud</th>
                    <th>Wind</th>
                  </tr>
                </thead>

                <tbody>
                  {weather.hourly.map((point) => (
                    <tr key={point.time}>
                      <td>{point.hour}</td>
                      <td>{point.shortwaveRadiation} W/m²</td>
                      <td>
                        {point.directNormalIrradiance} W/m²
                      </td>
                      <td>{point.diffuseRadiation} W/m²</td>
                      <td>{point.temperature}°C</td>
                      <td>{point.relativeHumidity}%</td>
                      <td>{point.cloudCover}%</td>
                      <td>{point.windSpeed} km/h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}