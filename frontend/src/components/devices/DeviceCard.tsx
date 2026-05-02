'use client';

import { useState, useCallback } from 'react';
import { Cpu, MapPin, BatteryMedium } from 'lucide-react';
import { cn, formatValue, relativeTime } from '@/lib/utils';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { Device, SensorReadings, WsMessage } from '@/types';

interface DeviceCardProps {
  device: Device;
}

export function DeviceCard({ device }: DeviceCardProps) {
  const [sensors, setSensors] = useState<SensorReadings>({});
  const [lastSeen, setLastSeen] = useState(device._time);

  const onMessage = useCallback((msg: WsMessage) => {
    if (msg.deviceId !== device.device_id) return;
    if (msg.type === 'telemetry') {
      setSensors(msg.data.sensors as SensorReadings);
      setLastSeen(msg.ts);
    }
  }, [device.device_id]);

  useWebSocket({ deviceId: device.device_id, onMessage });

  const sensorEntries = Object.entries(sensors).filter(([, v]) => v !== undefined);

  return (
    <div className={cn(
      'rounded-xl border bg-slate-800 p-5 transition-all',
      device.online ? 'border-slate-700' : 'border-red-900/50 opacity-70',
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-white text-sm">{device.device_id}</span>
        </div>
        <span className={cn(
          'text-xs font-medium px-2 py-0.5 rounded-full',
          device.online
            ? 'bg-green-900/50 text-green-300'
            : 'bg-red-900/50 text-red-300',
        )}>
          {device.online ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Location & battery */}
      <div className="flex items-center gap-4 mb-4 text-xs text-slate-400">
        {device.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {device.location}
          </span>
        )}
        <span className="flex items-center gap-1">
          <BatteryMedium className="w-3 h-3" />
          {device.battery?.toFixed(0)}%
        </span>
      </div>

      {/* Sensor readings */}
      {sensorEntries.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {sensorEntries.map(([field, value]) => (
            <div key={field} className="bg-slate-700/50 rounded-lg px-3 py-2">
              <p className="text-xs text-slate-400 capitalize">{field}</p>
              <p className="text-sm font-semibold text-white">
                {formatValue(field, value as number)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500 italic">Waiting for data…</p>
      )}

      <p className="mt-3 text-xs text-slate-600">
        Last seen {relativeTime(lastSeen)}
      </p>
    </div>
  );
}
