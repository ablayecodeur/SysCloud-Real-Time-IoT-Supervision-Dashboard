import mqtt from 'mqtt';
import pino from 'pino';
import { createDevice, updateDeviceState } from './devices.js';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { service: 'simulator' },
});

const prefix    = process.env.MQTT_TOPIC_PREFIX ?? 'syscloud';
const count     = parseInt(process.env.DEVICE_COUNT ?? '5', 10);
const interval  = parseInt(process.env.PUBLISH_INTERVAL_MS ?? '5000', 10);
const url       = `mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`;

const devices = Array.from({ length: count }, (_, i) => createDevice(i));

const client = mqtt.connect(url, {
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASSWORD,
  clientId: `syscloud-simulator-${process.pid}`,
  reconnectPeriod: 5000,
});

client.on('connect', () => {
  logger.info({ url, devices: count, intervalMs: interval }, 'Simulator connected');

  // Publish status for each device immediately
  for (const device of devices) {
    publishStatus(device);
  }

  // Rolling telemetry loop — stagger start times to avoid thundering herd
  devices.forEach((device, i) => {
    setTimeout(() => {
      setInterval(() => tick(device), interval);
    }, i * (interval / count));
  });
});

client.on('error',     (err) => logger.error({ err: err.message }, 'MQTT error'));
client.on('reconnect', ()    => logger.warn('Reconnecting...'));

function tick(device) {
  device.state  = updateDeviceState(device);
  device.uptime += interval / 1000;

  publishTelemetry(device);

  // Publish status every 6 ticks (~30 s at default interval)
  if (Math.round(device.uptime) % 30 === 0) {
    publishStatus(device);
  }
}

function publishTelemetry(device) {
  const payload = JSON.stringify({
    deviceId:  device.id,
    location:  device.location,
    firmware:  device.firmware,
    timestamp: Date.now(),
    sensors:   device.state,
  });

  client.publish(
    `${prefix}/devices/${device.id}/telemetry`,
    payload,
    { qos: 1 },
    (err) => {
      if (err) logger.warn({ deviceId: device.id, err: err.message }, 'Publish failed');
      else logger.debug({ deviceId: device.id, sensors: device.state }, 'Telemetry published');
    },
  );
}

function publishStatus(device) {
  const payload = JSON.stringify({
    deviceId:  device.id,
    timestamp: Date.now(),
    online:    device.online,
    battery:   device.state.battery,
    rssi:      Math.floor(Math.random() * -30) - 50,
    uptime:    Math.round(device.uptime),
  });

  client.publish(
    `${prefix}/devices/${device.id}/status`,
    payload,
    { qos: 1, retain: true },
  );
}

process.on('SIGTERM', () => { client.end(true); process.exit(0); });
process.on('SIGINT',  () => { client.end(true); process.exit(0); });
