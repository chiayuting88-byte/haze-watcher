import React, { useState } from 'react';
import { Compass, Eye, Info, Navigation, Wind } from 'lucide-react';
import { AirQualityBand, PsiReadings, SingaporeRegion, WeatherCondition } from '../types/psi';
import { PSI_BANDS, REGIONS, getPm25Band, getPsiBand, getRegionDisplayName } from '../utils/constants';

interface SingaporeMapProps {
  readings: PsiReadings;
  weather: WeatherCondition;
  selectedRegion: SingaporeRegion;
  onSelectRegion: (region: SingaporeRegion) => void;
}

type MapMetric = 'psi' | 'pm25' | 'category';

interface StationPin {
  id: string;
  name: string;
  region: SingaporeRegion;
  x: number;
  y: number;
  code: string;
}

const MONITORING_STATIONS: StationPin[] = [
  { id: 'st-north', name: 'Woodlands Station', region: 'north', x: 495, y: 110, code: 'WDL-01' },
  { id: 'st-central', name: 'Newton / Central Station', region: 'central', x: 505, y: 245, code: 'CT-02' },
  { id: 'st-south', name: 'Raffles / Harbour Station', region: 'south', x: 515, y: 345, code: 'SOU-03' },
  { id: 'st-east', name: 'Tampines East Station', region: 'east', x: 740, y: 220, code: 'EST-04' },
  { id: 'st-west', name: 'Jurong West Station', region: 'west', x: 260, y: 250, code: 'WST-05' },
];

export const SingaporeMap: React.FC<SingaporeMapProps> = ({
  readings,
  weather,
  selectedRegion,
  onSelectRegion,
}) => {
  const [metricMode, setMetricMode] = useState<MapMetric>('psi');
  const [hoveredRegion, setHoveredRegion] = useState<SingaporeRegion | null>(null);
  const [showWindVector, setShowWindVector] = useState<boolean>(true);

  // Region colors and values
  const getRegionColor = (region: SingaporeRegion): { fill: string; stroke: string; band: AirQualityBand; value: number } => {
    const psiVal = readings.psi_twenty_four_hourly[region];
    const pm25Val = readings.pm25_twenty_four_hourly[region];
    const band = getPsiBand(psiVal);

    let val = psiVal;
    if (metricMode === 'pm25') {
      val = readings.pm25_one_hourly?.[region] ?? pm25Val;
    }

    const bandInfo = PSI_BANDS[band];
    return {
      fill: bandInfo.color,
      stroke: bandInfo.color,
      band,
      value: val,
    };
  };

  const activeRegion = hoveredRegion || (selectedRegion !== 'national' ? selectedRegion : 'central');
  const activeStats = getRegionColor(activeRegion);
  const activeBandInfo = PSI_BANDS[activeStats.band];

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs">
      {/* Map Control Bar */}
      <div className="px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 bg-neutral-50/50 dark:bg-neutral-900/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Interactive Sector Map
          </span>
          <span className="text-neutral-300 dark:text-neutral-700">·</span>
          <span className="text-xs text-neutral-600 dark:text-neutral-400">
            5 Official NEA Sectors
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Metric Switcher Tabs */}
          <div className="flex items-center p-0.5 bg-neutral-200/70 dark:bg-neutral-800 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setMetricMode('psi')}
              className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap ${
                metricMode === 'psi'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              24-hr PSI
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('pm25')}
              className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap ${
                metricMode === 'pm25'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              1-hr PM2.5
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('category')}
              className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap ${
                metricMode === 'category'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              NEA Band
            </button>
          </div>

          {/* Wind toggle */}
          <button
            type="button"
            onClick={() => setShowWindVector(!showWindVector)}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
              showWindVector
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500'
            }`}
            title="Toggle Wind & Haze Dispersion Vector"
          >
            <Wind className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs font-medium">Wind Flow</span>
          </button>
        </div>
      </div>

      {/* Map Canvas Frame */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[500px] bg-sky-50/40 dark:bg-neutral-950 flex items-center justify-center overflow-hidden select-none">
        {/* Subtle Water & Maritime Background grid */}
        <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Geographic Labels for Surrounding Waters */}
        <div className="absolute top-2 left-6 text-[11px] font-mono tracking-wider text-slate-400/80 pointer-events-none">
          STRAITS OF JOHOR (MALAYSIA)
        </div>
        <div className="absolute bottom-2 right-8 text-[11px] font-mono tracking-wider text-slate-400/80 pointer-events-none">
          SINGAPORE STRAIT · RIU ARCHIPELAGO
        </div>

        {/* SVG Map of Singapore */}
        <svg
          viewBox="0 0 960 480"
          className="w-full h-full p-2 sm:p-4 transition-all duration-300"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.06))' }}
        >
          <defs>
            {/* Pattern for regional texture */}
            <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f0f9ff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.5" />
            </linearGradient>

            {/* Region specific subtle gradients */}
            {(['north', 'south', 'east', 'west', 'central'] as SingaporeRegion[]).map((r) => {
              const { fill } = getRegionColor(r);
              return (
                <linearGradient key={`grad-${r}`} id={`grad-${r}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={fill} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={fill} stopOpacity="0.38" />
                </linearGradient>
              );
            })}
          </defs>

          {/* MALAYSIA / JOHOR SHORELINE OUTLINE (Subtle reference) */}
          <path
            d="M 120 40 Q 300 20 480 30 T 840 25 L 860 10 L 80 10 Z"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.6"
          />

          {/* SINGAPORE REGION POLYGONS */}
          <g className="transition-all duration-200">
            {/* 1. WEST REGION (Jurong, Tuas, Clementi, Bukit Batok, Sungei Buloh west) */}
            <path
              id="path-west"
              d="M 120 280 
                 L 110 320 
                 L 135 340 
                 L 180 325 
                 L 230 310 
                 L 290 320 
                 L 360 300 
                 L 400 280 
                 L 410 220 
                 L 380 160 
                 L 340 130 
                 L 260 135 
                 L 200 170 
                 L 160 215 
                 Z"
              fill={selectedRegion === 'west' ? 'url(#grad-west)' : 'url(#grad-west)'}
              stroke={getRegionColor('west').fill}
              strokeWidth={selectedRegion === 'west' || hoveredRegion === 'west' ? '3.5' : '2'}
              strokeLinejoin="round"
              className="cursor-pointer transition-all duration-200 hover:opacity-90 hover:stroke-[3.5px]"
              onMouseEnter={() => setHoveredRegion('west')}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => onSelectRegion('west')}
            />

            {/* TUAS PENINSULA EXTENSION */}
            <path
              d="M 110 320 L 70 340 L 60 380 L 100 395 L 135 340 Z"
              fill="url(#grad-west)"
              stroke={getRegionColor('west').fill}
              strokeWidth={selectedRegion === 'west' || hoveredRegion === 'west' ? '3' : '1.5'}
              strokeLinejoin="round"
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredRegion('west')}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => onSelectRegion('west')}
            />

            {/* JURONG ISLAND */}
            <path
              d="M 220 345 L 280 345 L 295 385 L 240 395 L 210 375 Z"
              fill="url(#grad-west)"
              stroke={getRegionColor('west').fill}
              strokeWidth="1.5"
              strokeLinejoin="round"
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredRegion('west')}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => onSelectRegion('west')}
            />

            {/* 2. NORTH REGION (Woodlands, Yishun, Sembawang, Mandai, Kranji) */}
            <path
              id="path-north"
              d="M 340 130 
                 L 380 160 
                 L 420 160 
                 L 480 165 
                 L 570 160 
                 L 600 125 
                 L 580 80 
                 L 510 65 
                 L 420 70 
                 L 360 90 
                 Z"
              fill="url(#grad-north)"
              stroke={getRegionColor('north').fill}
              strokeWidth={selectedRegion === 'north' || hoveredRegion === 'north' ? '3.5' : '2'}
              strokeLinejoin="round"
              className="cursor-pointer transition-all duration-200 hover:opacity-90 hover:stroke-[3.5px]"
              onMouseEnter={() => setHoveredRegion('north')}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => onSelectRegion('north')}
            />

            {/* 3. CENTRAL REGION (Bishan, Ang Mo Kio, Toa Payoh, Novena, Bukit Timah, Tanglin) */}
            <path
              id="path-central"
              d="M 380 160 
                 L 410 220 
                 L 400 280 
                 L 440 295 
                 L 510 290 
                 L 560 260 
                 L 580 200 
                 L 570 160 
                 L 480 165 
                 L 420 160 
                 Z"
              fill="url(#grad-central)"
              stroke={getRegionColor('central').fill}
              strokeWidth={selectedRegion === 'central' || hoveredRegion === 'central' ? '3.5' : '2'}
              strokeLinejoin="round"
              className="cursor-pointer transition-all duration-200 hover:opacity-90 hover:stroke-[3.5px]"
              onMouseEnter={() => setHoveredRegion('central')}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => onSelectRegion('central')}
            />

            {/* 4. EAST REGION (Tampines, Bedok, Pasir Ris, Changi, Changi Airport) */}
            <path
              id="path-east"
              d="M 570 160 
                 L 580 200 
                 L 620 240 
                 L 670 260 
                 L 740 265 
                 L 810 240 
                 L 835 190 
                 L 790 145 
                 L 710 135 
                 L 640 140 
                 L 600 125 
                 Z"
              fill="url(#grad-east)"
              stroke={getRegionColor('east').fill}
              strokeWidth={selectedRegion === 'east' || hoveredRegion === 'east' ? '3.5' : '2'}
              strokeLinejoin="round"
              className="cursor-pointer transition-all duration-200 hover:opacity-90 hover:stroke-[3.5px]"
              onMouseEnter={() => setHoveredRegion('east')}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => onSelectRegion('east')}
            />

            {/* PULAU UBIN & PULAU TEKONG (East offshore) */}
            <path
              d="M 700 95 L 750 95 L 765 115 L 710 115 Z"
              fill="url(#grad-east)"
              stroke={getRegionColor('east').fill}
              strokeWidth="1.5"
              strokeLinejoin="round"
              className="cursor-pointer transition-all"
              onClick={() => onSelectRegion('east')}
            />
            <path
              d="M 785 85 L 835 85 L 845 115 L 795 120 Z"
              fill="url(#grad-east)"
              stroke={getRegionColor('east').fill}
              strokeWidth="1.5"
              strokeLinejoin="round"
              className="cursor-pointer transition-all"
              onClick={() => onSelectRegion('east')}
            />

            {/* 5. SOUTH REGION (Bukit Merah, Marina Bay, Downtown Core, HarbourFront, Sentosa) */}
            <path
              id="path-south"
              d="M 400 280 
                 L 360 300 
                 L 410 340 
                 L 470 345 
                 L 540 335 
                 L 600 305 
                 L 620 270 
                 L 560 260 
                 L 510 290 
                 L 440 295 
                 Z"
              fill="url(#grad-south)"
              stroke={getRegionColor('south').fill}
              strokeWidth={selectedRegion === 'south' || hoveredRegion === 'south' ? '3.5' : '2'}
              strokeLinejoin="round"
              className="cursor-pointer transition-all duration-200 hover:opacity-90 hover:stroke-[3.5px]"
              onMouseEnter={() => setHoveredRegion('south')}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => onSelectRegion('south')}
            />

            {/* SENTOSA ISLAND */}
            <path
              d="M 460 360 L 520 360 L 530 380 L 470 380 Z"
              fill="url(#grad-south)"
              stroke={getRegionColor('south').fill}
              strokeWidth="1.5"
              strokeLinejoin="round"
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredRegion('south')}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => onSelectRegion('south')}
            />
          </g>

          {/* REGION NAME LABELS */}
          <g className="pointer-events-none select-none font-sans">
            {/* North Label */}
            <text x="490" y="105" textAnchor="middle" className="text-[13px] font-bold fill-neutral-800 dark:fill-neutral-100">
              NORTH
            </text>
            <text x="490" y="125" textAnchor="middle" className="text-[14px] font-mono font-semibold fill-neutral-900 dark:fill-white">
              {metricMode === 'psi' && `PSI ${readings.psi_twenty_four_hourly.north}`}
              {metricMode === 'pm25' && `${readings.pm25_one_hourly?.north ?? readings.pm25_twenty_four_hourly.north} µg/m³`}
              {metricMode === 'category' && PSI_BANDS[getPsiBand(readings.psi_twenty_four_hourly.north)].label}
            </text>

            {/* West Label */}
            <text x="250" y="230" textAnchor="middle" className="text-[13px] font-bold fill-neutral-800 dark:fill-neutral-100">
              WEST
            </text>
            <text x="250" y="250" textAnchor="middle" className="text-[14px] font-mono font-semibold fill-neutral-900 dark:fill-white">
              {metricMode === 'psi' && `PSI ${readings.psi_twenty_four_hourly.west}`}
              {metricMode === 'pm25' && `${readings.pm25_one_hourly?.west ?? readings.pm25_twenty_four_hourly.west} µg/m³`}
              {metricMode === 'category' && PSI_BANDS[getPsiBand(readings.psi_twenty_four_hourly.west)].label}
            </text>

            {/* Central Label */}
            <text x="480" y="225" textAnchor="middle" className="text-[13px] font-bold fill-neutral-800 dark:fill-neutral-100">
              CENTRAL
            </text>
            <text x="480" y="245" textAnchor="middle" className="text-[14px] font-mono font-semibold fill-neutral-900 dark:fill-white">
              {metricMode === 'psi' && `PSI ${readings.psi_twenty_four_hourly.central}`}
              {metricMode === 'pm25' && `${readings.pm25_one_hourly?.central ?? readings.pm25_twenty_four_hourly.central} µg/m³`}
              {metricMode === 'category' && PSI_BANDS[getPsiBand(readings.psi_twenty_four_hourly.central)].label}
            </text>

            {/* East Label */}
            <text x="710" y="200" textAnchor="middle" className="text-[13px] font-bold fill-neutral-800 dark:fill-neutral-100">
              EAST
            </text>
            <text x="710" y="220" textAnchor="middle" className="text-[14px] font-mono font-semibold fill-neutral-900 dark:fill-white">
              {metricMode === 'psi' && `PSI ${readings.psi_twenty_four_hourly.east}`}
              {metricMode === 'pm25' && `${readings.pm25_one_hourly?.east ?? readings.pm25_twenty_four_hourly.east} µg/m³`}
              {metricMode === 'category' && PSI_BANDS[getPsiBand(readings.psi_twenty_four_hourly.east)].label}
            </text>

            {/* South Label */}
            <text x="490" y="320" textAnchor="middle" className="text-[13px] font-bold fill-neutral-800 dark:fill-neutral-100">
              SOUTH
            </text>
            <text x="490" y="338" textAnchor="middle" className="text-[14px] font-mono font-semibold fill-neutral-900 dark:fill-white">
              {metricMode === 'psi' && `PSI ${readings.psi_twenty_four_hourly.south}`}
              {metricMode === 'pm25' && `${readings.pm25_one_hourly?.south ?? readings.pm25_twenty_four_hourly.south} µg/m³`}
              {metricMode === 'category' && PSI_BANDS[getPsiBand(readings.psi_twenty_four_hourly.south)].label}
            </text>
          </g>

          {/* NEA MONITORING STATIONS PINS */}
          {MONITORING_STATIONS.map((st) => {
            const isHovered = hoveredRegion === st.region || selectedRegion === st.region;
            const regionColor = getRegionColor(st.region);

            return (
              <g
                key={st.id}
                transform={`translate(${st.x}, ${st.y})`}
                className="cursor-pointer transition-transform duration-200"
                onClick={() => onSelectRegion(st.region)}
              >
                {/* Station circle halo */}
                <circle
                  r={isHovered ? 14 : 9}
                  fill={regionColor.fill}
                  fillOpacity="0.25"
                  className="animate-pulse"
                />
                <circle
                  r={isHovered ? 7 : 5}
                  fill="#ffffff"
                  stroke={regionColor.fill}
                  strokeWidth="2.5"
                />
              </g>
            );
          })}

          {/* WIND DIRECTION ARROW OVERLAY */}
          {showWindVector && (
            <g
              transform={`translate(870, 70) rotate(${weather.windDegrees})`}
              className="transition-transform duration-500 pointer-events-none"
            >
              <circle r="26" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.9" />
              <path
                d="M 0 -18 L 7 10 L 0 5 L -7 10 Z"
                fill="#2563eb"
              />
              <circle r="3" fill="#1e40af" />
            </g>
          )}
        </svg>

        {/* Floating Quick Region Focus Badge */}
        <div className="absolute bottom-3 left-4 right-4 sm:right-auto sm:max-w-xs bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 shadow-md pointer-events-auto">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                {getRegionDisplayName(activeRegion)}
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white">
                  {readings.psi_twenty_four_hourly[activeRegion]}
                </span>
                <span className="text-xs text-neutral-500">24h PSI</span>
                <span className="text-neutral-300 dark:text-neutral-700">·</span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: activeStats.fill }}
                >
                  {activeBandInfo.label}
                </span>
              </div>
            </div>

            <div className="text-right border-l pl-3 border-neutral-200 dark:border-neutral-800">
              <div className="text-[10px] text-neutral-500">1-hr PM2.5</div>
              <div className="text-sm font-bold font-mono tabular-nums text-neutral-800 dark:text-neutral-200">
                {readings.pm25_one_hourly?.[activeRegion] ?? readings.pm25_twenty_four_hourly[activeRegion]} µg/m³
              </div>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
            <span>Click sector to filter detailed readings</span>
            <button
              type="button"
              onClick={() => onSelectRegion('national')}
              className={`hover:text-neutral-900 dark:hover:text-white underline ${
                selectedRegion === 'national' ? 'font-semibold text-neutral-900 dark:text-white' : ''
              }`}
            >
              Reset to Island-Wide
            </button>
          </div>
        </div>

        {/* Floating Wind & Haze Flow Legend */}
        {showWindVector && (
          <div className="hidden sm:flex absolute top-3 right-4 items-center gap-2 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs">
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-neutral-600 dark:text-neutral-300">
              Wind: <strong className="font-semibold text-neutral-900 dark:text-white">{weather.windDirection}</strong> ({weather.windSpeedKmh} km/h)
            </span>
          </div>
        )}
      </div>

      {/* Official NEA Scale Footnote / Legend */}
      <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-900/80 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-neutral-600 dark:text-neutral-400">
          <Info className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
          <span>Singapore NEA Air Quality Scale:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {(['good', 'moderate', 'unhealthy', 'very_unhealthy', 'hazardous'] as AirQualityBand[]).map((b) => {
            const meta = PSI_BANDS[b];
            return (
              <div key={b} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: meta.color }}
                />
                <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                  {meta.label}
                </span>
                <span className="text-neutral-400 text-[11px] font-mono tabular-nums">
                  ({meta.psiRange})
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
