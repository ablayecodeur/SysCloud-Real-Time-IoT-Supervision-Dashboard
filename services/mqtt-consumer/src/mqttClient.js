import mqtt from 'mqtt';
import { logger } from './logger.js';

const RECONNECT_PERIOD = 5000;

/**
 * @param {object} handlers
 * @param {(topic: string, payload: Buffer) => void} handlers.onTelemetry
 * @param {(topic: string, payload: Buffer) => void} handlers.onStatus
 * @returns {mqtt.MqttClient}
 */
export function createMqttClient({ onTelemetry, onStatus }) {
  const prefix = process.env.MQTT_TOPIC_PREFIX ?? 'syscloud';
  const url = `mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`;

  const client = mqtt.connect(url, {
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASSWORD,
    clientId: `syscloud-consumer-${process.pid}`,
    clean: true,
    reconnectPeriod: RECONNECT_PERIOD,
    connectTimeout: 10_000,
    keepalive: 30,
    will: {
      topic: `${prefix}/consumers/${process.pid}/status`,
      payload: JSON.stringify({ online: false }),
      qos: 1,
      retain: true,
    },
  });

  client.on('connect', () => {
    logger.info({ url }, 'Connected to MQTT broker');

    const topics = {
      [`${prefix}/devices/+/telemetry`]: { qos: 1 },
      [`${prefix}/devices/+/status`]: { qos: 1 },
    };

    client.subscribe(topics, (err) => {
      if (err) {
        logger.error({ error: err.message }, 'MQTT subscription failed');
        process.exit(1);
      }
      logger.info({ topics: Object.keys(topics) }, 'Subscribed to topics');
    });
  });

  client.on('message', (topic, payload) => {
    if (topic.endsWith('/telemetry')) {
      onTelemetry(topic, payload);
    } else if (topic.endsWith('/status')) {
      onStatus(topic, payload);
    }
  });

  client.on('reconnect', () => logger.warn('Reconnecting to MQTT broker...'));
  client.on('offline', () => logger.warn('MQTT client offline'));
  client.on('error', (err) => logger.error({ error: err.message }, 'MQTT error'));

  return client;
}
