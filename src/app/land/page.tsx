"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import {
  Activity,
  BatteryCharging,
  BookOpen,
  ChartNoAxesCombined,
  CloudSun,
  Cloudy,
  Leaf,
  MapPin,
  PanelTop,
  RefreshCcw,
  Sprout,
  Sun,
} from "lucide-react";

import IrradianceChart from "@/components/charts/IrradianceChart";
import SpatialDLIHeatmap from "@/components/charts/SpatialDLIHeatmap";
import WeatherConnectionCard from "@/components/dashboard/WeatherConnectionCard";
import { CROP_PROFILES } from "@/lib/simulation/crops";
import { runLandAgrivoltaicSimulation, toLandSimulationConfiguration } from "@/lib/sites/adapters/landAgrivoltaic";
import { getPVModuleProfile, PV_MODULE_MANUFACTURERS, PV_MODULE_PROFILES } from "@/lib/pv/moduleProfiles";
import { useWeather } from "@/lib/weather/useWeather";
import { useSimulationStore } from "@/store/useSimulationStore";
import {
  CropId,
  TrackingMode,
} from "@/types/simulation";

const AgrivoltaicScene = dynamic(
  () => import("@/components/twin/AgrivoltaicScene"),
  {
    ssr: false,
    loading: () => (
      <div className="scene-loading">
        Preparing the three-dimensional farmâ€¦
      </div>
    ),
  },
);

interface NumericInputProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  disabled?: boolean;
}

function NumericInput({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  disabled = false,
}: NumericInputProps) {
  return (
    <label className="field">
      <span>{label}</span>

      <div className="input-with-unit">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={(event) =>
            onChange(Number(event.target.value))
          }
        />

        {unit && <small>{unit}</small>}
      </div>
    </label>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  status?: "good" | "warning" | "neutral";
}

function MetricCard({
  title,
  value,
  description,
  icon,
  status = "neutral",
}: MetricCardProps) {
  return (
    <article className={`metric-card ${status}`}>
      <div className="metric-icon">{icon}</div>

      <div>
        <p>{title}</p>
        <strong>{value}</strong>
        <small>{description}</small>
      </div>
    </article>
  );
}

export default function Home() {
  const activeSite = useSimulationStore(
    (state) => state.activeSite,
  );

  const configuration = useMemo(
    () => toLandSimulationConfiguration(activeSite),
    [activeSite],
  );

  const selectedHour = useSimulationStore(
    (state) => state.selectedHour,
  );

  const updateSite = useSimulationStore(
    (state) => state.updateSite,
  );

  const updatePV = useSimulationStore(
    (state) => state.updatePV,
  );

  const setCrop = useSimulationStore(
    (state) => state.setCrop,
  );

  const setTrackingMode = useSimulationStore(
    (state) => state.setTrackingMode,
  );
  const setModuleProfile = useSimulationStore((state) => state.setModuleProfile);

  const setSelectedHour = useSimulationStore(
    (state) => state.setSelectedHour,
  );

  const setSimulationDate = useSimulationStore(
    (state) => state.setSimulationDate,
  );

  const resetConfiguration = useSimulationStore(
    (state) => state.resetConfiguration,
  );

  const {
    weather,
    loading: weatherLoading,
    error: weatherError,
    reload: reloadWeather,
  } = useWeather({
    latitude: configuration.site.latitude,
    longitude: configuration.site.longitude,
    date: configuration.simulationDate,
  });

  const results = useMemo(
    () => runLandAgrivoltaicSimulation(activeSite, weather),
    [activeSite, weather],
  );

  const selectedCrop =
    CROP_PROFILES.find(
      (crop) => crop.id === configuration.cropId,
    ) ?? CROP_PROFILES[0];
  const selectedModule = getPVModuleProfile(configuration.pv.moduleProfileId);

  const dliStatus: "good" | "warning" =
    results.cropDLI >= selectedCrop.minimumDLI
      ? "good"
      : "warning";

  const cropYieldStatus: "good" | "warning" =
    results.estimatedCropYield >= 85
      ? "good"
      : "warning";

  const landEquivalentStatus: "good" | "warning" =
    results.landEquivalentRatio > 1
      ? "good"
      : "warning";

  const currentWeatherPoint =
    weather?.hourly[selectedHour] ?? null;

  return (
    <main>
      
<header className="topbar">
  <Link href="/projects" className="brand brand-link">
    <div className="brand-icon">
      <Sun size={25} />
      <Leaf size={17} />
    </div>

    <div>
      <h1>AgriTwin</h1>
      <p>Agrivoltaic Digital Twin</p>
    </div>
  </Link>

  <div className="topbar-right">
    <nav className="topbar-navigation" aria-label="Main navigation">
      <Link
        href="/projects"
        className="topbar-nav-link"
      >
        <MapPin size={15} />
        <span>Projects</span>
      </Link>

      <Link
        href="/land"
        className="topbar-nav-link active"
        aria-current="page"
      >
        <Sun size={15} />
        <span>Dashboard</span>
      </Link>

      <Link
        href="/scenarios"
        className="topbar-nav-link"
      >
        <ChartNoAxesCombined size={15} />
        <span>Scenario Lab</span>
      </Link>

      <Link
        href="/analytics"
        className="topbar-nav-link"
      >
        <ChartNoAxesCombined size={15} />
        <span>Analytics</span>
      </Link>

      <Link
        href="/weather-test"
        className="topbar-nav-link"
      >
        <Cloudy size={15} />
        <span>Weather Test</span>
      </Link>

      <Link
        href="/terminologies"
        className="topbar-nav-link terminology-link"
      >
        <BookOpen size={15} />
        <span>Terminologies</span>
      </Link>
    </nav>

    <div className="header-status">
      <span className="status-dot" />

      <span className="header-status-text">
        {activeSite.siteType.replaceAll("_", " ")} · {activeSite.dataMode}
      </span>

      <span className="header-status-text">
        {weather
          ? "Weather-connected simulation"
          : "Simulation mode"}
      </span>

      <button
        type="button"
        className="secondary-button"
        onClick={resetConfiguration}
      >
        <RefreshCcw size={15} />
        <span>Reset</span>
      </button>
    </div>
  </div>
</header>


      <div className="app-shell">
        <aside className="configuration-panel">
          <section className="panel-heading">
            <div>
              <h2>System configuration</h2>

              <p>
                Adjust the physical twin and simulation inputs.
              </p>
            </div>
          </section>

          <section className="form-section">
            <h3>
              <MapPin size={17} />
              Site
            </h3>

            <label className="field">
              <span>Site name</span>

              <input
                type="text"
                value={configuration.site.name}
                onChange={(event) =>
                  updateSite({
                    name: event.target.value,
                  })
                }
              />
            </label>

            <div className="form-grid">
              <NumericInput
                label="Latitude"
                value={configuration.site.latitude}
                min={-90}
                max={90}
                step={0.0001}
                onChange={(latitude) =>
                  updateSite({ latitude })
                }
              />

              <NumericInput
                label="Longitude"
                value={configuration.site.longitude}
                min={-180}
                max={180}
                step={0.0001}
                onChange={(longitude) =>
                  updateSite({ longitude })
                }
              />
            </div>

            <label className="field">
              <span>Simulation date</span>

              <input
                type="date"
                value={configuration.simulationDate}
                onChange={(event) =>
                  setSimulationDate(event.target.value)
                }
              />
            </label>
          </section>

          <section className="form-section">
            <h3>
              <PanelTop size={17} />
              PV array
            </h3>

            <label className="field">
              <span>PV module profile</span>
              <select
                value={configuration.pv.moduleProfileId}
                onChange={(event) => setModuleProfile(event.target.value)}
              >
                {PV_MODULE_MANUFACTURERS.map((manufacturer) => (
                  <optgroup key={manufacturer} label={manufacturer}>
                    {PV_MODULE_PROFILES.filter((profile) => profile.manufacturer === manufacturer).map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.model} Â· {profile.pmaxW} W Â· {profile.moduleType}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>

            <div className="module-profile-card">
              <strong>{selectedModule.manufacturer} {selectedModule.model}</strong>
              <span>{selectedModule.series}</span>
              <div className="module-profile-grid">
                <span><b>{selectedModule.pmaxW} W</b> Pmax</span>
                <span><b>{selectedModule.efficiencyPercent ?? "â€”"}%</b> efficiency</span>
                <span><b>{selectedModule.cellTechnology}</b> cell</span>
                <span><b>{selectedModule.moduleType}</b> module</span>
                <span><b>{selectedModule.lengthM.toFixed(3)} Ã— {selectedModule.widthM.toFixed(3)} m</b> size</span>
                <span><b>{selectedModule.noctC}Â°C</b> NOCT/NMOT</span>
                <span><b>{selectedModule.tempCoeffPmaxPercentPerC}%/Â°C</b> Pmax coefficient</span>
                <span><b>{selectedModule.vmppV?.toFixed(2) ?? "â€”"} V / {selectedModule.imppA?.toFixed(2) ?? "â€”"} A</b> MPP</span>
              </div>
            </div>

            <div className="form-grid">
              <NumericInput
                label="Panel rows"
                value={configuration.pv.numberOfRows}
                min={1}
                max={10}
                onChange={(numberOfRows) =>
                  updatePV({ numberOfRows })
                }
              />

              <NumericInput
                label="Modules per row"
                value={configuration.pv.modulesPerRow}
                min={1}
                max={20}
                onChange={(modulesPerRow) =>
                  updatePV({ modulesPerRow })
                }
              />

              <NumericInput
                label="Row spacing"
                value={configuration.pv.rowSpacing}
                min={2}
                max={12}
                step={0.5}
                unit="m"
                onChange={(rowSpacing) =>
                  updatePV({ rowSpacing })
                }
              />

              <NumericInput
                label="Panel height"
                value={configuration.pv.panelHeight}
                min={0.5}
                max={8}
                step={0.25}
                unit="m"
                onChange={(panelHeight) =>
                  updatePV({ panelHeight })
                }
              />

              <NumericInput
                label="Tilt"
                value={configuration.pv.tilt}
                min={0}
                max={80}
                unit="Â°"
                onChange={(tilt) =>
                  updatePV({ tilt })
                }
              />

              <NumericInput
                label="Azimuth"
                value={configuration.pv.azimuth}
                min={0}
                max={360}
                unit="Â°"
                onChange={(azimuth) =>
                  updatePV({ azimuth })
                }
              />

              <NumericInput
                label="Module power"
                value={configuration.pv.modulePower}
                min={100}
                max={800}
                step={10}
                unit="W"
                disabled
                onChange={(modulePower) =>
                  updatePV({ modulePower })
                }
              />

              <NumericInput
                label="System efficiency"
                value={Number(
                  (
                    configuration.pv.systemEfficiency *
                    100
                  ).toFixed(0),
                )}
                min={50}
                max={100}
                unit="%"
                onChange={(percentage) =>
                  updatePV({
                    systemEfficiency:
                      percentage / 100,
                  })
                }
              />
              <NumericInput
                label="Ground albedo"
                value={configuration.pv.groundAlbedo}
                min={0}
                max={1}
                step={0.05}
                onChange={(groundAlbedo) => updatePV({ groundAlbedo })}
              />
              <NumericInput
                label="Tracker limit"
                value={configuration.pv.maximumTrackerAngle}
                min={10}
                max={90}
                step={5}
                unit="Â°"
                onChange={(maximumTrackerAngle) => updatePV({ maximumTrackerAngle })}
              />
            </div>

            <label className="field">
              <span>Tracking strategy</span>

              <select
                value={configuration.pv.trackingMode}
                onChange={(event) =>
                  setTrackingMode(
                    event.target.value as TrackingMode,
                  )
                }
              >
                <option value="fixed">
                  Fixed tilt
                </option>

                <option value="standard">
                  Standard tracking
                </option>

                <option value="reverse">
                  Reverse tracking
                </option>

                <option value="custom">
                  Custom adaptive tracking
                </option>
              </select>
            </label>
          </section>

          <section className="form-section">
            <h3>
              <Sprout size={17} />
              Crop
            </h3>

            <label className="field">
              <span>Crop type</span>

              <select
                value={configuration.cropId}
                onChange={(event) =>
                  setCrop(
                    event.target.value as CropId,
                  )
                }
              >
                {CROP_PROFILES.map((crop) => (
                  <option
                    key={crop.id}
                    value={crop.id}
                  >
                    {crop.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="crop-information">
              <strong>{selectedCrop.name}</strong>

              <em>
                {selectedCrop.scientificName}
              </em>

              <span>
                Minimum DLI:{" "}
                {selectedCrop.minimumDLI} mol/mÂ²/day
              </span>

              <span>
                Optimum DLI:{" "}
                {selectedCrop.optimumDLI} mol/mÂ²/day
              </span>

              <span>
                Shade tolerance:{" "}
                {selectedCrop.shadeTolerance}
              </span>
            </div>
          </section>
        </aside>

        <section className="workspace">
          <div className="workspace-heading">
            <div>
              <span className="eyebrow">
                Virtual environment
              </span>

              <h2>{configuration.site.name}</h2>

              <p>
                {configuration.site.latitude.toFixed(4)}Â°,{" "}
                {configuration.site.longitude.toFixed(4)}Â°
              </p>
            </div>

            <div className="capacity-badge">
              <BatteryCharging size={18} />
              {results.installedCapacityKW} kWp
            </div>
          </div>

          <WeatherConnectionCard
            weather={weather}
            loading={weatherLoading}
            error={weatherError}
            selectedHour={selectedHour}
            onRefresh={reloadWeather}
          />

          <div className="scene-card">
            <AgrivoltaicScene trackerAngle={results.hourly[selectedHour]?.trackerAngle} />

            <div className="time-control">
              <div>
                <CloudSun size={18} />

                <span>Time of day</span>

                <strong>
                  {selectedHour
                    .toString()
                    .padStart(2, "0")}
                  :00
                </strong>
              </div>

              <input
                aria-label="Time of day"
                type="range"
                min={6}
                max={18}
                step={1}
                value={selectedHour}
                onChange={(event) =>
                  setSelectedHour(
                    Number(event.target.value),
                  )
                }
              />

              {currentWeatherPoint && (
                <div>
                  <span>
                    GHI:{" "}
                    {
                      currentWeatherPoint.shortwaveRadiation
                    }{" "}
                    W/mÂ²
                  </span>

                  <strong>
                    {currentWeatherPoint.temperature.toFixed(
                      1,
                    )}
                    Â°C
                  </strong>
                </div>
              )}
            </div>
          </div>

          <section className="metrics-grid">
            <MetricCard
              title="PV energy"
              value={`${results.dailyEnergyKWh} kWh/day`}
              description={
                results.dataSource === "open-meteo"
                  ? "Weather-driven daily estimate"
                  : "Synthetic fallback estimate"
              }
              icon={
                <BatteryCharging size={21} />
              }
              status="good"
            />

            <MetricCard
              title="Crop-level DLI"
              value={`${results.cropDLI} mol/mÂ²/day`}
              description={`Minimum target: ${selectedCrop.minimumDLI}`}
              icon={<Leaf size={21} />}
              status={dliStatus}
            />

            <MetricCard
              title="Crop yield index"
              value={`${results.estimatedCropYield}%`}
              description="Relative light-based estimate"
              icon={<Activity size={21} />}
              status={cropYieldStatus}
            />

            <MetricCard
              title="Land equivalent ratio"
              value={results.landEquivalentRatio.toFixed(
                2,
              )}
              description={
                results.landEquivalentRatio > 1
                  ? "Combined land-use advantage"
                  : "Configuration needs improvement"
              }
              icon={
                <ChartNoAxesCombined size={21} />
              }
              status={landEquivalentStatus}
            />
          </section>

          <section className="analysis-grid">
            <article className="content-card chart-card">
              <div className="card-title">
                <div>
                  <span className="eyebrow">
                    Light distribution
                  </span>

                  <h3>Hourly irradiance</h3>
                </div>

                <Sun size={22} />
              </div>

              <IrradianceChart
                data={results.hourly}
              />
            </article>

            <article className="content-card summary-card">
              <div className="card-title">
                <div>
                  <span className="eyebrow">
                    Interpretation
                  </span>

                  <h3>
                    Configuration summary
                  </h3>
                </div>
              </div>

              <dl>
                <div>
                  <dt>Ground coverage ratio</dt>

                  <dd>
                    {results.groundCoverageRatio}%
                  </dd>
                </div>

                <div>
                  <dt>Open-field DLI</dt>

                  <dd>
                    {results.openFieldDLI}{" "}
                    mol/mÂ²/day
                  </dd>
                </div>

                <div>
                  <dt>Crop light reduction</dt>

                  <dd>
                    {results.cropLightReduction}%
                  </dd>
                </div>

                <div>
                  <dt>DLI target achievement</dt>

                  <dd>
                    {results.dliAchievement}%
                  </dd>
                </div>

                {weather && (
                  <>
                    <div>
                      <dt>Daily GHI</dt>

                      <dd>
                        {weather.summary.dailyGHI.toFixed(
                          2,
                        )}{" "}
                        kWh/mÂ²
                      </dd>
                    </div>

                    <div>
                      <dt>Maximum wind</dt>

                      <dd>
                        {weather.summary.maximumWindSpeed.toFixed(
                          1,
                        )}{" "}
                        km/h
                      </dd>
                    </div>

                    <div>
                      <dt>Precipitation</dt>

                      <dd>
                        {weather.summary.totalPrecipitation.toFixed(
                          1,
                        )}{" "}
                        mm
                      </dd>
                    </div>
                  </>
                )}
              </dl>

              <div
                className={`recommendation ${dliStatus}`}
              >
                <strong>
                  {dliStatus === "good"
                    ? "Crop light target satisfied"
                    : "Insufficient crop light"}
                </strong>

                <p>
                  {dliStatus === "good"
                    ? "This preliminary configuration provides enough light for the selected crop."
                    : "Increase row spacing, increase panel height, or use reverse/custom tracking for more hours."}
                </p>
              </div>
            </article>
          </section>

          <section className="content-card engineering-table-card">
            {configuration.pv.trackingMode === "custom" && (
              <div className={`adaptive-controller ${results.adaptiveController.targetSatisfied ? "satisfied" : "deficit"}`}>
                <div><span className="eyebrow">Phase 7B protected-zone DLI controller</span>
                  <h3>{results.adaptiveController.targetSatisfied ? "Crop-light target protected" : "Crop-light deficit remains"}</h3></div>
                <dl>
                  <div><dt>Target DLI</dt><dd>{results.adaptiveController.targetDLI} mol/mÂ²/day</dd></div>
                  <div><dt>Beneath-panel DLI</dt><dd>{results.adaptiveController.protectedZoneDLI} mol/mÂ²/day</dd></div>
                  <div><dt>Standard tracking</dt><dd>{results.adaptiveController.standardTrackingHours} h</dd></div>
                  <div><dt>Reverse tracking</dt><dd>{results.adaptiveController.reverseTrackingHours} h</dd></div>
                </dl>
              </div>
            )}
            <div className="card-title">
              <div>
                <span className="eyebrow">Phase 5 engineering model</span>
                <h3>Hourly solar, tracker and POA results</h3>
              </div>
            </div>
            <div className="engineering-table-wrap">
              <table className="engineering-table">
                <thead><tr>
                  <th>Time</th><th>Mode</th><th>Altitude</th><th>Azimuth</th><th>Tracker</th>
                  <th>AOI</th><th>POA</th><th>Module temp.</th><th>PV power</th><th>Crop light</th><th>Shade</th>
                </tr></thead>
                <tbody>
                  {results.hourly.map((point) => (
                    <tr key={point.hour} className={Number(point.hour.slice(0, 2)) === selectedHour ? "selected" : ""}>
                      <td>{point.hour}</td><td>{point.operatingMode === "standard" ? "ST" : point.operatingMode === "reverse" ? "RT" : "Fixed"}</td><td>{point.solarAltitude}Â°</td><td>{point.solarAzimuth}Â°</td>
                      <td>{point.trackerAngle}Â°</td><td>{point.angleOfIncidence}Â°</td>
                      <td>{point.poaIrradiance} W/mÂ²</td><td>{point.moduleTemperature}Â°C</td><td>{point.pvPower} kW</td>
                      <td>{point.cropIrradiance} W/mÂ²</td><td>{point.shadePercentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="content-card spatial-light-card">
            <div className="card-title">
              <div>
                <span className="eyebrow">Phase 6 spatial crop-light model</span>
                <h3>Ground-level daily light integral</h3>
              </div>
            </div>
            <div className="spatial-light-layout">
              <SpatialDLIHeatmap data={results.spatialLight} selectedHour={selectedHour} />
              <dl className="spatial-statistics">
                <div><dt>Minimum DLI</dt><dd>{results.spatialLight.minimumDLI} mol/mÂ²/day</dd></div>
                <div><dt>Mean DLI</dt><dd>{results.spatialLight.meanDLI} mol/mÂ²/day</dd></div>
                <div><dt>Maximum DLI</dt><dd>{results.spatialLight.maximumDLI} mol/mÂ²/day</dd></div>
                <div><dt>Spatial CV</dt><dd>{results.spatialLight.coefficientOfVariation}%</dd></div>
              </dl>
            </div>
            <div className="zone-statistics">
              {results.spatialLight.zoneSummaries.map((zone) => (
                <article key={zone.zone}>
                  <strong>{zone.label}</strong>
                  <span>{zone.meanDLI} mol/mÂ²/day</span>
                  <small>{zone.meanRelativeDLI}% of open field â€¢ {zone.cellCount} cells</small>
                </article>
              ))}
            </div>
            <p className="spatial-model-note">
              Each cell integrates hourly light after geometric row-shadow projection. This is a design-stage estimate and requires PAR-sensor validation.
            </p>
          </section>

          <footer className="model-notice">
            Radiation source:{" "}
            <strong>
              {results.dataSource === "open-meteo"
                ? "Open-Meteo location-specific weather"
                : "synthetic fallback curve"}
            </strong>
            . Crop response and field-sensor calibration
            remain preliminary.
          </footer>
        </section>
      </div>
    </main>
  );
}

