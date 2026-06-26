# Database Guide

## Scope

`packages/database` configures Prisma for PostgreSQL and exposes a NestJS `PrismaService`.

## Schema Rules

The Prisma schema must contain only:

- `generator client`
- `datasource db`

Do not add Prisma models, domain entities, or migrations in the foundation layer.

## Commands

```bash
pnpm --filter @repo/database db:generate
pnpm --filter @repo/database typecheck
```

## Future Modules

Future business modules may introduce models and migrations through explicit module work. Keep those changes separate from foundation maintenance.
