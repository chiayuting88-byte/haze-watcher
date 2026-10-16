/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { AlertBanner } from './components/AlertBanner';
import { AlertSettingsModal } from './components/AlertSettingsModal';
import { Header } from './components/Header';
import { HealthAdvisory } from './components/HealthAdvisory';
import { HistoricalTrend } from './components/HistoricalTrend';
import { MetricCards } from './components/MetricCards';
import { SingaporeMap } from './components/SingaporeMap';
import { SimulationControls } from './components/SimulationControls';
import {
  SIMULATION_SCENARIOS,
  fetchLivePsi,
  generate24HourHistory,
  getSimulatedRecord,
} from './services/psiApi';
import {
  DEFAULT_CONFIG,
  evaluateAirQualityAlert,
  loadAlertConfig,
  loadAlertHistory,
  playAlertChime,
  saveAlertConfig,
  saveAlertHistory,
  sendPushNotification,
} from './services/notificationService';
import {
  AlertConfiguration,
  AlertNotificationItem,
  HourlyDatapoint,
  PsiDataRecord,
  SingaporeRegion,
} from './types/psi';
import { getPsiBand, getRegionDisplayName } from './utils/constants';

export default function App() {
  const [dataRecord, setDataRecord] = useState<PsiDataRecord | null>(null);
  const [history, setHistory] = useState<HourlyDatapoint[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<SingaporeRegion>('national');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeScenario, setActiveScenario] = useState<keyof typeof SIMULATION_SCENARIOS | null>(null);

  // Alert & Notification States
  const [alertConfig, setAlertConfig] = useState<AlertConfiguration>(DEFAULT_CONFIG);
  const [alertHistory, setAlertHistory] = useState<AlertNotificationItem[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Initialize preferences
  useEffect(() => {
    const savedConfig = loadAlertConfig();
    const savedHistory = loadAlertHistory();
    setAlertConfig(savedConfig);
    setAlertHistory(savedHistory);
  }, []);

  // Fetch or update data
  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);

    try {
      if (activeScenario) {
        const simRecord = getSimulatedRecord(activeScenario);
        setDataRecord(simRecord);
        setHistory(generate24HourHistory(simRecord));
      } else {
        const liveRecord = await fetchLivePsi();
        setDataRecord(liveRecord);
        setHistory(generate24HourHistory(liveRecord));
      }
    } catch {
      // Fallback already handled inside fetchLivePsi
    } finally {
      setIsLoading(false);
      if (isManualRefresh) setIsRefreshing(false);
    }
  }, [activeScenario]);

  useEffect(() => {
    loadData();
    // 60-second polling interval for live data
    const timer = setInterval(() => {
      loadData();
    }, 60000);
    return () => clearInterval(timer);
  }, [loadData]);

  // Alert Rule Evaluation
  useEffect(() => {
    if (!dataRecord) return;

    const { newAlerts } = evaluateAirQualityAlert(dataRecord, alertConfig, alertHistory);

    if (newAlerts.length > 0) {
      // Sound alert if enabled
      if (alertConfig.soundEnabled) {
        playAlertChime('critical');
      }

      // Dispatch Web Push Notifications
      if (alertConfig.pushEnabled) {
        newAlerts.forEach((alert) => {
          sendPushNotification(alert.title, alert.message, alert.id);
        });
      }

      // Update history
      const updatedHistory = [...newAlerts, ...alertHistory].slice(0, 30);
      setAlertHistory(updatedHistory);
      saveAlertHistory(updatedHistory);
    }
  }, [dataRecord, alertConfig]);

  const handleSaveConfig = (newConfig: AlertConfiguration) => {
    setAlertConfig(newConfig);
    saveAlertConfig(newConfig);
  };

  const handleClearHistory = () => {
    setAlertHistory([]);
    saveAlertHistory([]);
  };

  const handleScenarioChange = (scenario: keyof typeof SIMULATION_SCENARIOS | null) => {
    setActiveScenario(scenario);
    if (scenario) {
      const simRecord = getSimulatedRecord(scenario);
      setDataRecord(simRecord);
      setHistory(generate24HourHistory(simRecord));

      // Trigger test alert if simulated unhealthy
      if (scenario === 'unhealthy_alert' || scenario === 'severe_haze') {
        if (alertConfig.soundEnabled) {
          playAlertChime('critical');
        }
        if (alertConfig.pushEnabled) {
          sendPushNotification(
            `Haze Alert (Simulated): PSI ${simRecord.readings.psi_twenty_four_hourly.west} in West Region`,
            'Air quality has entered Unhealthy range. Reduce prolonged strenuous outdoor exertion.'
          );
        }
      }
    } else {
      loadData(true);
    }
  };

  if (isLoading || !dataRecord) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
          Connecting to Singapore NEA Air Quality Feed...
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          Loading live PSI, PM2.5, and regional sector stations
        </p>
      </div>
    );
  }

  // Determine highest regional PSI for the alert banner
  const regions: SingaporeRegion[] = ['west', 'central', 'south', 'east', 'north'];
  let highestRegion: SingaporeRegion = 'west';
  let highestPsi = 0;
  for (const r of regions) {
    if (dataRecord.readings.psi_twenty_four_hourly[r] > highestPsi) {
      highestPsi = dataRecord.readings.psi_twenty_four_hourly[r];
      highestRegion = r;
    }
  }
  const highestBand = getPsiBand(highestPsi);
  const unreadAlerts = alertHistory.filter((a) => !a.read).length;

  return (
    <div className="min-h-screen bg-neutral-100/60 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans antialiased">
      {/* Simulation & Feed Status Bar */}
      <SimulationControls
        currentSource={dataRecord.source}
        activeScenario={activeScenario}
        onSelectScenario={handleScenarioChange}
        lastUpdated={dataRecord.updateTimestamp}
      />

      {/* Top Bar Header */}
      <Header
        onOpenAlertSettings={() => setIsSettingsOpen(true)}
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
        alertConfig={alertConfig}
        unreadAlertsCount={unreadAlerts}
      />

      {/* Conditional Alert Banner */}
      <AlertBanner
        highestRegion={highestRegion}
        highestPsi={highestPsi}
        highestBand={highestBand}
        pushEnabled={alertConfig.pushEnabled}
        onOpenAlertSettings={() => setIsSettingsOpen(true)}
        isSimulated={Boolean(activeScenario)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Section 1: Interactive Sector Map */}
        <div id="map-section">
          <SingaporeMap
            readings={dataRecord.readings}
            weather={dataRecord.weather}
            selectedRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
          />
        </div>

        {/* Section 2: 4-Column KPI Strip & Pollutants Data Grid */}
        <div id="kpi-section">
          <MetricCards
            readings={dataRecord.readings}
            weather={dataRecord.weather}
            selectedRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
          />
        </div>

        {/* Section 3: Official Health Advisory */}
        <HealthAdvisory
          currentPsi={dataRecord.readings.psi_twenty_four_hourly[selectedRegion]}
          currentPm25={
            dataRecord.readings.pm25_one_hourly?.[selectedRegion] ??
            dataRecord.readings.pm25_twenty_four_hourly[selectedRegion]
          }
          region={selectedRegion}
        />

        {/* Section 4: 24-Hour Historical Trend Chart */}
        <HistoricalTrend
          history={history}
          selectedRegion={selectedRegion}
          onSelectRegion={setSelectedRegion}
        />
      </main>

      {/* Push Notification Configuration Modal */}
      <AlertSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={alertConfig}
        onSaveConfig={handleSaveConfig}
        alertHistory={alertHistory}
        onClearHistory={handleClearHistory}
      />

      {/* Clean Footer with NEA attribution and quiet metadata */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 py-6 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="font-semibold text-neutral-700 dark:text-neutral-300">
              BreatheSG · Singapore Air Quality & Haze Early Warning
            </div>
            <p className="text-[11px] text-neutral-400">
              Air quality indices based on official National Environment Agency (NEA) and Ministry of Health (MOH) standards.
            </p>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-neutral-500">
            <span>Data Feed: data.gov.sg</span>
            <span aria-hidden="true">·</span>
            <span>24-hr PSI & 1-hr PM2.5</span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-neutral-900 dark:hover:text-white underline"
            >
              Configure Push Alerts
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
