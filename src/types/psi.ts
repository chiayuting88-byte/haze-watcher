export type SingaporeRegion = 'central' | 'north' | 'south' | 'east' | 'west' | 'national';

export type AirQualityBand = 'good' | 'moderate' | 'unhealthy' | 'very_unhealthy' | 'hazardous';

export interface RegionalValues {
  west: number;
  national: number;
  east: number;
  central: number;
  south: number;
  north: number;
}

export interface PsiReadings {
  o3_sub_index: RegionalValues;
  pm10_twenty_four_hourly: RegionalValues;
  pm10_sub_index: RegionalValues;
  co_sub_index: RegionalValues;
  pm25_twenty_four_hourly: RegionalValues;
  so2_sub_index: RegionalValues;
  co_eight_hour_max: RegionalValues;
  no2_one_hour_max: RegionalValues;
  so2_twenty_four_hourly: RegionalValues;
  pm25_sub_index: RegionalValues;
  psi_twenty_four_hourly: RegionalValues;
  o3_eight_hour_max: RegionalValues;
  pm25_one_hourly?: RegionalValues;
}

export interface RegionCoordinate {
  name: SingaporeRegion;
  label: string;
  latitude: number;
  longitude: number;
  description: string;
  suburbs: string[];
}

export interface WeatherCondition {
  windSpeedKmh: number;
  windDirection: string; // e.g., "South-West", "North-East"
  windDegrees: number;
  temperatureC: number;
  humidityPercent: number;
  hazeRiskLevel: 'Low' | 'Moderate' | 'Elevated' | 'High';
}

export interface PsiDataRecord {
  timestamp: string;
  updateTimestamp: string;
  readings: PsiReadings;
  source: 'live_gov_sg' | 'simulation' | 'cached';
  weather: WeatherCondition;
}

export interface HourlyDatapoint {
  hourLabel: string;
  timestamp: string;
  psi: RegionalValues;
  pm25: RegionalValues;
}

export interface AlertConfiguration {
  pushEnabled: boolean;
  permission: NotificationPermission | 'unsupported';
  psiThreshold: number; // e.g. 100 for Unhealthy, 51 for Moderate
  pm25Threshold: number; // e.g. 55 ug/m3
  monitoredRegion: SingaporeRegion; // 'national' means any region
  soundEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "07:00"
}

export interface AlertNotificationItem {
  id: string;
  timestamp: string;
  region: SingaporeRegion;
  band: AirQualityBand;
  metric: 'PSI' | 'PM2.5';
  value: number;
  title: string;
  message: string;
  read: boolean;
}

export interface BandMetadata {
  band: AirQualityBand;
  label: string;
  psiRange: string;
  pm25Range: string;
  color: string;
  bgSubtle: string;
  borderSubtle: string;
  textClass: string;
  healthImpact: string;
  generalAdvisory: string;
  vulnerableAdvisory: string;
  maskRecommendation: string;
}
