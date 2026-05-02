/**
 * GET /metrics?deviceId=&field=&start=&stop=&window=
 *   Query historical telemetry with aggregation.
 *
 * GET /metrics/latest?deviceId=
 *   Last known sensor values per device.
 */
export default async function metricsRoutes(fastify) {
  fastify.get('/metrics', async (request, reply) => {
    const {
      deviceId,
      field,
      start  = '-1h',
      stop   = 'now()',
      window = '1m',
    } = request.query;

    let deviceFilter = '';
    if (deviceId) deviceFilter = `|> filter(fn: (r) => r.device_id == "${deviceId}")`;

    let fieldFilter = '';
    if (field) fieldFilter = `|> filter(fn: (r) => r._field == "${field}")`;

    const flux = `
      from(bucket: "${fastify.influx.bucket}")
        |> range(start: ${start}, stop: ${stop})
        |> filter(fn: (r) => r._measurement == "telemetry")
        ${deviceFilter}
        ${fieldFilter}
        |> aggregateWindow(every: ${window}, fn: mean, createEmpty: false)
        |> yield(name: "mean")
    `;

    const rows = await collectFluxRows(fastify.influx.queryApi, flux);
    return reply.send({ data: rows });
  });

  fastify.get('/metrics/latest', async (request, reply) => {
    const { deviceId } = request.query;

    let deviceFilter = '';
    if (deviceId) deviceFilter = `|> filter(fn: (r) => r.device_id == "${deviceId}")`;

    const flux = `
      from(bucket: "${fastify.influx.bucket}")
        |> range(start: -5m)
        |> filter(fn: (r) => r._measurement == "telemetry")
        ${deviceFilter}
        |> last()
        |> pivot(rowKey: ["device_id"], columnKey: ["_field"], valueColumn: "_value")
        |> keep(columns: ["device_id", "location", "temperature", "humidity", "pressure", "co2", "battery", "_time"])
    `;

    const rows = await collectFluxRows(fastify.influx.queryApi, flux);
    return reply.send({ data: rows });
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
