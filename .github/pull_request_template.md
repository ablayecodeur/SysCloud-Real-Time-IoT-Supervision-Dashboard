## Summary

<!-- What does this PR do? Why? -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor / cleanup
- [ ] Documentation
- [ ] DevOps / infrastructure

## Testing

- [ ] `make dev-sim` — all services start without errors
- [ ] New data flows from MQTT → InfluxDB (check `make influx-query`)
- [ ] Grafana dashboard reflects changes
- [ ] Frontend shows correct data
- [ ] `make lint` passes

## Checklist

- [ ] Secrets are NOT hardcoded (use `.env`)
- [ ] Docker images build successfully
- [ ] `docker-compose.prod.yml` is updated if infrastructure changed
- [ ] Documentation / README updated if needed
