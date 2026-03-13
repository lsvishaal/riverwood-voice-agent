# Riverwood Voice Agent
.PHONY: help install dev dev-frontend build build-fresh up down logs logs-api logs-frontend

help: ## show available targets
	@awk 'BEGIN {FS = ":.*##"; print "Available targets:"} /^[a-zA-Z0-9_-]+:.*##/ {printf "  %-14s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## uv sync
	uv sync

dev: ## run backend locally with hot-reload
	uv run uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload

dev-frontend: ## run frontend locally (cd frontend && npm run dev)
	cd frontend && npm run dev

build: ## docker build both services (cached)
	docker compose build

build-fresh: ## docker build both services (no cache)
	docker compose build --no-cache

up: ## start all containers (api + frontend)
	docker compose up --build -d

down: ## stop all containers
	docker compose down

logs: ## tail logs for all services
	docker compose logs -f

logs-api: ## tail backend logs only
	docker compose logs -f api

logs-frontend: ## tail frontend logs only
	docker compose logs -f frontend
