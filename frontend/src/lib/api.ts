import type { Alert, AlertSummary, Device, MetricPoint } from '@/types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}/api/v1${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`API ${path} → ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function fetchDevices(): Promise<Device[]> {
  const data = await get<{ devices: Device[] }>('/devices');
  return data.devices;
}

export async function fetchDevice(id: string): Promise<Device> {
  const data = await get<{ device: Device }>(`/devices/${id}`);
  return data.device;
}

export async function fetchMetrics(params: {
  deviceId?: string;
  field?: string;
  start?: string;
  stop?: string;
  window?: string;
}): Promise<MetricPoint[]> {
  const data = await get<{ data: MetricPoint[] }>('/metrics', {
    ...(params.deviceId && { deviceId: params.deviceId }),
    ...(params.field    && { field:    params.field }),
    ...(params.start    && { start:    params.start }),
    ...(params.stop     && { stop:     params.stop }),
    ...(params.window   && { window:   params.window }),
  });
  return data.data;
}

export async function fetchAlerts(params?: {
  deviceId?: string;
  severity?: string;
  start?: string;
  limit?: string;
}): Promise<Alert[]> {
  const data = await get<{ alerts: Alert[] }>('/alerts', params as Record<string, string>);
  return data.alerts;
}

export async function fetchAlertSummary(): Promise<AlertSummary> {
  const data = await get<{ summary: AlertSummary }>('/alerts/summary');
  return data.summary;
}
