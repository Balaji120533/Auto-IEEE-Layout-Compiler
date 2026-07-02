.PHONY: install dev test schema-check

install:
	pnpm install
	uv --directory engine sync

dev:
	pnpm dev

test:
	pnpm --filter gateway test
	uv --directory engine run pytest

schema-check:
	node scripts/schema-check.mjs
