/**
 * GET /alerts?deviceId=&severity=&start=&limit=
 *   List recent alert events from InfluxDB.
 */
export default async function alertsRoutes(fastify) {
  fastify.get('/alerts', async (request, reply) => {
    const {
      deviceId,
      severity,
      start = '-24h',
      limit = '100',
    } = request.query;

    let filters = '';
    if (deviceId) filters += `|> filter(fn: (r) => r.device_id == "${deviceId}")\n`;
    if (severity) filters += `|> filter(fn: (r) => r.severity == "${severity}")\n`;

    const flux = `
      from(bucket: "${fastify.influx.bucket}")
        |> range(start: ${start})
        |> filter(fn: (r) => r._measurement == "alerts")
        |> filter(fn: (r) => r._field == "value")
        ${filters}
        |> sort(columns: ["_time"], desc: true)
        |> limit(n: ${parseInt(limit, 10)})
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
    `;

    const rows = await collectFluxRows(fastify.influx.queryApi, flux);
    return reply.send({ alerts: rows });
  });

  fastify.get('/alerts/summary', async (request, reply) => {
    const flux = `
      from(bucket: "${fastify.influx.bucket}")
        |> range(start: -24h)
        |> filter(fn: (r) => r._measurement == "alerts")
        |> filter(fn: (r) => r._field == "value")
        |> group(columns: ["severity"])
        |> count()
        |> group()
    `;

    const rows = await collectFluxRows(fastify.influx.queryApi, flux);
    const summary = rows.reduce((acc, r) => {
      acc[r.severity ?? 'unknown'] = r._value;
      return acc;
    }, { warning: 0, critical: 0 });

    return reply.send({ summary });
  });
}

function collectFluxRows(queryApi, flux) {
  return new Promise((resolve, reject) => {
    const rows = [];
    queryApi.queryRows(flux, {
      next(row, tableMeta) { rows.push(tableMeta.toObject(row)); },
      error: reject,
      complete() { resolve(rows); },
    });
  });
}
