import { angleOfIncidence, getSolarPosition } from "@/lib/simulation/solarPosition";
import { solveRectangularRoofLayout } from "@/lib/geometry/rectangularRoof";
import type { FlatRoofSiteProfile } from "@/lib/sites/schema";
import type { WeatherResponse } from "@/types/weather";
import {
  resolvePhysicsConfiguration,
  simulatePhysicsTimestep,
} from "@/lib/physics";
import { siteTimeToDate } from "@/lib/simulation/solarPosition";
import {
  DEFAULT_INVERTER_PROFILE_ID,
  findInverterProfile,
  getInverterProfile,
} from "@/lib/electrical/inverter/catalogue";
import type { PhysicsTimestepResult } from "@/lib/physics/types";

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
  deliveredAcPowerKW?: number;
  physics?: PhysicsTimestepResult;
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
  const physicsConfiguration = resolvePhysicsConfiguration(
    site.pvConfiguration.physicsConfiguration,
  );
  const selectedInverter =
    findInverterProfile(
      site.pvConfiguration.inverterProfileId ??
        DEFAULT_INVERTER_PROFILE_ID,
    ) ?? getInverterProfile(DEFAULT_INVERTER_PROFILE_ID);

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

    if (physicsConfiguration.mode !== "legacy_parity") {
      const pv = site.pvConfiguration;
      const inverterCount = Math.max(1, Math.round(pv.inverterCount ?? 1));
      const modulesPerString = Math.max(
        1,
        Math.round(pv.modulesPerString ?? Math.min(17, layout.moduleCount || 1)),
      );
      const stringsPerInverter = Math.max(
        1,
        Math.round(
          pv.stringsPerInverter ??
            Math.ceil(layout.moduleCount / modulesPerString / inverterCount),
        ),
      );
      const physics = simulatePhysicsTimestep({
        timestamp: siteTimeToDate(site.simulationDate, hour, timezone),
        latitudeDeg: site.location.latitude,
        longitudeDeg: site.location.longitude,
        elevationM:
          (site.location.terrainElevationM ?? 0) +
          site.siteGeometry.buildingHeightM,
        ghiWm2: ghi,
        dniWm2: dni,
        dhiWm2: dhi,
        ambientTemperatureC,
        windSpeedMs: weatherPoint?.windSpeed ?? 0,
        relativeHumidityPercent: weatherPoint?.relativeHumidity,
        rainMm: weatherPoint?.precipitation,
        rowCount: Math.max(1, layout.rows),
        rowPitchM:
          pv.moduleLength + site.siteGeometry.array.rowSpacingM,
        collectorWidthM: pv.moduleLength,
        clearanceM: site.siteGeometry.array.rackHeightM,
        fixedTiltDeg: site.siteGeometry.array.tiltDeg,
        fixedAzimuthDeg: site.siteGeometry.array.azimuthDeg,
        maximumTrackerAngleDeg: 0,
        groundCoverageRatio:
          layout.usableArea.areaM2 > 0
            ? clamp(
                (layout.moduleCount * pv.moduleLength * pv.moduleWidth) /
                  layout.usableArea.areaM2,
                0,
                1,
              )
            : 0,
        groundAlbedo: site.siteGeometry.surfaceAlbedo,
        moduleCount: layout.moduleCount,
        modulesPerString,
        stringsPerInverter,
        inverterCount,
        mpptCountPerInverter: selectedInverter.dc.independentMpptInputs,
        maxStringsPerMppt: selectedInverter.dc.stringsPerMppt,
        mpptStringAllocation:
          pv.mpptStringAllocation,
        mppVoltageMinV: selectedInverter.dc.mppVoltageMinV,
        mppVoltageMaxV: selectedInverter.dc.mppVoltageMaxV,
        maxInputVoltageV: selectedInverter.dc.maxInputVoltageV,
        maxOperatingCurrentPerMpptA:
          selectedInverter.dc.maxOperatingCurrentPerMpptA,
        maxShortCircuitCurrentPerMpptA:
          selectedInverter.dc.maxShortCircuitCurrentPerMpptA,
        ratedAcPowerPerInverterW: selectedInverter.ac.ratedActivePowerW,
        module: {
          pmaxW: pv.modulePower,
          vmppV: pv.moduleVmpp ?? pv.modulePower / 10,
          imppA: pv.moduleImpp ?? 10,
          vocV: pv.moduleVoc ?? (pv.moduleVmpp ?? pv.modulePower / 10) * 1.2,
          iscA: pv.moduleIsc ?? (pv.moduleImpp ?? 10) * 1.05,
          tempCoeffPmaxPercentPerC: pv.temperatureCoefficientPmax,
          tempCoeffVocPercentPerC:
            pv.moduleTempCoeffVocPercentPerC ?? -0.29,
          tempCoeffIscPercentPerC:
            pv.moduleTempCoeffIscPercentPerC ?? 0.05,
          noctC: pv.moduleNOCT,
          efficiencyFraction: pv.moduleEfficiency / 100,
          cellsInSeries: pv.moduleCellsInSeries ?? undefined,
        },
        configuration: {
          ...physicsConfiguration,
          trackingModel: "fixed_tilt",
        },
      });

      return {
        hour: weatherPoint?.hour ?? `${String(hour).padStart(2, "0")}:00`,
        ghi: rounded(ghi, 1),
        poaIrradiance: rounded(physics.irradiance.poaGlobalWm2, 1),
        ambientTemperatureC: rounded(ambientTemperatureC, 1),
        moduleTemperatureC: rounded(physics.thermal.cellTemperatureC, 1),
        dcPowerKW: rounded(physics.dcAtInverterW / 1000, 3),
        deliveredAcPowerKW: rounded(physics.netAcPowerW / 1000, 3),
        solarAltitudeDeg: rounded(physics.solar.apparentElevationDeg, 1),
        solarAzimuthDeg: rounded(physics.solar.azimuthDeg, 1),
        angleOfIncidenceDeg: rounded(
          physics.irradiance.angleOfIncidenceDeg,
          1,
        ),
        physics,
      };
    }

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
    (sum, point) => sum + (point.deliveredAcPowerKW ?? point.dcPowerKW),
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
