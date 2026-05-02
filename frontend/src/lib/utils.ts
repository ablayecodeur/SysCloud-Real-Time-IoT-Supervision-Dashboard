import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatValue(field: string, value: number): string {
  const units: Record<string, string> = {
    temperature: '°C',
    humidity:    '%',
    pressure:    ' hPa',
    co2:         ' ppm',
    battery:     '%',
  };
  return `${value.toFixed(1)}${units[field] ?? ''}`;
}

export function severityColor(severity: 'warning' | 'critical'): string {
  return severity === 'critical' ? 'text-red-500' : 'text-amber-500';
}

export function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}
