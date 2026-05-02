import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import websocket from '@fastify/websocket';
import emitterPlugin from './plugins/emitter.js';
import influxPlugin from './plugins/influx.js';
import mqttRelayPlugin from './plugins/mqttRelay.js';
import devicesRoutes from './routes/devices.js';
import metricsRoutes from './routes/metrics.js';
import alertsRoutes from './routes/alerts.js';
import streamRoutes from './routes/stream.js';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    base: { service: 'api' },
    timestamp: true,
  },
});

// ─── Plugins ──────────────────────────────────────────────────────────────────
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
});
await fastify.register(sensible);
await fastify.register(websocket);
await fastify.register(emitterPlugin);   // shared EventEmitter: fastify.emitter
await fastify.register(influxPlugin);
await fastify.register(mqttRelayPlugin);

// ─── Routes ───────────────────────────────────────────────────────────────────
fastify.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

await fastify.register(devicesRoutes, { prefix: '/api/v1' });
await fastify.register(metricsRoutes, { prefix: '/api/v1' });
await fastify.register(alertsRoutes,  { prefix: '/api/v1' });
await fastify.register(streamRoutes,  { prefix: '/api/v1' });

// ─── Start ────────────────────────────────────────────────────────────────────
const port = Number(process.env.PORT ?? 4000);

try {
  await fastify.listen({ port, host: '0.0.0.0' });
} catch (err) {
  fastify.log.fatal(err);
  process.exit(1);
}

async function shutdown(signal) {
  fastify.log.info({ signal }, 'Shutting down');
  await fastify.close();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
