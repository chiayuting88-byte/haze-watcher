import React from 'react';
import { AlertTriangle, Bell, BellRing, CheckCircle2, ChevronRight, Volume2, X } from 'lucide-react';
import { AirQualityBand, SingaporeRegion } from '../types/psi';
import { PSI_BANDS, getRegionDisplayName } from '../utils/constants';

interface AlertBannerProps {
  highestRegion: SingaporeRegion;
  highestPsi: number;
  highestBand: AirQualityBand;
  pushEnabled: boolean;
  onOpenAlertSettings: () => void;
  onDismiss?: () => void;
  isSimulated?: boolean;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  highestRegion,
  highestPsi,
  highestBand,
  pushEnabled,
  onOpenAlertSettings,
  onDismiss,
  isSimulated,
}) => {
  const isUnhealthy = highestBand === 'unhealthy' || highestBand === 'very_unhealthy' || highestBand === 'hazardous';
  const bandInfo = PSI_BANDS[highestBand];

  if (!isUnhealthy && highestBand === 'good') {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800/60 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Air Quality is Good island-wide</strong> (National PSI {highestPsi}). All outdoor activities can proceed normally.
            </span>
          </div>
          {!pushEnabled && (
            <button
              type="button"
              onClick={onOpenAlertSettings}
              className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 font-semibold underline text-xs whitespace-nowrap"
            >
              Enable Unhealthy Haze Alerts
            </button>
          )}
        </div>
      </div>
    );
  }

  if (highestBand === 'moderate') {
    return (
      <div className="bg-sky-50 dark:bg-sky-950/30 border-b border-sky-200 dark:border-sky-800/50 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-sky-900 dark:text-sky-200">
            <span className="font-semibold px-1.5 py-0.5 rounded bg-sky-200/60 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200">
              MODERATE
            </span>
            <span>
              Air quality is in Moderate range. Peak reading is in <strong>{getRegionDisplayName(highestRegion)}</strong> (PSI {highestPsi}).
            </span>
          </div>
          {!pushEnabled && (
            <button
              type="button"
              onClick={onOpenAlertSettings}
              className="text-sky-700 dark:text-sky-300 hover:text-sky-900 font-semibold underline text-xs whitespace-nowrap"
            >
              Get Push Alert If PSI Exceeds 100
            </button>
          )}
        </div>
      </div>
    );
  }

  // Unhealthy, Very Unhealthy, or Hazardous Alert Banner
  return (
    <div
      className={`border-b px-4 py-3 transition-colors ${
        highestBand === 'hazardous'
          ? 'bg-purple-900 text-white border-purple-950'
          : highestBand === 'very_unhealthy'
          ? 'bg-red-700 text-white border-red-800'
          : 'bg-orange-600 text-white border-orange-700'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-1.5 rounded-lg bg-white/20 shrink-0">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-black/25 px-2 py-0.5 rounded">
                AIR QUALITY ALERT · {bandInfo.label.toUpperCase()}
              </span>
              {isSimulated && (
                <span className="text-[11px] bg-white/25 px-1.5 py-0.5 rounded text-white font-mono">
                  SIMULATION ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-medium mt-0.5 text-white/95">
              PSI has climbed to <span className="font-mono font-bold">{highestPsi}</span> in {getRegionDisplayName(highestRegion)}. {bandInfo.generalAdvisory}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs shrink-0 ml-auto sm:ml-0">
          <a
            href="#advisory-section"
            className="px-3 py-1.5 bg-white text-neutral-900 hover:bg-neutral-100 rounded-md font-semibold transition-colors flex items-center gap-1 shadow-xs"
          >
            <span>Health Advisory</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={onOpenAlertSettings}
            className="px-3 py-1.5 bg-black/25 hover:bg-black/35 text-white rounded-md font-medium transition-colors flex items-center gap-1.5"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Alert Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
