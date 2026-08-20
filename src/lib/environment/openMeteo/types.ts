export interface OpenMeteoHourlyPayload {
  time?: string[];

  shortwave_radiation?: number[];
  direct_normal_irradiance?: number[];
  diffuse_radiation?: number[];

  temperature_2m?: number[];
  relative_humidity_2m?: number[];

  cloud_cover?: number[];

  wind_speed_10m?: number[];
  wind_direction_10m?: number[];

  precipitation?: number[];

  surface_pressure?: number[];

  et0_fao_evapotranspiration?: number[];
}

export interface OpenMeteoDailyPayload {
  time?: string[];

  sunrise?: string[];
  sunset?: string[];

  temperature_2m_max?: number[];
  temperature_2m_min?: number[];

  precipitation_sum?: number[];

  wind_speed_10m_max?: number[];
}

export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;

  elevation?: number;

  timezone: string;

  timezone_abbreviation?: string;

  utc_offset_seconds?: number;

  hourly?: OpenMeteoHourlyPayload;

  daily?: OpenMeteoDailyPayload;

  hourly_units?: Record<
    string,
    string
  >;

  daily_units?: Record<
    string,
    string
  >;
}
