import { AlertConfiguration, AlertNotificationItem, PsiDataRecord, SingaporeRegion } from '../types/psi';
import { getPsiBand, getRegionDisplayName } from '../utils/constants';

const STORAGE_KEY_CONFIG = 'breathe_sg_alert_config';
const STORAGE_KEY_HISTORY = 'breathe_sg_alert_history';

export const DEFAULT_CONFIG: AlertConfiguration = {
  pushEnabled: false,
  permission: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported',
  psiThreshold: 100, // Trigger when entering 'Unhealthy' (PSI > 100)
  pm25Threshold: 55, // 1-hr PM2.5 > 55 µg/m³ (Band II/III boundary)
  monitoredRegion: 'national', // 'national' monitors island-wide or any region exceeding
  soundEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: '23:00',
  quietHoursEnd: '07:00',
};

// Play an alert sound using Web Audio API synthesized tones
export function playAlertChime(severity: 'warning' | 'critical' | 'test' = 'warning') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    if (severity === 'critical') {
      // Urgent double beep
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.setValueAtTime(659.25, now + 0.15); // E5
      osc1.frequency.setValueAtTime(880, now + 0.3); // A5

      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(330, now + 0.15);
      osc2.frequency.setValueAtTime(440, now + 0.3);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    } else {
      // Pleasant notice chime
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.setValueAtTime(880, now + 0.12); // A5

      osc2.frequency.setValueAtTime(293.66, now);
      osc2.frequency.setValueAtTime(440, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    }

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);
  } catch {
    // Audio might be blocked by browser autoplay policy until user gesture
  }
}

export function loadAlertConfig(): AlertConfiguration {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      const currentPerm = 'Notification' in window ? Notification.permission : 'unsupported';
      return { ...DEFAULT_CONFIG, ...parsed, permission: currentPerm };
    }
  } catch {
    // ignore json error
  }
  return DEFAULT_CONFIG;
}

export function saveAlertConfig(config: AlertConfiguration): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export function loadAlertHistory(): AlertNotificationItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

export function saveAlertHistory(history: AlertNotificationItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history.slice(0, 30)));
  } catch {
    // ignore
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'denied';
  }
}

export function sendPushNotification(
  title: string,
  body: string,
  tag: string = 'breathe-sg-alert'
): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        tag,
        icon: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=128&q=80',
        badge: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=64&q=80',
      });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function evaluateAirQualityAlert(
  data: PsiDataRecord,
  config: AlertConfiguration,
  existingHistory: AlertNotificationItem[]
): {
  newAlerts: AlertNotificationItem[];
  highestPsi: { region: SingaporeRegion; value: number };
} {
  const regions: SingaporeRegion[] = ['west', 'central', 'south', 'east', 'north'];
  const psiVals = data.readings.psi_twenty_four_hourly;
  const pm25Vals = data.readings.pm25_twenty_four_hourly;

  let highestRegion: SingaporeRegion = 'national';
  let highestVal = 0;

  for (const r of regions) {
    if (psiVals[r] > highestVal) {
      highestVal = psiVals[r];
      highestRegion = r;
    }
  }

  const triggeredAlerts: AlertNotificationItem[] = [];
  const targetRegions = config.monitoredRegion === 'national' ? regions : [config.monitoredRegion];

  // Avoid spamming if alert was sent in the last 15 minutes for the same region & severity
  const now = Date.now();
  const recentThresholdMs = 15 * 60 * 1000;

  for (const r of targetRegions) {
    const rPsi = psiVals[r];
    const rPm25 = pm25Vals[r];
    const band = getPsiBand(rPsi);

    if (rPsi >= config.psiThreshold || rPm25 >= config.pm25Threshold) {
      const isUnhealthyOrWorse = rPsi > 100 || rPm25 > 55;
      
      const alreadyTriggered = existingHistory.some((item) => {
        const itemTime = new Date(item.timestamp).getTime();
        return (
          item.region === r &&
          item.band === band &&
          now - itemTime < recentThresholdMs
        );
      });

      if (!alreadyTriggered) {
        const title = isUnhealthyOrWorse
          ? `Air Quality Alert: ${getRegionDisplayName(r)} is ${band.replace('_', ' ').toUpperCase()}`
          : `Air Quality Advisory: ${getRegionDisplayName(r)} PSI ${rPsi}`;

        const message = `24-hr PSI has reached ${rPsi} (PM2.5: ${rPm25} µg/m³). Prolonged outdoor exertion should be avoided by sensitive individuals.`;

        const newAlert: AlertNotificationItem = {
          id: `alert-${r}-${now}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toISOString(),
          region: r,
          band,
          metric: 'PSI',
          value: rPsi,
          title,
          message,
          read: false,
        };

        triggeredAlerts.push(newAlert);
      }
    }
  }

  return {
    newAlerts: triggeredAlerts,
    highestPsi: { region: highestRegion, value: highestVal },
  };
}
