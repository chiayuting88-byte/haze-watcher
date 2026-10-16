import React from 'react';
import { Bell, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { AlertConfiguration } from '../types/psi';

interface HeaderProps {
  onOpenAlertSettings: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  alertConfig: AlertConfiguration;
  unreadAlertsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAlertSettings,
  onRefresh,
  isRefreshing,
  alertConfig,
  unreadAlertsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <a href="/" className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white whitespace-nowrap">
              BreatheSG
            </a>
            <span className="hidden sm:inline-block text-[11px] font-mono text-neutral-500 uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
              NEA Live Air Quality
            </span>
          </div>

          {/* Zone 2: 4-5 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600 dark:text-neutral-400">
            <a href="#map-section" className="hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap">
              Sector Map
            </a>
            <a href="#kpi-section" className="hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap">
              Live Readings
            </a>
            <a href="#advisory-section" className="hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap">
              Health Advisory
            </a>
            <a href="#trend-section" className="hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap">
              24-Hour Trends
            </a>
            <a href="#pollutants-section" className="hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap">
              Sub-Pollutants
            </a>
          </nav>

          {/* Zone 3: 1 primary action button + refresh affordance */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Refresh Live Data"
              aria-label="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onOpenAlertSettings}
              className={`relative px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 shadow-xs ${
                alertConfig.pushEnabled
                  ? 'bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{alertConfig.pushEnabled ? 'Alert Rules Active' : 'Setup Air Alerts'}</span>
              {unreadAlertsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-orange-500" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
