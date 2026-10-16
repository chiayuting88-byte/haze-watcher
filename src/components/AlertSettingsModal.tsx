import React, { useState } from 'react';
import { AlertTriangle, Bell, BellOff, BellRing, Check, Clock, Info, ShieldCheck, Trash2, Volume2, VolumeX, X } from 'lucide-react';
import { AlertConfiguration, AlertNotificationItem, SingaporeRegion } from '../types/psi';
import { REGIONS, getRegionDisplayName } from '../utils/constants';
import { playAlertChime, requestNotificationPermission, sendPushNotification } from '../services/notificationService';

interface AlertSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AlertConfiguration;
  onSaveConfig: (newConfig: AlertConfiguration) => void;
  alertHistory: AlertNotificationItem[];
  onClearHistory: () => void;
}

export const AlertSettingsModal: React.FC<AlertSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  alertHistory,
  onClearHistory,
}) => {
  const [localConfig, setLocalConfig] = useState<AlertConfiguration>(config);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTogglePush = async () => {
    if (!localConfig.pushEnabled) {
      const permission = await requestNotificationPermission();
      const updated: AlertConfiguration = {
        ...localConfig,
        permission,
        pushEnabled: permission === 'granted',
      };
      setLocalConfig(updated);
      onSaveConfig(updated);

      if (permission === 'granted') {
        sendPushNotification(
          'BreatheSG Notifications Enabled',
          'You will receive instant alerts whenever Singapore air quality reaches unhealthy levels.'
        );
      }
    } else {
      const updated: AlertConfiguration = {
        ...localConfig,
        pushEnabled: false,
      };
      setLocalConfig(updated);
      onSaveConfig(updated);
    }
  };

  const handleTestNotification = () => {
    if (localConfig.soundEnabled) {
      playAlertChime('warning');
    }

    const sent = sendPushNotification(
      'Air Quality Alert (Test): PSI 132 in West Region',
      'Air quality has entered Unhealthy range. Sensitive individuals should reduce prolonged outdoor physical exertion.'
    );

    if (sent) {
      setTestStatus('Notification dispatched to your browser system banner!');
    } else {
      setTestStatus('Push notification permitted, check your desktop/mobile notifications center!');
    }

    setTimeout(() => {
      setTestStatus(null);
    }, 4500);
  };

  const handleSaveAndClose = () => {
    onSaveConfig(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Air Quality Push Alert Settings
              </h2>
              <p className="text-xs text-neutral-500">
                Configure instant browser push notifications for Singapore haze conditions
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Section 1: Browser Push Permission */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Web Push Notifications
                </span>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Receive instant desktop & mobile alerts when PSI exceeds healthy bounds
                </p>
              </div>

              <button
                type="button"
                onClick={handleTogglePush}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localConfig.pushEnabled ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localConfig.pushEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-neutral-500">
                Permission status: <strong className="font-mono">{localConfig.permission}</strong>
              </span>

              {localConfig.pushEnabled && (
                <button
                  type="button"
                  onClick={handleTestNotification}
                  className="px-2.5 py-1 text-xs font-semibold rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Send Test Notification
                </button>
              )}
            </div>

            {testStatus && (
              <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-md">
                {testStatus}
              </div>
            )}
          </div>

          {/* Section 2: Alert Thresholds */}
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Alert Trigger Thresholds
            </span>

            {/* PSI Threshold Selector */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  Trigger Alert When 24-hr PSI Exceeds:
                </span>
                <span className="font-mono font-bold text-neutral-900 dark:text-white">
                  PSI {localConfig.psiThreshold}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: 51, label: 'PSI > 50', desc: 'Moderate Air' },
                  { val: 101, label: 'PSI > 100', desc: 'Unhealthy (Recommended)' },
                  { val: 201, label: 'PSI > 200', desc: 'Very Unhealthy' },
                ].map((tier) => (
                  <button
                    key={tier.val}
                    type="button"
                    onClick={() => {
                      const updated = { ...localConfig, psiThreshold: tier.val };
                      setLocalConfig(updated);
                      onSaveConfig(updated);
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      localConfig.psiThreshold === tier.val
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-semibold'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{tier.label}</div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">{tier.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Monitored Region */}
            <div>
              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1.5">
                Monitored Sector:
              </span>
              <select
                value={localConfig.monitoredRegion}
                onChange={(e) => {
                  const updated = { ...localConfig, monitoredRegion: e.target.value as SingaporeRegion };
                  setLocalConfig(updated);
                  onSaveConfig(updated);
                }}
                className="w-full text-xs font-medium bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white"
              >
                <option value="national">All Singapore (Island-Wide or any sector)</option>
                <option value="west">West Region (Jurong, Tuas, Clementi)</option>
                <option value="central">Central Region (Bishan, Ang Mo Kio, Novena)</option>
                <option value="south">South Region (HarbourFront, CBD, Sentosa)</option>
                <option value="east">East Region (Tampines, Bedok, Changi)</option>
                <option value="north">North Region (Woodlands, Yishun, Sembawang)</option>
              </select>
            </div>

            {/* Sound chime & quiet hours */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {localConfig.soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-neutral-400" />
                  )}
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Audio Alert Chime
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => playAlertChime('warning')}
                    className="text-[11px] text-neutral-500 hover:text-neutral-900 underline"
                  >
                    Test Chime
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...localConfig, soundEnabled: !localConfig.soundEnabled };
                      setLocalConfig(updated);
                      onSaveConfig(updated);
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      localConfig.soundEnabled ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        localConfig.soundEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Recent Alert Log */}
          <div className="space-y-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Recent Notifications Log ({alertHistory.length})
              </span>
              {alertHistory.length > 0 && (
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="text-xs text-neutral-500 hover:text-red-600 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear Log</span>
                </button>
              )}
            </div>

            {alertHistory.length === 0 ? (
              <div className="text-center py-6 text-xs text-neutral-400 bg-neutral-50/50 dark:bg-neutral-800/20 rounded-lg">
                No recent alerts triggered yet. Nominal air quality maintained.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {alertHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs bg-neutral-50 dark:bg-neutral-800/40"
                  >
                    <div className="flex items-center justify-between font-semibold text-neutral-900 dark:text-white">
                      <span>{item.title}</span>
                      <span className="text-[10px] font-mono text-neutral-400">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1">{item.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleSaveAndClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
