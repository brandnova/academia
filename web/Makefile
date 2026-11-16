.PHONY: help run migrate shell docker-up docker-down docker-logs css dev dev-clean clean test superuser

help:
	@echo "Available commands:"
	@echo "  make help         - Show this help message"
	@echo "  make dev          - Start Next.js development server"
	@echo "  make dev-clean    - Clear the .next cache, then start dev"
	@echo "  make build        - Build Next.js project"

dev:
	npm run dev

dev-clean: clean
	npm run dev

clean:
	rm -rf .next

build:
	npm run build

