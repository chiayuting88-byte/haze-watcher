import type { Request, Response } from 'express';

const PSI_UPSTREAM_URL = 'https://api-open.data.gov.sg/v2/real-time/api/psi';

export interface RegionalValues {
  west: number;
  national: number;
  east: number;
  central: number;
  south: number;
  north: number;
}

export interface NormalizedReadings {
  [metricKey: string]: RegionalValues;
}

export interface PsiApiResponse {
  success: boolean;
  source: 'api-open.data.gov.sg';
  endpoint: string;
  timestamp: string;
  updatedTimestamp: string;
  regionMetadata: Array<{
    name: string;
    labelLocation: { latitude: number; longitude: number };
  }>;
  readings: NormalizedReadings;
  raw?: any;
  cachedAt?: string;
  error?: string;
}

// In-memory cache for serverless invocation reuse
let cacheData: PsiApiResponse | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 30000; // 30 seconds

function ensureRegionalValues(raw?: Record<string, number | undefined>, fallback = 25): RegionalValues {
  const west = Number(raw?.west) || fallback;
  const central = Number(raw?.central) || fallback;
  const south = Number(raw?.south) || fallback;
  const east = Number(raw?.east) || fallback;
  const north = Number(raw?.north) || fallback;
  const national = Number(raw?.national) || Math.round((west + central + south + east + north) / 5);

  return { west, central, south, east, north, national };
}

export async function fetchUpstreamPsi(): Promise<PsiApiResponse> {
  const now = Date.now();
  if (cacheData && now - cacheTime < CACHE_TTL_MS) {
    return { ...cacheData, cachedAt: new Date(cacheTime).toISOString() };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const upstreamResponse = await fetch(PSI_UPSTREAM_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'BreatheSG-Serverless/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!upstreamResponse.ok) {
      throw new Error(`Upstream data.gov.sg API returned status ${upstreamResponse.status}`);
    }

    const payload = await upstreamResponse.json();
    const items = payload?.data?.items || payload?.items || [];
    const latestItem = items[items.length - 1];

    if (!latestItem || !latestItem.readings) {
      throw new Error('Unrecognized response format from api-open.data.gov.sg');
    }

    const rawReadings = latestItem.readings;
    const normalizedReadings: NormalizedReadings = {};

    for (const [key, val] of Object.entries(rawReadings)) {
      if (typeof val === 'object' && val !== null) {
        normalizedReadings[key] = ensureRegionalValues(val as Record<string, number>);
      }
    }

    // Ensure 1-hour PM2.5 proxy exists if not in the payload
    if (!normalizedReadings.pm25_one_hourly && normalizedReadings.pm25_twenty_four_hourly) {
      normalizedReadings.pm25_one_hourly = { ...normalizedReadings.pm25_twenty_four_hourly };
    }

    const result: PsiApiResponse = {
      success: true,
      source: 'api-open.data.gov.sg',
      endpoint: PSI_UPSTREAM_URL,
      timestamp: latestItem.timestamp || new Date().toISOString(),
      updatedTimestamp: latestItem.updatedTimestamp || latestItem.update_timestamp || new Date().toISOString(),
      regionMetadata: payload?.data?.regionMetadata || payload?.region_metadata || [],
      readings: normalizedReadings,
      raw: payload,
    };

    cacheData = result;
    cacheTime = now;

    return result;
  } catch (error: any) {
    clearTimeout(timeoutId);

    // If cache exists, serve stale on upstream error
    if (cacheData) {
      return {
        ...cacheData,
        error: `Upstream error: ${error?.message}. Serving stale cached data.`,
      };
    }

    throw error;
  }
}

// Universal Serverless Handler (Node/Express, Vercel, Netlify)
export default async function handler(req: Request | any, res?: Response | any) {
  try {
    const data = await fetchUpstreamPsi();

    // If running in Web standard API (e.g. Next.js / Edge runtime)
    if (!res && req && typeof req.json === 'function') {
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // If running in Express / Node serverless handler
    if (res && typeof res.status === 'function') {
      res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json(data);
    }

    return data;
  } catch (error: any) {
    const errorBody = {
      success: false,
      error: error?.message || 'Failed to retrieve PSI data from api-open.data.gov.sg',
      timestamp: new Date().toISOString(),
    };

    if (!res && req) {
      return new Response(JSON.stringify(errorBody), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (res && typeof res.status === 'function') {
      return res.status(502).json(errorBody);
    }

    throw error;
  }
}

// Edge / Web Request GET export
export async function GET(request?: any) {
  return handler(request);
}
