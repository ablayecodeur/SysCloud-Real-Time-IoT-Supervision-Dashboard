import { createMqttClient } from './mqttClient.js';
import { InfluxWriter } from './influxWriter.js';
import { parseTelemetry, parseStatus, detectAlerts } from './parsers.js';
import { logger } from './logger.js';

const writer = new InfluxWriter();

const mqttClient = createMqttClient({
  onTelemetry(topic, payload) {
    const telemetry = parseTelemetry(topic, payload);
    if (!telemetry) {
      logger.warn({ topic }, 'Failed to parse telemetry payload');
      return;
    }

    writer.writeTelemetry(telemetry);

    const alerts = detectAlerts(telemetry.deviceId, telemetry.sensors);
    for (const alert of alerts) {
      writer.writeAlert(alert);
    }
  },

  onStatus(topic, payload) {
    const status = parseStatus(topic, payload);
    if (!status) {
      logger.warn({ topic }, 'Failed to parse status payload');
      return;
    }
    writer.writeStatus(status);
  },
});

async function shutdown(signal) {
  logger.info({ signal }, 'Shutting down gracefully');
  mqttClient.end(true);
  await writer.flush();
  await writer.close();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.fatal({ error: err.message, stack: err.stack }, 'Uncaught exception');
  process.exit(1);
});

logger.info('MQTT consumer started');
