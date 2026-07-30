import { runSimulation } from "@/lib/simulation/engine";
import type { SimulationConfiguration, SimulationResults } from "@/types/simulation";
import type { WeatherResponse } from "@/types/weather";
import type { LandAgrivoltaicSiteProfile } from "../schema";

export function toLandSimulationConfiguration(
  site: LandAgrivoltaicSiteProfile,
): SimulationConfiguration {
  return {
    site: {
      name: site.name,
      latitude: site.location.latitude,
      longitude: site.location.longitude,
      timezone: site.location.timezone,
      fieldLength: site.siteGeometry.fieldLengthM,
      fieldWidth: site.siteGeometry.fieldWidthM,
    },
    pv: { ...site.pvConfiguration },
    cropId: site.cropConfiguration.cropId,
    simulationDate: site.simulationDate,
  };
}

export function runLandAgrivoltaicSimulation(
  site: LandAgrivoltaicSiteProfile,
  weather: WeatherResponse | null = null,
): SimulationResults {
  return runSimulation(toLandSimulationConfiguration(site), weather);
}
