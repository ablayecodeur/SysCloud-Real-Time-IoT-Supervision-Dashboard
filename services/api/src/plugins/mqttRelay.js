import fp from 'fastify-plugin';
import mqtt from 'mqtt';

/**
 * Connects to the MQTT broker and re-emits device messages as Fastify events.
 * WebSocket route handlers listen on these events to push data to clients.
 */
async function mqttRelayPlugin(fastify) {
  const prefix = process.env.MQTT_TOPIC_PREFIX ?? 'syscloud';
  const url     = `mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`;

  const client = mqtt.connect(url, {
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASSWORD,
    clientId: `syscloud-api-${process.pid}`,
    reconnectPeriod: 5000,
  });

  client.on('connect', () => {
    fastify.log.info({ url }, 'API connected to MQTT broker');
    client.subscribe([
      `${prefix}/devices/+/telemetry`,
      `${prefix}/devices/+/status`,
    ], { qos: 1 });
  });

  client.on('message', (topic, payload) => {
    try {
      const parts    = topic.split('/');
      const deviceId = parts[2];
      const type     = parts[3]; // 'telemetry' | 'status'
      const data     = JSON.parse(payload.toString());
      fastify.emitter.emit('mqtt:message', { deviceId, type, data });
    } catch {
      // malformed payload — ignore
    }
  });

  client.on('error', (err) => fastify.log.error({ err: err.message }, 'MQTT relay error'));

  fastify.decorate('mqttClient', client);

  fastify.addHook('onClose', async () => {
    client.end(true);
    fastify.log.info('MQTT relay disconnected');
  });
}

export default fp(mqttRelayPlugin, { name: 'mqtt-relay' });
