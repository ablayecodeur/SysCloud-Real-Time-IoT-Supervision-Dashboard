import { InfluxDB, Point } from '@influxdata/influxdb-client';
import { logger } from './logger.js';

export class InfluxWriter {
  #writeApi;

  constructor() {
    const client = new InfluxDB({
      url: process.env.INFLUXDB_URL,
      token: process.env.INFLUXDB_TOKEN,
    });

    this.#writeApi = client.getWriteApi(
      process.env.INFLUXDB_ORG,
      process.env.INFLUXDB_BUCKET,
      'ns',
      {
        batchSize: 50,
        flushInterval: 5000,
        maxRetries: 3,
        maxRetryDelay: 15000,
        writeFailed: (error, lines) => {
          logger.error({ error: error.message, lines: lines.length }, 'InfluxDB write failed');
        },
      },
    );
  }

  /**
   * Write telemetry data to InfluxDB.
   * @param {{ deviceId: string, location: string, firmware: string, timestamp: Date, sensors: object }} telemetry
   */
  writeTelemetry(telemetry) {
    const point = new Point('telemetry')
      .tag('device_id', telemetry.deviceId)
      .tag('location', telemetry.location)
      .tag('firmware', telemetry.firmware)
      .timestamp(telemetry.timestamp);

    for (const [field, value] of Object.entries(telemetry.sensors)) {
      point.floatField(field, value);
    }

    this.#writeApi.writePoint(point);
    logger.debug({ deviceId: telemetry.deviceId }, 'Telemetry written');
  }

  /**
   * Write device status to InfluxDB.
   * @param {{ deviceId: string, online: boolean, battery: number, rssi: number, uptime: number, timestamp: Date }} status
   */
  writeStatus(status) {
    const point = new Point('device_status')
      .tag('device_id', status.deviceId)
      .booleanField('online', status.online)
      .floatField('battery', status.battery)
      .intField('rssi', status.rssi)
      .intField('uptime', status.uptime)
      .timestamp(status.timestamp);

    this.#writeApi.writePoint(point);
    logger.debug({ deviceId: status.deviceId }, 'Status written');
  }

  /**
   * Write an alert event to InfluxDB.
   * @param {{ deviceId: string, field: string, value: number, severity: string, message: string, timestamp: Date }} alert
   */
  writeAlert(alert) {
    const point = new Point('alerts')
      .tag('device_id', alert.deviceId)
      .tag('field', alert.field)
      .tag('severity', alert.severity)
      .floatField('value', alert.value)
      .floatField('threshold_min', alert.threshold.min)
      .floatField('threshold_max', alert.threshold.max)
      .stringField('message', alert.message)
      .timestamp(alert.timestamp);

    this.#writeApi.writePoint(point);
    logger.warn({ deviceId: alert.deviceId, field: alert.field, severity: alert.severity }, alert.message);
  }

  async flush() {
    await this.#writeApi.flush();
  }

  async close() {
    await this.#writeApi.close();
    logger.info('InfluxDB write API closed');
  }
}
