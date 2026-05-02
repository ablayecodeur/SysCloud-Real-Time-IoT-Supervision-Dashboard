/**
 * WebSocket endpoint: ws://host/stream
 *
 * On connect, clients can send a JSON filter:
 *   { "deviceId": "device-001" }   → receive only that device's events
 *   {}                              → receive all devices
 *
 * Server pushes:
 *   { type: "telemetry", deviceId, data, ts }
 *   { type: "status",    deviceId, data, ts }
 */
export default async function streamRoutes(fastify) {
  fastify.get('/stream', { websocket: true }, (socket, request) => {
    let filter = null;

    socket.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        filter = msg.deviceId ?? null;
      } catch {
        // ignore invalid filter messages
      }
    });

    const onMqttMessage = ({ deviceId, type, data }) => {
      if (filter && deviceId !== filter) return;
      if (socket.readyState !== socket.OPEN) return;

      socket.send(JSON.stringify({
        type,
        deviceId,
        data,
        ts: new Date().toISOString(),
      }));
    };

    fastify.emitter.on('mqtt:message', onMqttMessage);

    socket.on('close', () => {
      fastify.emitter.removeListener('mqtt:message', onMqttMessage);
    });

    socket.on('error', (err) => {
      fastify.log.warn({ err: err.message }, 'WebSocket client error');
      fastify.emitter.removeListener('mqtt:message', onMqttMessage);
    });
  });
}
