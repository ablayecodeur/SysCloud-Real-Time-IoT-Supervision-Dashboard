.PHONY: help dev dev-sim prod down logs ps clean setup lint test

COMPOSE      = docker compose
COMPOSE_DEV  = $(COMPOSE) -f docker-compose.yml
COMPOSE_PROD = $(COMPOSE) -f docker-compose.prod.yml

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

setup: ## First-time setup: copy .env and generate passwords
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✓ .env created — update secrets before running"; \
	else \
		echo "✓ .env already exists"; \
	fi
	@chmod +x scripts/setup.sh
	@bash scripts/setup.sh

dev: ## Start all services (without simulator)
	$(COMPOSE_DEV) up --build -d
	@echo ""
	@echo "  Frontend  → http://localhost:3000"
	@echo "  API       → http://localhost:4000"
	@echo "  Grafana   → http://localhost:3001"
	@echo "  InfluxDB  → http://localhost:8086"
	@echo "  MQTT      → localhost:1883"

dev-sim: ## Start all services + IoT simulator
	$(COMPOSE_DEV) --profile dev up --build -d
	@echo "  Simulator running with $${SIMULATOR_DEVICE_COUNT:-5} virtual devices"

prod: ## Start production stack
	$(COMPOSE_PROD) up --build -d

down: ## Stop and remove containers
	$(COMPOSE_DEV) --profile dev down

down-prod: ## Stop production stack
	$(COMPOSE_PROD) down

logs: ## Tail all logs
	$(COMPOSE_DEV) logs -f

logs-%: ## Tail logs for a specific service (e.g. make logs-api)
	$(COMPOSE_DEV) logs -f $*

ps: ## Show running containers
	$(COMPOSE_DEV) ps

restart-%: ## Restart a specific service
	$(COMPOSE_DEV) restart $*

clean: ## Remove containers, volumes and images
	$(COMPOSE_DEV) --profile dev down -v --rmi local
	@echo "✓ Clean complete"

mqtt-pub: ## Publish a test MQTT message
	@docker exec syscloud-mqtt mosquitto_pub \
		-u "$${MQTT_USER}" -P "$${MQTT_PASSWORD}" \
		-t "syscloud/devices/test-001/telemetry" \
		-m '{"deviceId":"test-001","sensors":{"temperature":22.5,"humidity":60}}'

influx-query: ## Open InfluxDB query shell
	@docker exec -it syscloud-influxdb influx query

lint: ## Run linters for all services
	cd services/mqtt-consumer && npm run lint
	cd services/api && npm run lint
	cd frontend && npm run lint

test: ## Run all tests
	cd services/mqtt-consumer && npm test
	cd services/api && npm test
	cd frontend && npm test -- --passWithNoTests

build-frontend: ## Build frontend image only
	$(COMPOSE_DEV) build frontend
