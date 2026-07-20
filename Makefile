.PHONY: help install dev test test-watch build type-check lint deploy seed clean

help:
	@echo "Disaster Relief Exchange - Build Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install      - Install dependencies"
	@echo "  make dev          - Run local development server"
	@echo "  make type-check   - Type-check TypeScript without building"
	@echo ""
	@echo "Testing:"
	@echo "  make test         - Run test suite once"
	@echo "  make test-watch   - Run tests in watch mode"
	@echo ""
	@echo "Building:"
	@echo "  make build        - Compile TypeScript to JavaScript"
	@echo "  make clean        - Remove build artifacts"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy       - Deploy to Cloudflare Workers (production)"
	@echo "  make deploy-dev   - Deploy to development environment"
	@echo ""
	@echo "Database:"
	@echo "  make seed         - Populate database with test data"
	@echo "  make migrate      - Run database migrations"
	@echo ""

install:
	bun install

dev:
	bun run dev

test:
	bun test

test-watch:
	bun run test:watch

build: type-check
	bun run build:ts

type-check:
	bun run type-check

deploy: build
	wrangler deploy

deploy-dev: build
	wrangler deploy --env development

seed:
	@echo "Seeding database with test data..."
	bun run src/scripts/seed.ts

migrate:
	@echo "Running database migrations..."
	wrangler migrations apply --local

clean:
	rm -rf dist/
	rm -rf node_modules/
	rm -rf .wrangler/

lint:
	@echo "Running type checks..."
	bun run type-check

all: clean install build test
	@echo "Build complete!"

.DEFAULT_GOAL := help
