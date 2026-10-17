.PHONY: setup dev check e2e build

setup:
	cd backend && mix deps.get
	cd assets && npm ci && npm run build

dev:
	bash scripts/dev.sh

check:
	cd backend && mix format --check-formatted && mix compile --warnings-as-errors && mix test
	cd assets && npm run format:check && npm run build && npm audit --audit-level=high

e2e:
	cd assets && npm run build && npm run test:e2e

build:
	cd assets && npm run build
	cd backend && MIX_ENV=prod mix compile --warnings-as-errors
