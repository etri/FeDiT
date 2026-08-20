export interface FdtDatasetItem {
  type: string;
  weatherMeasurement?: {
    observedAt?: string;
    value?: {
      temperature?: number;
      humidity?: number;
      precipitation_one_hour?: number;
      wind_speed?: number;
    };
  };
  airQualityMeasurement?: {
    observedAt?: string;
    value?: { pm10_value?: number; pm25_value?: number };
  };
  trafficMeasurement?: {
    observedAt?: string;
    value?: { tfvl: number }[];
  };
  parkingMeasurement?: {
    observedAt?: string;
    value?: { name?: string; addr?: string };
  };
}

export interface FdtTourResponse {
  measure_position_name: string;
  federation_data?: { dataset?: FdtDatasetItem[] };
}
