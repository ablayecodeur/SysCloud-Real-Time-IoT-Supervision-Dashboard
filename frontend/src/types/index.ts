export type SensorField = 'temperature' | 'humidity' | 'pressure' | 'co2' | 'battery';

export interface SensorReadings {
  temperature?: number;
  humidity?: number;
  pressure?: number;
  co2?: number;
  battery?: number;
}

export interface Device {
  device_id: string;
  location?: string;
  online: boolean;
  battery: number;
  _time: string;
}

export interface Telemetry {
  device_id: string;
  location?: string;
  _time: string;
  sensors: SensorReadings;
}

export interface MetricPoint {
  _time: string;
  _value: number;
  device_id?: string;
  _field?: string;
}

export interface Alert {
  _time: string;
  device_id: string;
  field: string;
  severity: 'warning' | 'critical';
  value: number;
  message?: string;
}

export interface AlertSummary {
  warning: number;
  critical: number;
}

export type WsMessageType = 'telemetry' | 'status';

export interface WsMessage {
  type: WsMessageType;
  deviceId: string;
  data: Record<string, unknown>;
  ts: string;
}
