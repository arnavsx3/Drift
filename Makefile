.PHONY: setup dev check e2e build

setup:
	cd backend && mix deps.get
	cd frontend && npm ci

dev:
	bash scripts/dev.sh

check:
	cd backend && mix format --check-formatted && mix compile --warnings-as-errors && mix test
	cd frontend && npm run format:check && npm test && npm run build && npm audit --audit-level=high

e2e:
	cd frontend && npm run test:e2e

build:
	cd frontend && npm run build
	cd backend && MIX_ENV=prod mix compile --warnings-as-errors
