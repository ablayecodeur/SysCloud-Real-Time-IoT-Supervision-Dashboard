/**
 * Sensor alert thresholds for each field.
 */
export const THRESHOLDS = {
  temperature: { min: -20, max: 60, unit: '°C' },
  humidity:    { min: 0,   max: 100, unit: '%' },
  pressure:    { min: 800, max: 1100, unit: 'hPa' },
  co2:         { min: 0,   max: 2000, unit: 'ppm' },
  battery:     { min: 10,  max: 100, unit: '%' },
};

/**
 * Parse a telemetry MQTT payload into a structured object.
 * Expected topic: {prefix}/devices/{deviceId}/telemetry
 *
 * @param {string} topic
 * @param {Buffer} payload
 * @returns {{ deviceId: string, location: string, timestamp: number, sensors: object } | null}
 */
export function parseTelemetry(topic, payload) {
  try {
    const parts = topic.split('/');
    const deviceId = parts[2];
    const data = JSON.parse(payload.toString());

    return {
      deviceId: data.deviceId ?? deviceId,
      location: data.location ?? 'unknown',
      firmware: data.firmware ?? 'unknown',
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      sensors: sanitizeSensors(data.sensors ?? {}),
    };
  } catch {
    return null;
  }
}

/**
 * Parse a device status MQTT payload.
 * Expected topic: {prefix}/devices/{deviceId}/status
 *
 * @param {string} topic
 * @param {Buffer} payload
 * @returns {{ deviceId: string, online: boolean, battery: number, rssi: number, uptime: number, timestamp: Date } | null}
 */
export function parseStatus(topic, payload) {
  try {
    const parts = topic.split('/');
    const deviceId = parts[2];
    const data = JSON.parse(payload.toString());

    return {
      deviceId: data.deviceId ?? deviceId,
      online: data.online !== false,
      battery: Number(data.battery ?? 100),
      rssi: Number(data.rssi ?? 0),
      uptime: Number(data.uptime ?? 0),
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
    };
  } catch {
    return null;
  }
}

/**
 * Check sensor values against thresholds and return any violations.
 *
 * @param {string} deviceId
 * @param {object} sensors
 * @returns {Array<{ field: string, value: number, threshold: object, severity: string }>}
 */
export function detectAlerts(deviceId, sensors) {
  const alerts = [];

  for (const [field, value] of Object.entries(sensors)) {
    const threshold = THRESHOLDS[field];
    if (!threshold) continue;

    if (value < threshold.min || value > threshold.max) {
      alerts.push({
        deviceId,
        field,
        value,
        threshold,
        severity: value < threshold.min * 0.9 || value > threshold.max * 1.1 ? 'critical' : 'warning',
        message: `${field} ${value}${threshold.unit} out of range [${threshold.min}, ${threshold.max}]`,
        timestamp: new Date(),
      });
    }
  }

  return alerts;
}

function sanitizeSensors(raw) {
  const result = {};
  for (const [key, val] of Object.entries(raw)) {
    const num = Number(val);
    if (!isNaN(num)) result[key] = num;
  }
  return result;
}
