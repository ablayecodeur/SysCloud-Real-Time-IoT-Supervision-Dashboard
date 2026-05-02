import { Suspense } from 'react';
import { Cpu, Wifi, AlertTriangle, Thermometer } from 'lucide-react';
import { fetchDevices, fetchAlerts, fetchAlertSummary, fetchMetrics } from '@/lib/api';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentAlerts } from '@/components/dashboard/RecentAlerts';
import { SensorChart } from '@/components/charts/SensorChart';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [devices, alerts, summary, temperatureData] = await Promise.all([
    fetchDevices().catch(() => []),
    fetchAlerts({ start: '-24h', limit: '8' }).catch(() => []),
    fetchAlertSummary().catch(() => ({ warning: 0, critical: 0 })),
    fetchMetrics({ field: 'temperature', start: '-1h', window: '1m' }).catch(() => []),
  ]);

  const onlineCount = devices.filter((d) => d.online).length;
  const totalAlerts = summary.warning + summary.critical;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Devices"
          value={devices.length}
          icon={Cpu}
          trend="All registered devices"
        />
        <StatsCard
          label="Online"
          value={onlineCount}
          icon={Wifi}
          variant={onlineCount === devices.length ? 'success' : 'warning'}
          trend={`${devices.length - onlineCount} offline`}
        />
        <StatsCard
          label="Alerts 24h"
          value={totalAlerts}
          icon={AlertTriangle}
          variant={summary.critical > 0 ? 'danger' : totalAlerts > 0 ? 'warning' : 'success'}
          trend={`${summary.critical} critical · ${summary.warning} warnings`}
        />
        <StatsCard
          label="Sensors Active"
          value={onlineCount * 5}
          icon={Thermometer}
          variant="default"
          trend="Temp · Humidity · CO₂ · …"
        />
      </div>

      {/* Temperature chart */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">
          Temperature — last hour (all devices)
        </h2>
        <Suspense fallback={<div className="h-60 animate-pulse bg-slate-700 rounded" />}>
          <SensorChart data={temperatureData} field="temperature" unit="°C" />
        </Suspense>
      </div>

      {/* Recent alerts */}
      <RecentAlerts alerts={alerts} />
    </div>
  );
}
