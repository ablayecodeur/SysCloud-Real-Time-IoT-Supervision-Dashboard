import { fetchAlerts, fetchAlertSummary } from '@/lib/api';
import { cn, relativeTime, severityColor } from '@/lib/utils';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AlertsPage() {
  const [alerts, summary] = await Promise.all([
    fetchAlerts({ start: '-24h', limit: '100' }).catch(() => []),
    fetchAlertSummary().catch(() => ({ warning: 0, critical: 0 })),
  ]);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <p className="text-2xl font-bold text-white">{summary.critical}</p>
            <p className="text-xs text-slate-400">Critical</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-2xl font-bold text-white">{summary.warning}</p>
            <p className="text-xs text-slate-400">Warnings</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
          <div>
            <p className="text-2xl font-bold text-white">{alerts.length}</p>
            <p className="text-xs text-slate-400">Total (24h)</p>
          </div>
        </div>
      </div>

      {/* Alert table */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700">
          <h2 className="text-sm font-semibold text-slate-300">Alert log — last 24h</h2>
        </div>

        {alerts.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No alerts in the last 24 hours</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase border-b border-slate-700">
                <th className="text-left px-5 py-2">Time</th>
                <th className="text-left px-3 py-2">Device</th>
                <th className="text-left px-3 py-2">Sensor</th>
                <th className="text-right px-3 py-2">Value</th>
                <th className="text-left px-3 py-2">Severity</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert, i) => (
                <tr
                  key={i}
                  className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-5 py-2.5 text-slate-400 whitespace-nowrap">
                    {relativeTime(alert._time)}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-white">{alert.device_id}</td>
                  <td className="px-3 py-2.5 text-slate-300 capitalize">{alert.field}</td>
                  <td className={cn('px-3 py-2.5 text-right font-mono', severityColor(alert.severity))}>
                    {alert.value.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={cn(
                      'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                      alert.severity === 'critical'
                        ? 'bg-red-900/50 text-red-300'
                        : 'bg-amber-900/50 text-amber-300',
                    )}>
                      {alert.severity === 'critical'
                        ? <AlertCircle className="w-3 h-3" />
                        : <AlertTriangle className="w-3 h-3" />
                      }
                      {alert.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
