const LOCATIONS = [
  'warehouse-A', 'warehouse-B', 'server-room',
  'office-floor-1', 'office-floor-2', 'rooftop',
];

const FIRMWARE_VERSIONS = ['1.2.0', '1.3.1', '2.0.0'];

/**
 * Generate a device descriptor with randomized but realistic initial state.
 * @param {number} index
 * @returns {object}
 */
export function createDevice(index) {
  return {
    id: `device-${String(index + 1).padStart(3, '0')}`,
    location: LOCATIONS[index % LOCATIONS.length],
    firmware: FIRMWARE_VERSIONS[index % FIRMWARE_VERSIONS.length],
    // Sensor state with random walk
    state: {
      temperature: randomBetween(18, 28),
      humidity:    randomBetween(40, 70),
      pressure:    randomBetween(1000, 1020),
      co2:         randomBetween(400, 600),
      battery:     randomBetween(60, 100),
    },
    uptime: 0,
    online: true,
  };
}

/**
 * Apply a random walk to a device's sensor state.
 * Occasionally injects an out-of-range value to trigger alerts.
 * @param {object} device
 * @returns {object} updated state
 */
export function updateDeviceState(device) {
  const s = device.state;
  const anomaly = Math.random() < 0.03; // 3% chance of anomaly per tick

  return {
    temperature: clamp(s.temperature + jitter(0.5) + (anomaly ? 15 : 0), -20, 80),
    humidity:    clamp(s.humidity    + jitter(1.0),  0, 100),
    pressure:    clamp(s.pressure    + jitter(0.3),  950, 1050),
    co2:         clamp(s.co2         + jitter(10),   350, 2500),
    battery:     clamp(s.battery     - 0.01,         0, 100),
  };
}

function jitter(magnitude) {
  return (Math.random() - 0.5) * 2 * magnitude;
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, Math.round(val * 100) / 100));
}

function randomBetween(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}
