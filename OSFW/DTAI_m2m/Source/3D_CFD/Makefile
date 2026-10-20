COMPOSE = docker compose --env-file .env
STANDALONE_COMPOSE = $(COMPOSE) -f docker-compose.standalone.yml

.PHONY: up down standalone-up standalone-down

up:
	DOCKER_BUILDKIT=1 $(COMPOSE) up -d --build --wait --wait-timeout 1800

down:
	$(COMPOSE) down

standalone-up:
	DOCKER_BUILDKIT=1 $(STANDALONE_COMPOSE) up -d --build --wait --wait-timeout 1800

standalone-down:
	$(STANDALONE_COMPOSE) down
