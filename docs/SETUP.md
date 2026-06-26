# Setup

## Prerequisites

- Node.js 22 LTS or newer
- pnpm 10
- PostgreSQL for future database-backed modules

## Install

```bash
pnpm install
cp .env.example .env
pnpm --filter @repo/database db:generate
```

## Development

```bash
pnpm dev
```

The web app runs on `http://localhost:3000`. The API defaults to `http://localhost:3001`.

## Validation

```bash
pnpm lint
pnpm typecheck
pnpm build
```
