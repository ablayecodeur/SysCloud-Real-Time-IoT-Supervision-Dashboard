import fp from 'fastify-plugin';
import { InfluxDB } from '@influxdata/influxdb-client';

async function influxPlugin(fastify) {
  const client = new InfluxDB({
    url: process.env.INFLUXDB_URL,
    token: process.env.INFLUXDB_TOKEN,
  });

  const queryApi = client.getQueryApi(process.env.INFLUXDB_ORG);
  const bucket  = process.env.INFLUXDB_BUCKET;

  fastify.decorate('influx', { queryApi, bucket });
}

export default fp(influxPlugin, { name: 'influx' });
