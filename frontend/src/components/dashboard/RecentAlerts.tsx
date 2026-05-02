import { cn, relativeTime, severityColor } from '@/lib/utils';
import type { Alert } from '@/types';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface RecentAlertsProps {
  alerts: Alert[];
}

export function RecentAlerts({ alerts }: RecentAlertsProps) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Recent Alerts</h2>
        <p className="text-sm text-slate-500 text-center py-8">No alerts in the last 24h</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
      <h2 className="text-sm font-semibold text-slate-300 mb-4">Recent Alerts</h2>

      <ul className="space-y-2">
        {alerts.slice(0, 8).map((alert, i) => {
          const Icon = alert.severity === 'critical' ? AlertCircle : AlertTriangle;
          return (
            <li key={i} className="flex items-start gap-3 py-2 border-b border-slate-700/50 last:border-0">
              <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', severityColor(alert.severity))} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-200 truncate">
                  <span className="font-medium">{alert.device_id}</span>
                  {' — '}
                  <span className="capitalize">{alert.field}</span>
                  {': '}
                  <span className={severityColor(alert.severity)}>
                    {alert.value.toFixed(1)}
                  </span>
                </p>
                <p className="text-xs text-slate-500">{relativeTime(alert._time)}</p>
              </div>
              <span className={cn(
                'text-xs font-medium px-1.5 py-0.5 rounded shrink-0',
                alert.severity === 'critical'
                  ? 'bg-red-900/50 text-red-300'
                  : 'bg-amber-900/50 text-amber-300',
              )}>
                {alert.severity}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
