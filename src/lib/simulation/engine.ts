import { SimulationConfiguration, SimulationResults } from "@/types/simulation";
import { WeatherResponse } from "@/types/weather";
import { getCropProfile } from "./crops";
import { angleOfIncidence, getSolarPosition, getSurfaceOrientation } from "./solarPosition";
import { calculateSpatialLight } from "./spatialLight";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const radians = (degrees: number) => degrees * Math.PI / 180;
const rounded = (value: number, places = 1) => Number(value.toFixed(places));

function syntheticIrradiance(hour: number): number {
  return hour < 6 || hour > 18 ? 0 : Math.max(0, 900 * Math.sin(((hour - 6) / 12) * Math.PI));
}

export function runSimulation(
  configuration: SimulationConfiguration,
  weather: WeatherResponse | null = null,
): SimulationResults {
  const { site, pv, cropId, simulationDate } = configuration;
  const crop = getCropProfile(cropId);
  const totalModules = pv.numberOfRows * pv.modulesPerRow;
  const installedCapacityKW = totalModules * pv.modulePower / 1000;
  const fieldArea = site.fieldLength * site.fieldWidth;
  const moduleArea = totalModules * pv.moduleWidth * pv.moduleLength;
  const groundCoverageRatio = fieldArea > 0 ? clamp(moduleArea / fieldArea, 0, 1) : 0;
  const spacingFactor = clamp(4 / Math.max(pv.rowSpacing, 1), 0.35, 1.4);
  const heightFactor = clamp(2 / Math.max(pv.panelHeight, 0.5), 0.45, 1.5);
  const timezone = weather?.summary.timezone || site.timezone || "UTC";

  const hourly = Array.from({ length: 24 }, (_, hour) => {
    const weatherPoint = weather?.hourly[hour];
    const ghi = Math.max(0, weatherPoint?.shortwaveRadiation ?? syntheticIrradiance(hour));
    const dni = Math.max(0, weatherPoint?.directNormalIrradiance ?? ghi * 0.75);
    const dhi = Math.max(0, weatherPoint?.diffuseRadiation ?? ghi * 0.25);
    const temperature = weatherPoint?.temperature ?? 25;
    const solar = getSolarPosition(simulationDate, hour, site.latitude, site.longitude, timezone);
    const surface = getSurfaceOrientation(
      pv.trackingMode, solar, pv.tilt, pv.azimuth, pv.maximumTrackerAngle,
    );
    const aoi = angleOfIncidence(solar, surface.tilt, surface.azimuth);
    const poaBeam = dni * Math.max(Math.cos(radians(aoi)), 0);
    const poaSkyDiffuse = dhi * (1 + Math.cos(radians(surface.tilt))) / 2;
    const poaGroundReflected = ghi * pv.groundAlbedo *
      (1 - Math.cos(radians(surface.tilt))) / 2;
    const poaIrradiance = solar.isAboveHorizon
      ? Math.max(0, poaBeam + poaSkyDiffuse + poaGroundReflected) : 0;

    const projectedPanelFraction = Math.max(0.15, Math.cos(radians(surface.tilt)));
    const solarHeightEffect = solar.isAboveHorizon
      ? clamp(1 / Math.max(Math.sin(solar.altitudeRadians), 0.2), 1, 3) : 0;
    const shadePercentage = clamp(
      groundCoverageRatio * spacingFactor * heightFactor * projectedPanelFraction *
      solarHeightEffect * 100, 0, solar.isAboveHorizon ? 85 : 0,
    );
    const directHorizontal = Math.max(0, ghi - dhi);
    const cropIrradiance = directHorizontal * (1 - shadePercentage / 100) + dhi;
    const temperatureFactor = clamp(1 - Math.max(0, temperature - 25) * 0.004, 0.75, 1.05);
    const pvPower = installedCapacityKW * (poaIrradiance / 1000) *
      pv.systemEfficiency * temperatureFactor;

    return {
      hour: weatherPoint?.hour ?? `${String(hour).padStart(2, "0")}:00`,
      irradiance: rounded(ghi), cropIrradiance: rounded(cropIrradiance),
      pvPower: rounded(Math.max(0, pvPower), 2), shadePercentage: rounded(shadePercentage),
      solarAltitude: rounded(solar.altitudeDegrees), solarZenith: rounded(solar.zenithDegrees),
      solarAzimuth: rounded(solar.azimuthDegrees), trackerAngle: rounded(surface.trackerAngle),
      surfaceTilt: rounded(surface.tilt), surfaceAzimuth: rounded(surface.azimuth),
      angleOfIncidence: rounded(aoi), poaBeam: rounded(poaBeam),
      poaSkyDiffuse: rounded(poaSkyDiffuse), poaGroundReflected: rounded(poaGroundReflected),
      poaIrradiance: rounded(poaIrradiance),
    };
  });

  const dailyEnergyKWh = hourly.reduce((sum, point) => sum + point.pvPower, 0);
  const dli = (key: "irradiance" | "cropIrradiance") => hourly.reduce(
    (sum, point) => sum + point[key] * 0.45 * 4.57 * 3600, 0,
  ) / 1_000_000;
  const openFieldDLI = dli("irradiance");
  const cropDLI = dli("cropIrradiance");
  const dliAchievement = clamp(cropDLI / crop.optimumDLI * 100, 0, 130);
  const cropLightReduction = openFieldDLI > 0 ? clamp((1 - cropDLI / openFieldDLI) * 100, 0, 100) : 0;
  let estimatedCropYield = cropDLI < crop.minimumDLI
    ? clamp(cropDLI / crop.minimumDLI * 85, 0, 85)
    : cropDLI <= crop.maximumDLI
      ? clamp(92 + (1 - Math.abs(cropDLI - crop.optimumDLI) / Math.max(crop.optimumDLI, 1)) * 8, 85, 100)
      : clamp(100 - (cropDLI - crop.maximumDLI) / crop.maximumDLI * 25, 70, 100);
  const referenceEnergy = installedCapacityKW * 5 * pv.systemEfficiency;
  const relativeEnergyYield = referenceEnergy > 0 ? clamp(dailyEnergyKWh / referenceEnergy, 0, 1.25) : 0;

  return {
    installedCapacityKW: rounded(installedCapacityKW, 2), dailyEnergyKWh: rounded(dailyEnergyKWh, 2),
    openFieldDLI: rounded(openFieldDLI, 2), cropDLI: rounded(cropDLI, 2),
    dliAchievement: rounded(dliAchievement), cropLightReduction: rounded(cropLightReduction),
    estimatedCropYield: rounded(estimatedCropYield),
    landEquivalentRatio: rounded(relativeEnergyYield + estimatedCropYield / 100, 2),
    groundCoverageRatio: rounded(groundCoverageRatio * 100),
    dataSource: weather ? "open-meteo" : "synthetic", hourly,
    spatialLight: calculateSpatialLight(configuration, hourly),
  };
}
