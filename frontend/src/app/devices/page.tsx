import { fetchDevices } from '@/lib/api';
import { DeviceCard } from '@/components/devices/DeviceCard';
import { Cpu } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DevicesPage() {
  const devices = await fetchDevices().catch(() => []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Devices</h1>
          <p className="text-sm text-slate-400">{devices.length} device(s) registered</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Cpu className="w-4 h-4" />
          Live updates via WebSocket
        </div>
      </div>

      {devices.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-16 text-center">
          <Cpu className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No devices found.</p>
          <p className="text-slate-500 text-xs mt-1">
            Start the simulator with <code className="bg-slate-700 px-1 rounded">make dev-sim</code>
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => (
            <DeviceCard key={device.device_id} device={device} />
          ))}
        </div>
      )}
    </div>
  );
}
