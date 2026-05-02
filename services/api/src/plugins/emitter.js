import fp from 'fastify-plugin';
import { EventEmitter } from 'node:events';

async function emitterPlugin(fastify) {
  const emitter = new EventEmitter();
  emitter.setMaxListeners(100); // one listener per connected WebSocket client
  fastify.decorate('emitter', emitter);
}

export default fp(emitterPlugin, { name: 'emitter' });
