import React from 'react';
import { Activity, AlertCircle, Compass, Droplets, Gauge, Shield, Wind } from 'lucide-react';
import { PsiReadings, SingaporeRegion, WeatherCondition } from '../types/psi';
import { PSI_BANDS, getPm25Band, getPsiBand, getRegionDisplayName } from '../utils/constants';

interface MetricCardsProps {
  readings: PsiReadings;
  weather: WeatherCondition;
  selectedRegion: SingaporeRegion;
  onSelectRegion: (region: SingaporeRegion) => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  readings,
  weather,
  selectedRegion,
  onSelectRegion,
}) => {
  const nationalPsi = readings.psi_twenty_four_hourly.national;
  const nationalBand = getPsiBand(nationalPsi);
  const nationalBandMeta = PSI_BANDS[nationalBand];

  // Find region with peak PSI
  const regions: SingaporeRegion[] = ['west', 'central', 'south', 'east', 'north'];
  let peakRegion: SingaporeRegion = 'west';
  let peakPsi = 0;
  for (const r of regions) {
    if (readings.psi_twenty_four_hourly[r] > peakPsi) {
      peakPsi = readings.psi_twenty_four_hourly[r];
      peakRegion = r;
    }
  }
  const peakBand = getPsiBand(peakPsi);
  const peakBandMeta = PSI_BANDS[peakBand];

  // Selected region values
  const activeRegion = selectedRegion;
  const currentPsi = readings.psi_twenty_four_hourly[activeRegion];
  const currentPm25TwentyFour = readings.pm25_twenty_four_hourly[activeRegion];
  const currentPm25OneHr = readings.pm25_one_hourly?.[activeRegion] ?? currentPm25TwentyFour;
  const pm25BandInfo = getPm25Band(currentPm25OneHr);

  return (
    <div className="space-y-6">
      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Island-Wide 24-hr PSI */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span className="font-semibold uppercase tracking-wider">National Average</span>
            <Gauge className="w-4 h-4 text-neutral-400" />
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono tabular-nums text-neutral-900 dark:text-white">
                {nationalPsi}
              </span>
              <span className="text-xs font-medium text-neutral-500">24-hr PSI</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: nationalBandMeta.color }}
              />
              <span style={{ color: nationalBandMeta.color }}>
                {nationalBandMeta.label}
              </span>
              <span className="text-neutral-400 font-normal">· {nationalBandMeta.psiRange}</span>
            </div>
          </div>

          <div className="text-[12px] text-neutral-500 border-t border-neutral-100 dark:border-neutral-800 pt-2.5">
            Island-wide composite standard
          </div>
        </div>

        {/* KPI 2: Highest Regional Reading */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span className="font-semibold uppercase tracking-wider">Regional Peak</span>
            <Activity className="w-4 h-4 text-neutral-400" />
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono tabular-nums text-neutral-900 dark:text-white">
                {peakPsi}
              </span>
              <span className="text-xs font-medium text-neutral-500">24-hr PSI</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-neutral-900 dark:text-white">
                {getRegionDisplayName(peakRegion)}
              </span>
              <span className="text-neutral-400">·</span>
              <span
                className="font-medium"
                style={{ color: peakBandMeta.color }}
              >
                {peakBandMeta.label}
              </span>
            </div>
          </div>

          <div className="text-[12px] text-neutral-500 border-t border-neutral-100 dark:border-neutral-800 pt-2.5 flex items-center justify-between">
            <span>Highest focal pollutant zone</span>
            <button
              type="button"
              onClick={() => onSelectRegion(peakRegion)}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium text-xs underline"
            >
              Focus
            </button>
          </div>
        </div>

        {/* KPI 3: 1-Hour PM2.5 (Real-time indicator) */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span className="font-semibold uppercase tracking-wider">1-hr PM2.5 (Real-Time)</span>
            <AlertCircle className="w-4 h-4 text-neutral-400" />
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono tabular-nums text-neutral-900 dark:text-white">
                {currentPm25OneHr}
              </span>
              <span className="text-xs font-medium text-neutral-500">µg/m³</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: pm25BandInfo.color }}
              />
              <span style={{ color: pm25BandInfo.color }}>
                {pm25BandInfo.band} ({pm25BandInfo.level})
              </span>
            </div>
          </div>

          <div className="text-[12px] text-neutral-500 border-t border-neutral-100 dark:border-neutral-800 pt-2.5">
            Key metric for immediate outdoor guidance
          </div>
        </div>

        {/* KPI 4: Meteorological & Dispersion */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span className="font-semibold uppercase tracking-wider">Atmospheric Flow</span>
            <Wind className="w-4 h-4 text-neutral-400" />
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white">
                {weather.windDirection}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
              <span className="font-mono tabular-nums">{weather.windSpeedKmh} km/h</span>
              <span className="text-neutral-300 dark:text-neutral-700">·</span>
              <span className="font-mono tabular-nums">{weather.temperatureC}°C</span>
              <span className="text-neutral-300 dark:text-neutral-700">·</span>
              <span className="font-mono tabular-nums">{weather.humidityPercent}% RH</span>
            </div>
          </div>

          <div className="text-[12px] text-neutral-500 border-t border-neutral-100 dark:border-neutral-800 pt-2.5 flex items-center justify-between">
            <span>Haze dispersion risk</span>
            <span className={`font-semibold ${
              weather.hazeRiskLevel === 'High' ? 'text-red-600' :
              weather.hazeRiskLevel === 'Elevated' ? 'text-orange-600' :
              weather.hazeRiskLevel === 'Moderate' ? 'text-sky-600' : 'text-emerald-600'
            }`}>
              {weather.hazeRiskLevel}
            </span>
          </div>
        </div>
      </div>

      {/* Regional Selector & Sub-Pollutants Breakdown Table */}
      <div id="pollutants-section" className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Sub-Pollutants & Regional Breakdown
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Detailed NEA parameters for {getRegionDisplayName(activeRegion)}
            </p>
          </div>

          {/* Region Tabs */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-medium overflow-x-auto max-w-full">
            {(['national', 'central', 'north', 'south', 'east', 'west'] as SingaporeRegion[]).map((r) => {
              const isSelected = selectedRegion === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => onSelectRegion(r)}
                  className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap capitalize ${
                    isSelected
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                  }`}
                >
                  {r === 'national' ? 'Island-Wide' : r}
                </button>
              );
            })}
          </div>
        </div>

        {/* Data Table with Tabular Numerals */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Pollutant Parameter</th>
                <th className="py-2.5 px-3">Averaging Period</th>
                <th className="py-2.5 px-3 text-right">Reading Value</th>
                <th className="py-2.5 px-3 text-right">Sub-Index</th>
                <th className="py-2.5 px-3">Air Quality Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-mono">
              {/* PM2.5 */}
              <tr className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors">
                <td className="py-3 px-3 font-sans font-medium text-neutral-900 dark:text-white">
                  Fine Particulate Matter (PM2.5)
                </td>
                <td className="py-3 px-3 font-sans text-neutral-500">24-hour average</td>
                <td className="py-3 px-3 text-right font-semibold text-neutral-900 dark:text-white tabular-nums">
                  {readings.pm25_twenty_four_hourly[activeRegion]} µg/m³
                </td>
                <td className="py-3 px-3 text-right text-neutral-700 dark:text-neutral-300 tabular-nums">
                  {readings.pm25_sub_index[activeRegion]}
                </td>
                <td className="py-3 px-3 font-sans">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {getPsiBand(readings.pm25_sub_index[activeRegion]).toUpperCase()}
                  </span>
                </td>
              </tr>

              {/* 1-hr PM2.5 */}
              <tr className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors">
                <td className="py-3 px-3 font-sans font-medium text-neutral-900 dark:text-white">
                  1-Hour PM2.5 Concentration
                </td>
                <td className="py-3 px-3 font-sans text-neutral-500">1-hour real-time</td>
                <td className="py-3 px-3 text-right font-semibold text-neutral-900 dark:text-white tabular-nums">
                  {readings.pm25_one_hourly?.[activeRegion] ?? readings.pm25_twenty_four_hourly[activeRegion]} µg/m³
                </td>
                <td className="py-3 px-3 text-right text-neutral-400 font-sans tabular-nums">—</td>
                <td className="py-3 px-3 font-sans">
                  <span
                    className="font-semibold"
                    style={{ color: pm25BandInfo.color }}
                  >
                    {pm25BandInfo.band} ({pm25BandInfo.level})
                  </span>
                </td>
              </tr>

              {/* PM10 */}
              <tr className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors">
                <td className="py-3 px-3 font-sans font-medium text-neutral-900 dark:text-white">
                  Coarse Particulate Matter (PM10)
                </td>
                <td className="py-3 px-3 font-sans text-neutral-500">24-hour average</td>
                <td className="py-3 px-3 text-right text-neutral-900 dark:text-white tabular-nums">
                  {readings.pm10_twenty_four_hourly[activeRegion]} µg/m³
                </td>
                <td className="py-3 px-3 text-right text-neutral-700 dark:text-neutral-300 tabular-nums">
                  {readings.pm10_sub_index[activeRegion]}
                </td>
                <td className="py-3 px-3 font-sans text-emerald-600 dark:text-emerald-400 font-semibold">
                  GOOD
                </td>
              </tr>

              {/* Ozone (O3) */}
              <tr className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors">
                <td className="py-3 px-3 font-sans font-medium text-neutral-900 dark:text-white">
                  Ozone (O3)
                </td>
                <td className="py-3 px-3 font-sans text-neutral-500">8-hour maximum</td>
                <td className="py-3 px-3 text-right text-neutral-900 dark:text-white tabular-nums">
                  {readings.o3_eight_hour_max[activeRegion]} µg/m³
                </td>
                <td className="py-3 px-3 text-right text-neutral-700 dark:text-neutral-300 tabular-nums">
                  {readings.o3_sub_index[activeRegion]}
                </td>
                <td className="py-3 px-3 font-sans text-emerald-600 dark:text-emerald-400 font-semibold">
                  GOOD
                </td>
              </tr>

              {/* Sulphur Dioxide (SO2) */}
              <tr className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors">
                <td className="py-3 px-3 font-sans font-medium text-neutral-900 dark:text-white">
                  Sulphur Dioxide (SO2)
                </td>
                <td className="py-3 px-3 font-sans text-neutral-500">24-hour average</td>
                <td className="py-3 px-3 text-right text-neutral-900 dark:text-white tabular-nums">
                  {readings.so2_twenty_four_hourly[activeRegion]} µg/m³
                </td>
                <td className="py-3 px-3 text-right text-neutral-700 dark:text-neutral-300 tabular-nums">
                  {readings.so2_sub_index[activeRegion]}
                </td>
                <td className="py-3 px-3 font-sans text-emerald-600 dark:text-emerald-400 font-semibold">
                  GOOD
                </td>
              </tr>

              {/* Carbon Monoxide (CO) */}
              <tr className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors">
                <td className="py-3 px-3 font-sans font-medium text-neutral-900 dark:text-white">
                  Carbon Monoxide (CO)
                </td>
                <td className="py-3 px-3 font-sans text-neutral-500">8-hour maximum</td>
                <td className="py-3 px-3 text-right text-neutral-900 dark:text-white tabular-nums">
                  {readings.co_eight_hour_max[activeRegion]} mg/m³
                </td>
                <td className="py-3 px-3 text-right text-neutral-700 dark:text-neutral-300 tabular-nums">
                  {readings.co_sub_index[activeRegion]}
                </td>
                <td className="py-3 px-3 font-sans text-emerald-600 dark:text-emerald-400 font-semibold">
                  GOOD
                </td>
              </tr>

              {/* Nitrogen Dioxide (NO2) */}
              <tr className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors">
                <td className="py-3 px-3 font-sans font-medium text-neutral-900 dark:text-white">
                  Nitrogen Dioxide (NO2)
                </td>
                <td className="py-3 px-3 font-sans text-neutral-500">1-hour maximum</td>
                <td className="py-3 px-3 text-right text-neutral-900 dark:text-white tabular-nums">
                  {readings.no2_one_hour_max[activeRegion]} µg/m³
                </td>
                <td className="py-3 px-3 text-right text-neutral-400 font-sans tabular-nums">—</td>
                <td className="py-3 px-3 font-sans text-emerald-600 dark:text-emerald-400 font-semibold">
                  GOOD
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
