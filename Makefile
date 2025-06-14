# Variables
ENV ?= dev
-include .env
-include .env.$(ENV)
-include .env.local

# To pass extra arguments, call with: make install ARGS="arg1 arg2 ..."
install:
	@echo "Installing client dependencies"
	@pnpm install 

build:
	@echo "Building common"
	@pnpm --filter common build
	@echo "Building ai server"
	@pnpm --filter ai-server build
	@echo "Packaging Binaries"
	@pnpm binaries

client-dev:
	@echo "Running dev client"
	@pnpm dev

ai-server-dev:
	@echo "Running dev ai server"
	@pnpm --filter ai-server dev

ai-server-add:
	@echo "Adding ai server dependencies"
	@pnpm --filter ai-server add $(ARGS)

ai-server-build:
	@echo "Building ai server"
	@pnpm --filter ai-server build

drizzle-check:
	@echo "Checking drizzle database"
	@pnpm --filter ai-server db:check

drizzle-generate:
	@echo "Generating drizzle database"
	@pnpm --filter ai-server db:generate

drizzle-migrate:
	@echo "Running drizzle database migration"
	@pnpm --filter ai-server db:migrate

drizzle-pull:
	@echo "Pulling drizzle database"
	@pnpm --filter ai-server db:pull

drizzle-push:
	@echo "Pushing drizzle database"
	@pnpm --filter ai-server db:push

drizzle-studio:
	@echo "Running drizzle database studio"
	@pnpm --filter ai-server db:studio

drizzle-up:
	@echo "Running drizzle database up"
	@pnpm --filter ai-server db:up

app-dev:
	@echo "Running dev app"
	@pnpm app:dev

app-build:
	@echo "Building build app"
	@pnpm app:build

git-hooks:
	@echo "Initializing git hooks"
	@pnpm husky init
	@npm pkg set scripts.commitlint="commitlint --edit"
	@echo npm run commitlint > .husky/commit-msg
	@echo lint-staged > .husky/pre-commit

git-commit:
	@pnpm format
	@pnpm check
	@git add .
	@git commit -m "$(ARGS)"
	@git push -u origin main

git-init:
	@git init
	@git add .
	@git commit -m "feat: init"
	@git branch -M main
	@git remote add origin https://github.com/fantienan/ai-dashboard.git
	@git push -u origin main

lint:
	@echo "Running lint"
	@pnpm lint-staged
	@cargo fmt --all 

rust-fmt:
	@cargo fmt --all 

web-server-dev:
	@echo "Running dev web server"
	@cargo run -p web_server

web-server-build:
	@echo "Building web server in release mode"
	@cargo build -p web_server --release


# https://github.com/SeaQL/sea-orm/tree/master/examples/axum_example/migration
sea-db-migrate-init:
	@echo "Running sea database migration"
	@cargo install sea-orm-cli
	@sea-orm-cli migrate init -d ${SEA_ROM_MIGRATION_PATH} -v -u ${DATABASE_URL}


sea-db-migrate-generate:
	@echo "Running sea database migration"
	@cargo install sea-orm-cli
	@sea-orm-cli migrate generate ${ARGS} --local-time -d ${SEA_ROM_MIGRATION_PATH} -u ${DATABASE_URL} -v

sea-db-entity-generate:
	@echo "Generating sea database generate entity"
	@echo "SQLITE_DATABASE_URL: ${DATABASE_URL}"
	@echo "SEA_ROM_ENTITY_PATH :${SEA_ROM_ENTITY_PATH}"
	@cargo install sea-orm-cli
	@sea-orm-cli generate entity -o ${SEA_ROM_ENTITY_PATH} -u ${DATABASE_URL} -v -l

common-build:
	@echo "Building common"
	@pnpm -C packages/common build

mdbook-serve:
	@echo "Running mdbook serve"
	@cd docs && mdbook serve -o -p 3002