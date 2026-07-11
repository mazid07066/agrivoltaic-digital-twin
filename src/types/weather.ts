export interface WeatherHourlyPoint {
  time: string;
  hour: string;
  shortwaveRadiation: number;
  directNormalIrradiance: number;
  diffuseRadiation: number;
  temperature: number;
  relativeHumidity: number;
  cloudCover: number;
  windSpeed: number;
  precipitation: number;
}

export interface WeatherSummary {
  date: string;
  latitude: number;
  longitude: number;
  timezone: string;
  sunrise: string;
  sunset: string;
  maximumTemperature: number;
  minimumTemperature: number;
  totalPrecipitation: number;
  maximumWindSpeed: number;
  averageCloudCover: number;
  dailyGHI: number;
  source: "Open-Meteo";
}

export interface WeatherResponse {
  summary: WeatherSummary;
  hourly: WeatherHourlyPoint[];
}

export interface WeatherApiError {
  error: string;
  details?: string;
}