import { useState, useEffect } from 'react';

export interface BatteryStatus {
  level: number; // 0.0 to 1.0 (e.g., 0.18 = 18%)
  percentage: number; // 0 to 100
  isCharging: boolean;
  isSupported: boolean;
  isLowBattery: boolean; // < 20% and not charging
  chargingTime?: number;
  dischargingTime?: number;
}

export function useBatteryStatus(): BatteryStatus {
  const [batteryState, setBatteryState] = useState<BatteryStatus>({
    level: 1,
    percentage: 100,
    isCharging: true,
    isSupported: false,
    isLowBattery: false,
  });

  useEffect(() => {
    let batteryInstance: any = null;

    const updateBatteryInfo = (battery: any) => {
      const level = typeof battery.level === 'number' ? battery.level : 1;
      const percentage = Math.round(level * 100);
      const isCharging = Boolean(battery.charging);
      const isLowBattery = level <= 0.20 && !isCharging;

      setBatteryState({
        level,
        percentage,
        isCharging,
        isSupported: true,
        isLowBattery,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime,
      });
    };

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any)
        .getBattery()
        .then((battery: any) => {
          batteryInstance = battery;
          updateBatteryInfo(battery);

          const handleLevelChange = () => updateBatteryInfo(battery);
          const handleChargingChange = () => updateBatteryInfo(battery);

          battery.addEventListener('levelchange', handleLevelChange);
          battery.addEventListener('chargingchange', handleChargingChange);

          return () => {
            battery.removeEventListener('levelchange', handleLevelChange);
            battery.removeEventListener('chargingchange', handleChargingChange);
          };
        })
        .catch(() => {
          // Battery API denied or unsupported in iframe/browser
          setBatteryState((prev) => ({ ...prev, isSupported: false }));
        });
    }

    return () => {
      // cleanup if needed
    };
  }, []);

  return batteryState;
}
