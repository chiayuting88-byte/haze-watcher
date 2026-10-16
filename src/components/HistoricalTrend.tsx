import React, { useState } from 'react';
import { BarChart3, LineChart, TrendingDown, TrendingUp } from 'lucide-react';
import { HourlyDatapoint, SingaporeRegion } from '../types/psi';
import { PSI_BANDS, REGIONS, getPsiBand, getRegionDisplayName } from '../utils/constants';

interface HistoricalTrendProps {
  history: HourlyDatapoint[];
  selectedRegion: SingaporeRegion;
  onSelectRegion: (region: SingaporeRegion) => void;
}

export const HistoricalTrend: React.FC<HistoricalTrendProps> = ({
  history,
  selectedRegion,
  onSelectRegion,
}) => {
  const [metric, setMetric] = useState<'psi' | 'pm25'>('psi');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!history || history.length === 0) return null;

  const activeRegion = selectedRegion;
  const values = history.map((pt) => {
    const rawVal = metric === 'psi' ? pt.psi?.[activeRegion] : pt.pm25?.[activeRegion];
    return typeof rawVal === 'number' && Number.isFinite(rawVal) ? rawVal : (metric === 'psi' ? 45 : 15);
  });

  const validValues = values.filter((v) => Number.isFinite(v));
  const maxVal = validValues.length > 0 ? Math.max(...validValues, metric === 'psi' ? 120 : 60) : 100;
  const safeMax = Number.isFinite(maxVal) && maxVal > 0 ? maxVal : 100;
  const currentVal = values[values.length - 1] ?? 45;
  const previousVal = values[Math.max(0, values.length - 2)] ?? currentVal;
  const isRising = currentVal > previousVal;

  // Chart dimensions
  const chartHeight = 220;
  const chartWidth = 900;
  const paddingX = 40;
  const paddingY = 30;
  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  // SVG coordinates for active region line
  const denom = Math.max(1, history.length - 1);
  const points = history.map((pt, index) => {
    const rawVal = metric === 'psi' ? pt.psi?.[activeRegion] : pt.pm25?.[activeRegion];
    const val = typeof rawVal === 'number' && Number.isFinite(rawVal) ? rawVal : (metric === 'psi' ? 45 : 15);
    const x = paddingX + (index / denom) * innerWidth;
    const computedY = paddingY + innerHeight - ((val - 0) / (safeMax * 1.15)) * innerHeight;
    const y = Number.isFinite(computedY) ? computedY : paddingY + innerHeight / 2;
    return { x, y, val, label: pt.hourLabel || '', timestamp: pt.timestamp || '' };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    const px = Number.isFinite(pt.x) ? pt.x.toFixed(1) : '0';
    const py = Number.isFinite(pt.y) ? pt.y.toFixed(1) : '0';
    return `${acc} ${idx === 0 ? 'M' : 'L'} ${px} ${py}`;
  }, '');

  const lastPt = points[points.length - 1] || { x: paddingX, y: paddingY };
  const firstPt = points[0] || { x: paddingX, y: paddingY };
  const areaD = `${pathD} L ${(Number.isFinite(lastPt.x) ? lastPt.x : chartWidth - paddingX).toFixed(1)} ${chartHeight - paddingY} L ${(Number.isFinite(firstPt.x) ? firstPt.x : paddingX).toFixed(1)} ${chartHeight - paddingY} Z`;

  // Threshold lines for PSI
  const rawUnhealthyY = metric === 'psi'
    ? paddingY + innerHeight - (100 / (safeMax * 1.15)) * innerHeight
    : paddingY + innerHeight - (55 / (safeMax * 1.15)) * innerHeight;
  const unhealthyY = Number.isFinite(rawUnhealthyY) ? rawUnhealthyY : null;

  const rawModerateY = metric === 'psi'
    ? paddingY + innerHeight - (50 / (safeMax * 1.15)) * innerHeight
    : null;
  const moderateY = rawModerateY !== null && Number.isFinite(rawModerateY) ? rawModerateY : null;

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : points[points.length - 1];

  return (
    <div id="trend-section" className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              24-Hour Air Quality Trend
            </h2>
            <div className="flex items-center gap-1 text-xs text-neutral-500 font-mono">
              {isRising ? (
                <span className="flex items-center text-amber-600 font-semibold">
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +{currentVal - previousVal} vs 1h ago
                </span>
              ) : (
                <span className="flex items-center text-emerald-600 font-semibold">
                  <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> {currentVal - previousVal} vs 1h ago
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Hourly progression in {getRegionDisplayName(activeRegion)} over the past 24 hours
          </p>
        </div>

        {/* Metric Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setMetric('psi')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                metric === 'psi'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              24-hr PSI
            </button>
            <button
              type="button"
              onClick={() => setMetric('pm25')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                metric === 'pm25'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              PM2.5 (µg/m³)
            </button>
          </div>
        </div>
      </div>

      {/* SVG Trend Chart */}
      <div className="mt-4 relative">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto max-h-[300px] overflow-visible select-none"
        >
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={chartHeight - paddingY}
            x2={chartWidth - paddingX}
            y2={chartHeight - paddingY}
            stroke="#cbd5e1"
            strokeWidth="1"
          />

          {/* Unhealthy Threshold Line */}
          {unhealthyY !== null && unhealthyY > paddingY && (
            <g>
              <line
                x1={paddingX}
                y1={unhealthyY}
                x2={chartWidth - paddingX}
                y2={unhealthyY}
                stroke="#ea580c"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.8"
              />
              <text
                x={chartWidth - paddingX + 5}
                y={unhealthyY + 4}
                className="text-[10px] font-mono fill-orange-600 font-semibold"
              >
                {metric === 'psi' ? '100 Unhealthy' : '55 Elevated'}
              </text>
            </g>
          )}

          {/* Moderate Threshold Line */}
          {moderateY !== null && moderateY > paddingY && (
            <g>
              <line
                x1={paddingX}
                y1={moderateY}
                x2={chartWidth - paddingX}
                y2={moderateY}
                stroke="#0284c7"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.6"
              />
              <text
                x={chartWidth - paddingX + 5}
                y={moderateY + 4}
                className="text-[10px] font-mono fill-sky-600 font-medium"
              >
                50 Moderate
              </text>
            </g>
          )}

          {/* Area under curve */}
          <path d={areaD} fill="url(#trendGradient)" />

          {/* Line curve */}
          <path
            d={pathD}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hourly Points & Hover Affordances */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIndex === idx;
            const isLatest = idx === points.length - 1;

            return (
              <g
                key={idx}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Invisible hit target */}
                <rect
                  x={pt.x - 12}
                  y={paddingY}
                  width="24"
                  height={innerHeight}
                  fill="transparent"
                />

                {/* Scrubber vertical line if hovered */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={paddingY}
                    x2={pt.x}
                    y2={chartHeight - paddingY}
                    stroke="#94a3b8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Data point dot */}
                <circle
                  cx={Number.isFinite(pt.x) ? pt.x : 0}
                  cy={Number.isFinite(pt.y) ? pt.y : 0}
                  r={isHovered ? 6 : isLatest ? 4.5 : 3}
                  fill={isHovered ? '#1d4ed8' : '#2563eb'}
                  stroke="#ffffff"
                  strokeWidth={isHovered ? 2.5 : 1.5}
                />

                {/* X-axis time label (every 3 hours) */}
                {idx % 3 === 0 && (
                  <text
                    x={pt.x}
                    y={chartHeight - paddingY + 16}
                    textAnchor="middle"
                    className="text-[10px] font-mono fill-neutral-400"
                  >
                    {pt.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover / Current Value Inspector Card */}
        {hoveredPoint && (
          <div className="mt-3 flex items-center justify-between px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg text-xs border border-neutral-200/80 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 font-mono">{hoveredPoint.label}</span>
              <span className="text-neutral-300 dark:text-neutral-700">·</span>
              <span className="font-semibold text-neutral-900 dark:text-white">
                {metric === 'psi' ? '24-hr PSI' : '1-hr PM2.5'}:
              </span>
              <span className="font-mono font-bold text-neutral-900 dark:text-white tabular-nums text-sm">
                {hoveredPoint.val} {metric === 'pm25' ? 'µg/m³' : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-neutral-500">Status:</span>
              <span
                className="font-semibold"
                style={{
                  color: PSI_BANDS[getPsiBand(hoveredPoint.val)].color,
                }}
              >
                {PSI_BANDS[getPsiBand(hoveredPoint.val)].label}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
