import type { Request, Response } from 'express';

export interface HealthResponse {
  status: 'ok' | 'degraded';
  service: string;
  timestamp: string;
  uptime: number;
  environment: string;
  upstream: {
    endpoint: string;
    authRequired: boolean;
  };
}

// Serverless Handler (compatible with Vercel, Netlify, Express, and Edge)
export default async function handler(req: Request | any, res?: Response | any) {
  const healthData: HealthResponse = {
    status: 'ok',
    service: 'breathe-sg-psi-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? Math.floor(process.uptime()) : 0,
    environment: process.env.NODE_ENV || 'development',
    upstream: {
      endpoint: 'https://api-open.data.gov.sg/v2/real-time/api/psi',
      authRequired: false,
    },
  };

  // If running in Web standard API (e.g. Next.js / Edge)
  if (!res && req && typeof req.json === 'function') {
    return new Response(JSON.stringify(healthData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }

  // If running in Express / Node serverless handler
  if (res && typeof res.status === 'function') {
    return res.status(200).json(healthData);
  }

  return healthData;
}

export async function GET(request?: any) {
  return handler(request);
}
