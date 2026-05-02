/**
 * GET /devices          — list all known devices with their latest status
 * GET /devices/:id      — single device details + last telemetry
 */
export default async function devicesRoutes(fastify) {
  const schema = {
    list: {
      response: {
        200: {
          type: 'object',
          properties: {
            devices: { type: 'array' },
          },
        },
      },
    },
  };

  fastify.get('/devices', { schema: schema.list }, async (request, reply) => {
    const flux = `
      from(bucket: "${fastify.influx.bucket}")
        |> range(start: -24h)
        |> filter(fn: (r) => r._measurement == "device_status")
        |> filter(fn: (r) => r._field == "online" or r._field == "battery")
        |> last()
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> keep(columns: ["device_id", "online", "battery", "_time"])
    `;

    const devices = await collectFluxRows(fastify.influx.queryApi, flux);
    return reply.send({ devices });
  });

  fastify.get('/devices/:id', async (request, reply) => {
    const { id } = request.params;

    const flux = `
      from(bucket: "${fastify.influx.bucket}")
        |> range(start: -1h)
        |> filter(fn: (r) => r._measurement == "telemetry")
        |> filter(fn: (r) => r.device_id == "${id}")
        |> last()
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
    `;

    const rows = await collectFluxRows(fastify.influx.queryApi, flux);
    if (rows.length === 0) return reply.notFound(`Device ${id} not found`);

    return reply.send({ device: rows[0] });
  });
}

function collectFluxRows(queryApi, flux) {
  return new Promise((resolve, reject) => {
    const rows = [];
    queryApi.queryRows(flux, {
      next(row, tableMeta) {
        rows.push(tableMeta.toObject(row));
      },
      error: reject,
      complete() {
        resolve(rows);
      },
    });
  });
}
