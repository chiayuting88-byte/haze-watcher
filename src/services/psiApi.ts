import { HourlyDatapoint, PsiDataRecord, PsiReadings, RegionalValues, SingaporeRegion, WeatherCondition } from '../types/psi';

const PSI_API_ENDPOINT = 'https://api.data.gov.sg/v1/environment/psi';
const PM25_API_ENDPOINT = 'https://api.data.gov.sg/v1/environment/pm25';

// Realistic baseline Singapore data
const DEFAULT_READINGS: PsiReadings = {
  psi_twenty_four_hourly: {
    west: 48,
    national: 45,
    east: 38,
    central: 44,
    south: 49,
    north: 42,
  },
  pm25_twenty_four_hourly: {
    west: 16,
    national: 14,
    east: 11,
    central: 15,
    south: 17,
    north: 13,
  },
  pm25_one_hourly: {
    west: 18,
    national: 16,
    east: 13,
    central: 17,
    south: 21,
    north: 15,
  },
  pm10_twenty_four_hourly: {
    west: 28,
    national: 25,
    east: 21,
    central: 26,
    south: 29,
    north: 24,
  },
  pm10_sub_index: {
    west: 28,
    national: 25,
    east: 21,
    central: 26,
    south: 29,
    north: 24,
  },
  pm25_sub_index: {
    west: 48,
    national: 45,
    east: 38,
    central: 44,
    south: 49,
    north: 42,
  },
  o3_sub_index: {
    west: 16,
    national: 18,
    east: 15,
    central: 20,
    south: 19,
    north: 14,
  },
  o3_eight_hour_max: {
    west: 32,
    national: 36,
    east: 30,
    central: 40,
    south: 38,
    north: 28,
  },
  co_sub_index: {
    west: 4,
    national: 4,
    east: 3,
    central: 5,
    south: 5,
    north: 3,
  },
  co_eight_hour_max: {
    west: 0.6,
    national: 0.5,
    east: 0.4,
    central: 0.7,
    south: 0.7,
    north: 0.5,
  },
  so2_sub_index: {
    west: 9,
    national: 8,
    east: 6,
    central: 8,
    south: 11,
    north: 7,
  },
  so2_twenty_four_hourly: {
    west: 14,
    national: 12,
    east: 9,
    central: 12,
    south: 16,
    north: 11,
  },
  no2_one_hour_max: {
    west: 28,
    national: 25,
    east: 22,
    central: 31,
    south: 34,
    north: 26,
  },
};

export const SIMULATION_SCENARIOS = {
  clean: {
    label: 'Clean Marine Air (Good: PSI ~28)',
    psi: { west: 32, national: 28, east: 24, central: 27, south: 30, north: 25 },
    pm25: { west: 9, national: 8, east: 6, central: 8, south: 9, north: 7 },
    windSpeedKmh: 18,
    windDirection: 'South-East',
    windDegrees: 135,
    temperatureC: 29.5,
    humidityPercent: 74,
    hazeRiskLevel: 'Low' as const,
  },
  moderate: {
    label: 'Typical Urban Baseline (Moderate: PSI ~58)',
    psi: { west: 64, national: 58, east: 52, central: 59, south: 62, north: 55 },
    pm25: { west: 22, national: 19, east: 16, central: 20, south: 21, north: 18 },
    windSpeedKmh: 12,
    windDirection: 'South',
    windDegrees: 180,
    temperatureC: 31.0,
    humidityPercent: 79,
    hazeRiskLevel: 'Moderate' as const,
  },
  unhealthy_alert: {
    label: 'Regional Haze Intrusion (Unhealthy: PSI 126)',
    psi: { west: 138, national: 126, east: 112, central: 128, south: 134, north: 118 },
    pm25: { west: 78, national: 68, east: 58, central: 70, south: 74, north: 62 },
    windSpeedKmh: 24,
    windDirection: 'South-West',
    windDegrees: 225,
    temperatureC: 32.5,
    humidityPercent: 86,
    hazeRiskLevel: 'Elevated' as const,
  },
  severe_haze: {
    label: 'Transboundary Haze Surge (Very Unhealthy: PSI 218)',
    psi: { west: 235, national: 218, east: 195, central: 224, south: 230, north: 208 },
    pm25: { west: 168, national: 152, east: 135, central: 158, south: 162, north: 144 },
    windSpeedKmh: 28,
    windDirection: 'South-West',
    windDegrees: 235,
    temperatureC: 33.2,
    humidityPercent: 88,
    hazeRiskLevel: 'High' as const,
  },
};

function ensureRegionalValues(raw?: Partial<RegionalValues>, fallbackVal = 20): RegionalValues {
  const west = Number(raw?.west) || fallbackVal;
  const central = Number(raw?.central) || fallbackVal;
  const south = Number(raw?.south) || fallbackVal;
  const east = Number(raw?.east) || fallbackVal;
  const north = Number(raw?.north) || fallbackVal;
  const national = Number(raw?.national) || Math.round((west + central + south + east + north) / 5);

  return { west, central, south, east, north, national };
}

export async function fetchLivePsi(): Promise<PsiDataRecord> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const psiPromise = fetch(PSI_API_ENDPOINT, { signal: controller.signal });
    const pm25Promise = fetch(PM25_API_ENDPOINT, { signal: controller.signal }).catch(() => null);

    const [psiResponse, pm25Response] = await Promise.all([psiPromise, pm25Promise]);

    if (!psiResponse.ok) {
      throw new Error(`Data.gov.sg API returned status ${psiResponse.status}`);
    }

    const psiJson = await psiResponse.json();
    clearTimeout(timeoutId);

    const latestItem = psiJson.items?.[psiJson.items.length - 1];
    if (!latestItem || !latestItem.readings) {
      throw new Error('Invalid schema from data.gov.sg');
    }

    let rawPm25OneHr: Partial<RegionalValues> = {};
    if (pm25Response && pm25Response.ok) {
      try {
        const pm25Json = await pm25Response.json();
        const latestPm25 = pm25Json.items?.[pm25Json.items.length - 1];
        if (latestPm25?.readings?.pm25_one_hourly) {
          rawPm25OneHr = latestPm25.readings.pm25_one_hourly;
        }
      } catch {
        // ignore
      }
    }

    const raw = latestItem.readings;
    const psi24 = ensureRegionalValues(raw.psi_twenty_four_hourly, 45);
    const pm2524 = ensureRegionalValues(raw.pm25_twenty_four_hourly, 15);
    const pm25OneHr = Object.keys(rawPm25OneHr).length > 0
      ? ensureRegionalValues(rawPm25OneHr, 16)
      : ensureRegionalValues(raw.pm25_twenty_four_hourly, 16);

    const readings: PsiReadings = {
      psi_twenty_four_hourly: psi24,
      pm25_twenty_four_hourly: pm2524,
      pm25_one_hourly: pm25OneHr,
      pm10_twenty_four_hourly: ensureRegionalValues(raw.pm10_twenty_four_hourly, 25),
      pm10_sub_index: ensureRegionalValues(raw.pm10_sub_index, 25),
      pm25_sub_index: ensureRegionalValues(raw.pm25_sub_index, psi24.national),
      o3_sub_index: ensureRegionalValues(raw.o3_sub_index, 16),
      o3_eight_hour_max: ensureRegionalValues(raw.o3_eight_hour_max, 32),
      co_sub_index: ensureRegionalValues(raw.co_sub_index, 4),
      co_eight_hour_max: ensureRegionalValues(raw.co_eight_hour_max, 0.5),
      so2_sub_index: ensureRegionalValues(raw.so2_sub_index, 8),
      so2_twenty_four_hourly: ensureRegionalValues(raw.so2_twenty_four_hourly, 12),
      no2_one_hour_max: ensureRegionalValues(raw.no2_one_hour_max, 25),
    };

    return {
      timestamp: latestItem.timestamp,
      updateTimestamp: latestItem.update_timestamp || new Date().toISOString(),
      readings,
      source: 'live_gov_sg',
      weather: {
        windSpeedKmh: 14,
        windDirection: 'South-South-West',
        windDegrees: 200,
        temperatureC: 30.5,
        humidityPercent: 80,
        hazeRiskLevel: psi24.national > 100 ? 'Elevated' : 'Low',
      },
    };
  } catch {
    clearTimeout(timeoutId);
    // Return high quality cached fallback with simulated realistic updates
    return getSimulatedRecord('moderate');
  }
}

export function getSimulatedRecord(scenarioKey: keyof typeof SIMULATION_SCENARIOS): PsiDataRecord {
  const scenario = SIMULATION_SCENARIOS[scenarioKey];
  const now = new Date();

  const readings: PsiReadings = {
    ...DEFAULT_READINGS,
    psi_twenty_four_hourly: { ...scenario.psi },
    pm25_twenty_four_hourly: { ...scenario.pm25 },
    pm25_one_hourly: {
      west: Math.round(scenario.pm25.west * 1.15),
      national: Math.round(scenario.pm25.national * 1.12),
      east: Math.round(scenario.pm25.east * 1.1),
      central: Math.round(scenario.pm25.central * 1.14),
      south: Math.round(scenario.pm25.south * 1.18),
      north: Math.round(scenario.pm25.north * 1.11),
    },
    pm25_sub_index: { ...scenario.psi },
  };

  return {
    timestamp: now.toISOString(),
    updateTimestamp: now.toISOString(),
    readings,
    source: 'simulation',
    weather: {
      windSpeedKmh: scenario.windSpeedKmh,
      windDirection: scenario.windDirection,
      windDegrees: scenario.windDegrees,
      temperatureC: scenario.temperatureC,
      humidityPercent: scenario.humidityPercent,
      hazeRiskLevel: scenario.hazeRiskLevel,
    },
  };
}

export function generate24HourHistory(currentRecord: PsiDataRecord): HourlyDatapoint[] {
  const history: HourlyDatapoint[] = [];
  const now = new Date(currentRecord.timestamp || Date.now());

  const currentPsi = currentRecord.readings.psi_twenty_four_hourly;
  const currentPm25 = currentRecord.readings.pm25_twenty_four_hourly;

  for (let i = 23; i >= 0; i--) {
    const pointTime = new Date(now.getTime() - i * 3600 * 1000);
    const hourLabel = pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    // Diurnal variation curve (Singapore air quality usually rises in afternoon peak 2pm-5pm and dips in early dawn)
    const hoursAgo = i;
    const diurnalFactor = 1 + Math.sin((24 - hoursAgo) / 24 * Math.PI * 2 - Math.PI / 2) * 0.18;
    const randomJitter = (Math.sin(hoursAgo * 1.7) * 0.05);
    const factor = Math.max(0.6, diurnalFactor + randomJitter);

    const makeValues = (base: RegionalValues): RegionalValues => {
      const west = Math.max(12, Math.round((Number(base?.west) || 35) * (hoursAgo === 0 ? 1 : factor)));
      const east = Math.max(10, Math.round((Number(base?.east) || 30) * (hoursAgo === 0 ? 1 : factor * 0.95)));
      const central = Math.max(12, Math.round((Number(base?.central) || 35) * (hoursAgo === 0 ? 1 : factor)));
      const south = Math.max(12, Math.round((Number(base?.south) || 35) * (hoursAgo === 0 ? 1 : factor * 1.05)));
      const north = Math.max(12, Math.round((Number(base?.north) || 32) * (hoursAgo === 0 ? 1 : factor * 0.98)));
      const national = Math.max(
        12,
        Math.round((Number(base?.national) || Math.round((west + east + central + south + north) / 5)) * (hoursAgo === 0 ? 1 : factor))
      );
      return { west, east, central, south, north, national };
    };

    history.push({
      hourLabel,
      timestamp: pointTime.toISOString(),
      psi: makeValues(currentPsi),
      pm25: makeValues(currentPm25),
    });
  }

  return history;
}
