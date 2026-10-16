import { AirQualityBand, BandMetadata, RegionCoordinate, SingaporeRegion } from '../types/psi';

export const REGIONS: RegionCoordinate[] = [
  {
    name: 'north',
    label: 'North',
    latitude: 1.41803,
    longitude: 103.82,
    description: 'Northern sector bordering Johor Strait',
    suburbs: ['Woodlands', 'Yishun', 'Sembawang', 'Admiralty', 'Mandai'],
  },
  {
    name: 'south',
    label: 'South',
    latitude: 1.29587,
    longitude: 103.82,
    description: 'Southern coastline, Harbour & Downtown Core',
    suburbs: ['Bukit Merah', 'Marina Bay', 'CBD', 'Tanjong Pagar', 'Sentosa'],
  },
  {
    name: 'east',
    label: 'East',
    latitude: 1.35735,
    longitude: 103.94,
    description: 'Eastern coastal plain & aviation hub',
    suburbs: ['Tampines', 'Bedok', 'Pasir Ris', 'Changi', 'Marine Parade'],
  },
  {
    name: 'west',
    label: 'West',
    latitude: 1.35735,
    longitude: 103.7,
    description: 'Industrial basin & university belt',
    suburbs: ['Jurong West', 'Jurong East', 'Tuas', 'Clementi', 'Bukit Batok'],
  },
  {
    name: 'central',
    label: 'Central',
    latitude: 1.35735,
    longitude: 103.82,
    description: 'Urban core & central catchment nature reserve',
    suburbs: ['Bishan', 'Toa Payoh', 'Ang Mo Kio', 'Novena', 'Bukit Timah'],
  },
];

export const PSI_BANDS: Record<AirQualityBand, BandMetadata> = {
  good: {
    band: 'good',
    label: 'Good',
    psiRange: '0 – 50',
    pm25Range: '0 – 55 µg/m³',
    color: '#16a34a', // Emerald 600
    bgSubtle: 'bg-emerald-500/10',
    borderSubtle: 'border-emerald-500/30',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    healthImpact: 'Air quality is considered satisfactory, and air pollution poses little or no risk.',
    generalAdvisory: 'Normal activities can continue as usual outdoors.',
    vulnerableAdvisory: 'Normal outdoor activities may continue.',
    maskRecommendation: 'No mask required for general outdoor activity.',
  },
  moderate: {
    band: 'moderate',
    label: 'Moderate',
    psiRange: '51 – 100',
    pm25Range: '56 – 150 µg/m³',
    color: '#0284c7', // Sky 600
    bgSubtle: 'bg-sky-500/10',
    borderSubtle: 'border-sky-500/30',
    textClass: 'text-sky-700 dark:text-sky-400',
    healthImpact: 'Air quality is acceptable; some pollutants may pose a moderate concern for a very small number of sensitive individuals.',
    generalAdvisory: 'Normal outdoor activities can continue for the majority of the population.',
    vulnerableAdvisory: 'Individuals unusually sensitive to air pollution should monitor symptoms.',
    maskRecommendation: 'Mask not generally required; sensitive individuals may keep one ready.',
  },
  unhealthy: {
    band: 'unhealthy',
    label: 'Unhealthy',
    psiRange: '101 – 200',
    pm25Range: '151 – 250 µg/m³',
    color: '#ea580c', // Orange 600
    bgSubtle: 'bg-orange-500/10',
    borderSubtle: 'border-orange-500/30',
    textClass: 'text-orange-700 dark:text-orange-400',
    healthImpact: 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.',
    generalAdvisory: 'Reduce prolonged or strenuous outdoor exertion. Take frequent indoor breaks.',
    vulnerableAdvisory: 'Elderly, pregnant women, and children should minimise outdoor exertion. Persons with chronic lung/heart disease should avoid outdoor activity.',
    maskRecommendation: 'N95 respirator mask recommended for prolonged outdoor exertion.',
  },
  very_unhealthy: {
    band: 'very_unhealthy',
    label: 'Very Unhealthy',
    psiRange: '201 – 300',
    pm25Range: '251 – 350 µg/m³',
    color: '#dc2626', // Red 600
    bgSubtle: 'bg-red-500/10',
    borderSubtle: 'border-red-500/30',
    textClass: 'text-red-700 dark:text-red-400',
    healthImpact: 'Health alert: risk of health effects increased for everyone.',
    generalAdvisory: 'Avoid prolonged or strenuous outdoor exertion. Keep windows and doors closed.',
    vulnerableAdvisory: 'Sensitive individuals should strictly avoid outdoor physical exertion. Stay in air-filtered spaces.',
    maskRecommendation: 'N95 respirator strongly advised if outdoor travel is unavoidable.',
  },
  hazardous: {
    band: 'hazardous',
    label: 'Hazardous',
    psiRange: '> 300',
    pm25Range: '> 350 µg/m³',
    color: '#7e22ce', // Purple 700
    bgSubtle: 'bg-purple-500/10',
    borderSubtle: 'border-purple-500/30',
    textClass: 'text-purple-700 dark:text-purple-400',
    healthImpact: 'Health warnings of emergency conditions. The entire population is more likely to be affected.',
    generalAdvisory: 'Minimise all outdoor activity. Turn on HEPA air purifiers and seal gaps in windows.',
    vulnerableAdvisory: 'Strictly remain indoors. Seek prompt medical care if experiencing respiratory distress.',
    maskRecommendation: 'N95 or higher particulate respirator strictly mandatory if stepping outside.',
  },
};

export function getPsiBand(psiValue: number): AirQualityBand {
  if (psiValue <= 50) return 'good';
  if (psiValue <= 100) return 'moderate';
  if (psiValue <= 200) return 'unhealthy';
  if (psiValue <= 300) return 'very_unhealthy';
  return 'hazardous';
}

export function getPm25Band(pm25Value: number): { band: string; level: 'Normal' | 'Elevated' | 'High' | 'Very High'; color: string } {
  if (pm25Value <= 55) {
    return { band: 'Band I', level: 'Normal', color: '#16a34a' };
  } else if (pm25Value <= 150) {
    return { band: 'Band II', level: 'Elevated', color: '#0284c7' };
  } else if (pm25Value <= 250) {
    return { band: 'Band III', level: 'High', color: '#ea580c' };
  } else {
    return { band: 'Band IV', level: 'Very High', color: '#dc2626' };
  }
}

export function getRegionDisplayName(region: SingaporeRegion): string {
  switch (region) {
    case 'central': return 'Central Singapore';
    case 'north': return 'North (Woodlands / Yishun)';
    case 'south': return 'South (Harbour / CBD)';
    case 'east': return 'East (Tampines / Changi)';
    case 'west': return 'West (Jurong / Tuas)';
    case 'national': return 'Island-Wide (National)';
  }
}
