import { SimulationConfiguration, SimulationResults, TrackingMode } from "@/types/simulation";
import { WeatherResponse } from "@/types/weather";
import { getCropProfile } from "./crops";
import { angleOfIncidence, getSolarPosition, getSurfaceOrientation } from "./solarPosition";
import { calculateSpatialLight } from "./spatialLight";
import { createAdaptiveSchedule } from "./adaptiveControl";

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

  const calculateHour = (hour: number, operatingMode: Exclude<TrackingMode, "custom">) => {
    const weatherPoint = weather?.hourly[hour];
    const ghi = Math.max(0, weatherPoint?.shortwaveRadiation ?? syntheticIrradiance(hour));
    const dni = Math.max(0, weatherPoint?.directNormalIrradiance ?? ghi * 0.75);
    const dhi = Math.max(0, weatherPoint?.diffuseRadiation ?? ghi * 0.25);
    const temperature = weatherPoint?.temperature ?? 25;
    const solar = getSolarPosition(simulationDate, hour, site.latitude, site.longitude, timezone);
    const surface = getSurfaceOrientation(
      operatingMode, solar, pv.tilt, pv.azimuth, pv.maximumTrackerAngle,
    );
    const aoi = angleOfIncidence(solar, surface.tilt, surface.azimuth);
    const poaBeam = dni * Math.max(Math.cos(radians(aoi)), 0);
    const poaSkyDiffuse = dhi * (1 + Math.cos(radians(surface.tilt))) / 2;
    const poaGroundReflected = ghi * pv.groundAlbedo *
      (1 - Math.cos(radians(surface.tilt))) / 2;
    const poaIrradiance = solar.isAboveHorizon
      ? Math.max(0, poaBeam + poaSkyDiffuse + poaGroundReflected) : 0;

    const projectedPanelFraction = Math.max(0.15, Math.cos(radians(surface.tilt)));
    const trackingShadeFactor = operatingMode === "standard"
      ? 1.15 : operatingMode === "reverse" ? 0.52 : 1;
    const solarHeightEffect = solar.isAboveHorizon
      ? clamp(1 / Math.max(Math.sin(solar.altitudeRadians), 0.2), 1, 3) : 0;
    const shadePercentage = clamp(
      groundCoverageRatio * spacingFactor * heightFactor * projectedPanelFraction * trackingShadeFactor *
      solarHeightEffect * 100, 0, solar.isAboveHorizon ? 85 : 0,
    );
    const directHorizontal = Math.max(0, ghi - dhi);
    const cropIrradiance = directHorizontal * (1 - shadePercentage / 100) + dhi;
    const moduleTemperature = temperature +
      ((pv.moduleNOCT - 20) / 800) * poaIrradiance;
    const temperatureFactor = clamp(
      1 + (pv.temperatureCoefficientPmax / 100) * (moduleTemperature - 25),
      0.65,
      1.08,
    );
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
      operatingMode,
      moduleTemperature: rounded(moduleTemperature),
      temperatureFactor: rounded(temperatureFactor, 3),
    };
  };

  const standardCandidates = Array.from({ length: 24 }, (_, hour) => calculateHour(hour, "standard"));
  const reverseCandidates = Array.from({ length: 24 }, (_, hour) => calculateHour(hour, "reverse"));
  const reverseSpatial = calculateSpatialLight(configuration, reverseCandidates);
  const reverseWholeDLI = reverseCandidates.reduce(
    (sum, point) => sum + point.cropIrradiance * 0.45 * 4.57 * 3600, 0,
  ) / 1_000_000;
  const reverseBeneathDLI = reverseSpatial.zoneSummaries.find(
    (zone) => zone.zone === "beneath-panel",
  )?.meanDLI ?? reverseWholeDLI;
  const protectedZoneRatio = clamp(
    reverseWholeDLI > 0 ? reverseBeneathDLI / reverseWholeDLI : 1,
    0.05,
    1,
  );
  const adaptiveController = createAdaptiveSchedule(
    standardCandidates.map((standard, hour) => ({
      hour,
      daylight: standard.solarAltitude > 0 && standard.irradiance > 0,
      standardCropIrradiance: standard.cropIrradiance,
      reverseCropIrradiance: reverseCandidates[hour].cropIrradiance,
      standardPVPower: standard.pvPower,
      reversePVPower: reverseCandidates[hour].pvPower,
    })),
    crop.minimumDLI,
    protectedZoneRatio,
  );
  let hourly = pv.trackingMode === "custom"
    ? adaptiveController.schedule.map((mode, hour) =>
        mode === "standard" ? standardCandidates[hour] : reverseCandidates[hour])
    : Array.from({ length: 24 }, (_, hour) =>
        calculateHour(hour, pv.trackingMode as Exclude<TrackingMode, "custom">));

  if (pv.trackingMode === "custom") {
    const beneathDLI = (points: typeof hourly) =>
      calculateSpatialLight(configuration, points).zoneSummaries.find(
        (zone) => zone.zone === "beneath-panel",
      )?.meanDLI ?? 0;
    let currentProtectedDLI = beneathDLI(hourly);
    while (currentProtectedDLI < crop.minimumDLI) {
      const alternatives = adaptiveController.schedule
        .map((mode, hour) => ({ mode, hour }))
        .filter(({ mode, hour }) => mode === "standard" && standardCandidates[hour].solarAltitude > 0)
        .map(({ hour }) => {
          const trial = [...hourly];
          trial[hour] = reverseCandidates[hour];
          const trialDLI = beneathDLI(trial);
          const lightGain = trialDLI - currentProtectedDLI;
          const energyCost = Math.max(
            standardCandidates[hour].pvPower - reverseCandidates[hour].pvPower,
            0.01,
          );
          return { hour, trial, trialDLI, score: lightGain / energyCost };
        })
        .filter((candidate) => candidate.trialDLI > currentProtectedDLI)
        .sort((a, b) => b.score - a.score);
      const best = alternatives[0];
      if (!best) break;
      hourly = best.trial;
      adaptiveController.schedule[best.hour] = "reverse";
      currentProtectedDLI = best.trialDLI;
    }
    const daylightHours = standardCandidates.filter(
      (point) => point.solarAltitude > 0 && point.irradiance > 0,
    ).map((point) => Number(point.hour.slice(0, 2)));
    adaptiveController.standardTrackingHours = daylightHours.filter(
      (hour) => adaptiveController.schedule[hour] === "standard",
    ).length;
    adaptiveController.reverseTrackingHours = daylightHours.length -
      adaptiveController.standardTrackingHours;
  }

  const dailyEnergyKWh = hourly.reduce((sum, point) => sum + point.pvPower, 0);
  const dli = (key: "irradiance" | "cropIrradiance") => hourly.reduce(
    (sum, point) => sum + point[key] * 0.45 * 4.57 * 3600, 0,
  ) / 1_000_000;
  const openFieldDLI = dli("irradiance");
  const cropDLI = dli("cropIrradiance");
  const spatialLight = calculateSpatialLight(configuration, hourly);
  const protectedZoneDLI = spatialLight.zoneSummaries.find(
    (zone) => zone.zone === "beneath-panel",
  )?.meanDLI ?? cropDLI;
  const dliAchievement = clamp(cropDLI / crop.optimumDLI * 100, 0, 130);
  const cropLightReduction = openFieldDLI > 0 ? clamp((1 - cropDLI / openFieldDLI) * 100, 0, 100) : 0;
  const estimatedCropYield = cropDLI < crop.minimumDLI
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
    spatialLight,
    adaptiveController: pv.trackingMode === "custom" ? {
      ...adaptiveController,
      predictedDLI: rounded(protectedZoneDLI, 2),
      protectedZoneDLI: rounded(protectedZoneDLI, 2),
      wholeFieldDLI: rounded(cropDLI, 2),
      targetSatisfied: protectedZoneDLI >= crop.minimumDLI,
    } : {
      ...adaptiveController,
      enabled: false,
      predictedDLI: rounded(cropDLI, 2),
      targetSatisfied: cropDLI >= crop.minimumDLI,
      wholeFieldDLI: rounded(cropDLI, 2),
      protectedZoneDLI: rounded(protectedZoneDLI, 2),
    },
  };
}

