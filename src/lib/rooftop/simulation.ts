import { angleOfIncidence, getSolarPosition } from "@/lib/simulation/solarPosition";
import { solveRectangularRoofLayout } from "@/lib/geometry/rectangularRoof";
import type { FlatRoofSiteProfile } from "@/lib/sites/schema";
import type { WeatherResponse } from "@/types/weather";

const radians = (degrees: number) => (degrees * Math.PI) / 180;
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
const rounded = (value: number, places = 2) =>
  Number(value.toFixed(places));

function syntheticIrradiance(hour: number): number {
  return hour < 6 || hour > 18
    ? 0
    : Math.max(
        0,
        900 * Math.sin(((hour - 6) / 12) * Math.PI),
      );
}

export interface RooftopHourlyPoint {
  hour: string;
  ghi: number;
  poaIrradiance: number;
  ambientTemperatureC: number;
  moduleTemperatureC: number;
  dcPowerKW: number;
  solarAltitudeDeg: number;
  solarAzimuthDeg: number;
  angleOfIncidenceDeg: number;
}

export interface RooftopSimulationResults {
  roofAreaM2: number;
  usableRoofAreaM2: number;
  usableAreaPercent: number;
  moduleCount: number;
  rows: number;
  modulesPerRow: number;
  installedCapacityKW: number;
  dailyEnergyKWh: number;
  specificYieldKWhPerKW: number;
  dataSource: "synthetic" | "open-meteo";
  hourly: RooftopHourlyPoint[];
}

export function runFlatRoofSimulation(
  site: FlatRoofSiteProfile,
  weather: WeatherResponse | null = null,
): RooftopSimulationResults {
  const layout = solveRectangularRoofLayout({
    geometry: site.siteGeometry,
    moduleWidthM: site.pvConfiguration.moduleWidth,
    moduleLengthM: site.pvConfiguration.moduleLength,
    modulePowerW: site.pvConfiguration.modulePower,
  });

  const timezone =
    weather?.summary.timezone ??
    site.location.timezone ??
    "UTC";

  const hourly = Array.from({ length: 24 }, (_, hour) => {
    const weatherPoint = weather?.hourly[hour];
    const ghi = Math.max(
      0,
      weatherPoint?.shortwaveRadiation ??
        syntheticIrradiance(hour),
    );
    const dni = Math.max(
      0,
      weatherPoint?.directNormalIrradiance ??
        ghi * 0.75,
    );
    const dhi = Math.max(
      0,
      weatherPoint?.diffuseRadiation ??
        ghi * 0.25,
    );
    const ambientTemperatureC =
      weatherPoint?.temperature ?? 25;

    const solar = getSolarPosition(
      site.simulationDate,
      hour,
      site.location.latitude,
      site.location.longitude,
      timezone,
    );

    const tilt = site.siteGeometry.array.tiltDeg;
    const azimuth = site.siteGeometry.array.azimuthDeg;
    const aoi = angleOfIncidence(
      solar,
      tilt,
      azimuth,
    );

    const poaBeam =
      dni * Math.max(Math.cos(radians(aoi)), 0);
    const poaSkyDiffuse =
      (dhi * (1 + Math.cos(radians(tilt)))) / 2;
    const poaGroundReflected =
      (ghi *
        site.siteGeometry.surfaceAlbedo *
        (1 - Math.cos(radians(tilt)))) /
      2;

    const poaIrradiance = solar.isAboveHorizon
      ? Math.max(
          0,
          poaBeam +
            poaSkyDiffuse +
            poaGroundReflected,
        )
      : 0;

    const moduleTemperatureC =
      ambientTemperatureC +
      ((site.pvConfiguration.moduleNOCT - 20) /
        800) *
        poaIrradiance;

    const temperatureFactor = clamp(
      1 +
        (site.pvConfiguration
          .temperatureCoefficientPmax /
          100) *
          (moduleTemperatureC - 25),
      0.65,
      1.08,
    );

    const dcPowerKW =
      layout.installedCapacityKW *
      (poaIrradiance / 1000) *
      site.pvConfiguration.systemEfficiency *
      temperatureFactor;

    return {
      hour:
        weatherPoint?.hour ??
        `${String(hour).padStart(2, "0")}:00`,
      ghi: rounded(ghi, 1),
      poaIrradiance: rounded(poaIrradiance, 1),
      ambientTemperatureC: rounded(
        ambientTemperatureC,
        1,
      ),
      moduleTemperatureC: rounded(
        moduleTemperatureC,
        1,
      ),
      dcPowerKW: rounded(Math.max(0, dcPowerKW), 2),
      solarAltitudeDeg: rounded(
        solar.altitudeDegrees,
        1,
      ),
      solarAzimuthDeg: rounded(
        solar.azimuthDegrees,
        1,
      ),
      angleOfIncidenceDeg: rounded(aoi, 1),
    };
  });

  const dailyEnergyKWh = hourly.reduce(
    (sum, point) => sum + point.dcPowerKW,
    0,
  );

  return {
    roofAreaM2: rounded(layout.roofAreaM2, 2),
    usableRoofAreaM2: rounded(
      layout.usableArea.areaM2,
      2,
    ),
    usableAreaPercent: rounded(
      (layout.usableArea.areaM2 /
        layout.roofAreaM2) *
        100,
      1,
    ),
    moduleCount: layout.moduleCount,
    rows: layout.rows,
    modulesPerRow: layout.modulesPerRow,
    installedCapacityKW: rounded(
      layout.installedCapacityKW,
      2,
    ),
    dailyEnergyKWh: rounded(dailyEnergyKWh, 2),
    specificYieldKWhPerKW:
      layout.installedCapacityKW > 0
        ? rounded(
            dailyEnergyKWh /
              layout.installedCapacityKW,
            2,
          )
        : 0,
    dataSource: weather
      ? "open-meteo"
      : "synthetic",
    hourly,
  };
}
