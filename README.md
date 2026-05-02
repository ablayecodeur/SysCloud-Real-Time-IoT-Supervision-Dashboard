# SysCloud — Real-Time IoT Supervision Dashboard

[![CI](https://github.com/YOUR_USERNAME/SysCloud/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/SysCloud/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](docker-compose.yml)
[![InfluxDB](https://img.shields.io/badge/InfluxDB-2.7-22ADF6?logo=influxdb&logoColor=white)](https://www.influxdata.com/)
[![Grafana](https://img.shields.io/badge/Grafana-10.4-F46800?logo=grafana&logoColor=white)](https://grafana.com/)
[![MQTT](https://img.shields.io/badge/MQTT-Mosquitto-660066?logo=eclipse-mosquitto&logoColor=white)](https://mosquitto.org/)

A production-ready IoT supervision platform that collects sensor data via **MQTT**, stores it in **InfluxDB**, visualizes it in **Grafana**, and exposes a **Next.js** real-time dashboard — all orchestrated with **Docker Compose**.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Cloud Infrastructure                            │
│                                                                         │
│  IoT Devices / Simulator                                                │
│       │  MQTT publish (QoS 1)                                           │
│       ▼                                                                 │
│  ┌──────────────┐    subscribe     ┌─────────────────┐                  │
│  │   Mosquitto  │◄────────────────│  MQTT Consumer  │                  │
│  │  MQTT Broker │                 │   (Node.js)     │                  │
│  └──────┬───────┘                 └────────┬────────┘                  │
│         │ relay                            │ write                     │
│         │                                 ▼                            │
│         │                        ┌─────────────────┐                   │
│         │                        │    InfluxDB 2   │                   │
│         │                        │  (time-series)  │                   │
│         │                        └────────┬────────┘                   │
│         │                                 │ Flux query                 │
│         │                        ┌────────┴────────┐                   │
│         │                        │     Grafana     │                   │
│         │                        │   (dashboards)  │                   │
│         │                        └─────────────────┘                   │
│         │                                                               │
│         │ subscribe              ┌─────────────────┐                   │
│         └───────────────────────►│   Fastify API   │◄── REST / WS      │
│                                  │ (REST+WebSocket)│                   │
│                                  └────────┬────────┘                   │
│                                           │ WebSocket                  │
│                                  ┌────────▼────────┐                   │
│                                  │  Next.js 15     │                   │
│                                  │   Dashboard     │                   │
│                                  └─────────────────┘                   │
│                                                                         │
│                         ┌──────────────────────┐                       │
│                         │   Nginx (prod only)  │  :80 / :443           │
│                         └──────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data flow

| Step | Component | Detail |
|------|-----------|--------|
| 1 | **IoT Device** | Publishes JSON telemetry to `syscloud/devices/{id}/telemetry` (QoS 1) |
| 2 | **MQTT Consumer** | Subscribes, parses, detects threshold violations, writes to InfluxDB |
| 3 | **InfluxDB** | Stores `telemetry`, `device_status`, `alerts` measurements |
| 4 | **Grafana** | Queries via Flux, renders pre-provisioned dashboards |
| 5 | **Fastify API** | Queries InfluxDB for REST responses; relays MQTT events over WebSocket |
| 6 | **Next.js** | Server-rendered pages + client-side real-time updates via WebSocket |

### MQTT topic schema

```
syscloud/devices/{device_id}/telemetry   ← sensor readings (temperature, humidity, …)
syscloud/devices/{device_id}/status      ← online flag, battery, RSSI, uptime
```

### InfluxDB data model

| Measurement | Tags | Fields |
|-------------|------|--------|
| `telemetry` | `device_id`, `location`, `firmware` | `temperature`, `humidity`, `pressure`, `co2`, `battery` |
| `device_status` | `device_id` | `online`, `battery`, `rssi`, `uptime` |
| `alerts` | `device_id`, `field`, `severity` | `value`, `threshold_min`, `threshold_max`, `message` |

---

## Stack

| Layer | Technology |
|-------|-----------|
| Message broker | [Eclipse Mosquitto 2.x](https://mosquitto.org/) |
| Time-series DB | [InfluxDB 2.7](https://www.influxdata.com/) (Flux query language) |
| Visualization | [Grafana 10.4](https://grafana.com/) (auto-provisioned) |
| MQTT consumer | Node.js 20 — `mqtt` + `@influxdata/influxdb-client` |
| API | [Fastify 4](https://fastify.dev/) + `@fastify/websocket` |
| Frontend | [Next.js 15](https://nextjs.org/) (App Router, React 19, Tailwind CSS v4) |
| Charts | [Recharts](https://recharts.org/) |
| Reverse proxy | Nginx 1.25 (production) |
| Containers | Docker Compose v2 |
| CI/CD | GitHub Actions |

---

## Quick start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) ≥ 24 with Compose v2
- `make`, `openssl`, `jq`

### 1 — Clone & setup

```bash
git clone https://github.com/YOUR_USERNAME/SysCloud.git
cd SysCloud

make setup   # copies .env.example → .env and generates strong secrets
```

### 2 — Start (without simulator)

```bash
make dev
```

### 3 — Start with IoT simulator

The simulator creates **5 virtual devices** publishing telemetry every 5 seconds (3% chance of anomaly to trigger alerts):

```bash
make dev-sim
```

### 4 — Access the services

| Service | URL | Credentials |
|---------|-----|-------------|
| **Dashboard** | http://localhost:3000 | — |
| **API** | http://localhost:4000 | — |
| **Grafana** | http://localhost:3001 | `admin` / see `.env` |
| **InfluxDB** | http://localhost:8086 | `admin` / see `.env` |
| **MQTT** | `localhost:1883` | see `.env` |

---

## Development

```bash
make logs           # tail all container logs
make logs-api       # tail API logs only
make logs-consumer  # tail MQTT consumer logs

make mqtt-pub       # publish a test telemetry message
make influx-query   # open InfluxDB Flux REPL

make restart-api    # restart API container without rebuilding
make down           # stop all containers
make clean          # full cleanup (volumes + images)
```

### Publish a custom device event

```bash
docker exec syscloud-mqtt mosquitto_pub \
  -u "$MQTT_USER" -P "$MQTT_PASSWORD" \
  -t "syscloud/devices/my-device/telemetry" \
  -m '{
    "deviceId": "my-device",
    "location": "lab",
    "sensors": {
      "temperature": 75.0,
      "humidity": 45.0,
      "battery": 8.0
    }
  }'
```

This will:
- Write to InfluxDB
- Trigger a `critical` alert (temperature > 60°C, battery < 10%)
- Appear in Grafana within 10 seconds
- Push to connected WebSocket clients in real-time

---

## Production deployment

```bash
# On your server
cp .env.example .env
# Edit .env: set DOMAIN, strong secrets, LOG_LEVEL=warn

make prod
```

The production stack adds **Nginx** as a reverse proxy with TLS termination:

```
https://your-domain.com/          → Next.js frontend
https://your-domain.com/api/      → Fastify API + WebSocket
https://your-domain.com/grafana/  → Grafana
```

SSL certificates: place `cert.pem` and `key.pem` in `./ssl/`.

### GitHub Actions CD

Configure these repository secrets for automatic deploy on tagged release:

| Secret | Description |
|--------|-------------|
| `SSH_HOST` | Production server IP or hostname |
| `SSH_USER` | SSH user |
| `SSH_PRIVATE_KEY` | Private key for SSH access |

Then:

```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## Grafana dashboard

The `iot-overview` dashboard is **auto-provisioned** and includes:

- Total / online device count
- Active alert count (24h)
- Average temperature (stat)
- Temperature time-series (all devices)
- Humidity time-series (all devices)
- CO₂ levels time-series
- Battery gauges per device
- Alert log table with severity coloring
- Device filter variable (dropdown)

Auto-refresh: **10 seconds**.

---

## Configuration

All configuration lives in `.env`. See `.env.example` for the full reference.

### Alert thresholds

Thresholds are defined in [`services/mqtt-consumer/src/parsers.js`](services/mqtt-consumer/src/parsers.js):

```js
export const THRESHOLDS = {
  temperature: { min: -20, max: 60,   unit: '°C' },
  humidity:    { min: 0,   max: 100,  unit: '%'  },
  pressure:    { min: 800, max: 1100, unit: 'hPa'},
  co2:         { min: 0,   max: 2000, unit: 'ppm'},
  battery:     { min: 10,  max: 100,  unit: '%'  },
};
```

---

## Project structure

```
SysCloud/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml              # Lint + build + smoke test
│   │   └── cd.yml              # GHCR publish + SSH deploy
│   └── ISSUE_TEMPLATE/
├── services/
│   ├── mqtt-broker/            # Mosquitto config & Dockerfile
│   ├── mqtt-consumer/          # MQTT → InfluxDB bridge (Node.js)
│   ├── api/                    # Fastify REST + WebSocket API
│   └── simulator/              # Virtual IoT device fleet (dev)
├── grafana/
│   ├── provisioning/           # Auto-configured datasource & dashboards
│   └── dashboards/             # iot-overview.json
├── nginx/
│   └── nginx.prod.conf         # Production reverse proxy
├── frontend/                   # Next.js 15 dashboard
│   └── src/
│       ├── app/                # App Router pages
│       ├── components/         # UI components
│       ├── hooks/              # useWebSocket
│       ├── lib/                # api.ts, utils.ts
│       └── types/              # Shared TypeScript types
├── scripts/
│   └── setup.sh                # First-time secret generation
├── docker-compose.yml          # Development stack
├── docker-compose.prod.yml     # Production stack
├── .env.example                # Configuration reference
└── Makefile                    # Developer commands
```

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes
4. Push and open a Pull Request using the provided template

Please make sure `make lint` passes before submitting.

---

## License

[MIT](LICENSE) — Abdoulaye, 2024
