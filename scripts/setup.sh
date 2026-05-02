#!/usr/bin/env bash
set -euo pipefail

BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

info()  { echo -e "${GREEN}✓${RESET} $*"; }
warn()  { echo -e "${YELLOW}!${RESET} $*"; }
error() { echo -e "${RED}✗${RESET} $*" >&2; }

echo -e "\n${BOLD}SysCloud — First-time setup${RESET}\n"

# ─── Prerequisites check ──────────────────────────────────────────────────────
for cmd in docker jq openssl; do
  if ! command -v "$cmd" &>/dev/null; then
    error "Required tool not found: $cmd"
    exit 1
  fi
done

DOCKER_VERSION=$(docker compose version --short 2>/dev/null || echo "0")
info "Docker Compose $DOCKER_VERSION"

# ─── Generate strong secrets in .env ─────────────────────────────────────────
ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
  error ".env not found — run: cp .env.example .env"
  exit 1
fi

generate_secret() {
  openssl rand -hex 32
}

replace_placeholder() {
  local placeholder="$1"
  local value="$2"
  # macOS-compatible sed
  sed -i.bak "s|${placeholder}|${value}|g" "$ENV_FILE" && rm -f "${ENV_FILE}.bak"
}

# Only replace if still using placeholder values
if grep -q "change_me_mqtt_password" "$ENV_FILE"; then
  replace_placeholder "change_me_mqtt_password" "$(generate_secret)"
  info "Generated MQTT password"
fi

if grep -q "change_me_influx_password" "$ENV_FILE"; then
  replace_placeholder "change_me_influx_password" "$(generate_secret)"
  info "Generated InfluxDB password"
fi

if grep -q "change_me_influx_super_secret_token" "$ENV_FILE"; then
  replace_placeholder "change_me_influx_super_secret_token" "$(generate_secret)"
  info "Generated InfluxDB token"
fi

if grep -q "change_me_grafana_password" "$ENV_FILE"; then
  replace_placeholder "change_me_grafana_password" "$(generate_secret)"
  info "Generated Grafana password"
fi

if grep -q "change_me_jwt_super_secret_key_32chars_min" "$ENV_FILE"; then
  replace_placeholder "change_me_jwt_super_secret_key_32chars_min" "$(generate_secret)"
  info "Generated JWT secret"
fi

# ─── Create Mosquitto password file ──────────────────────────────────────────
MQTT_USER=$(grep '^MQTT_USER=' "$ENV_FILE" | cut -d= -f2)
MQTT_PASS=$(grep '^MQTT_PASSWORD=' "$ENV_FILE" | cut -d= -f2)
PASSWD_FILE="services/mqtt-broker/config/mosquitto.passwd"

if docker image inspect eclipse-mosquitto:2.0.18-openssl &>/dev/null 2>&1; then
  docker run --rm \
    -v "$(pwd)/services/mqtt-broker/config:/mosquitto/config" \
    eclipse-mosquitto:2.0.18-openssl \
    mosquitto_passwd -b -c /mosquitto/config/mosquitto.passwd "$MQTT_USER" "$MQTT_PASS"
  info "Created Mosquitto password file for user: $MQTT_USER"
else
  warn "Mosquitto image not pulled yet — password file will be created on first \`make dev\`"
  warn "Or run: docker pull eclipse-mosquitto:2.0.18-openssl && bash scripts/setup.sh"
fi

echo ""
echo -e "${BOLD}Setup complete.${RESET} Run ${BOLD}make dev${RESET} to start (or ${BOLD}make dev-sim${RESET} to include the IoT simulator)."
echo ""
GRAFANA_PASS=$(grep '^GRAFANA_PASSWORD=' "$ENV_FILE" | cut -d= -f2)
echo "  Grafana credentials: admin / ${GRAFANA_PASS:0:8}..."
echo ""
