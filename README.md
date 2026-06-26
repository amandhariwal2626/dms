# Monorepo Foundation

Production-grade TypeScript monorepo foundation for future application modules.

This repository intentionally contains no business modules, no domain entities, no CRUD APIs, no Prisma models, and no migrations.

## Stack

- Turborepo
- pnpm workspaces
- Next.js 15 App Router
- Tailwind CSS v4
- Base UI primitives
- NestJS REST API
- Prisma with PostgreSQL datasource only

## Getting Started

```bash
pnpm install
cp .env.example .env
pnpm --filter @repo/database db:generate
pnpm dev
```

## Workspaces

- `apps/web` - Next.js frontend shell
- `apps/api` - NestJS API foundation
- `packages/database` - Prisma and NestJS Prisma service setup
- `packages/shared-types` - Shared API and utility types
- `packages/ui` - Foundational UI components
- `packages/eslint-config` - Shared flat ESLint configs
- `packages/typescript-config` - Shared strict TypeScript configs

## Root Commands

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm format`

## Documentation

See `docs/` for setup, architecture, frontend, backend, database, and contribution guides.
