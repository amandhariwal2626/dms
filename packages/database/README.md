# @repo/database

Shared database infrastructure package.

## Purpose

Configures Prisma Client generation and exposes a NestJS `PrismaService`. The Prisma schema contains only the generator and PostgreSQL datasource.

## Commands

- `pnpm db:generate`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`

## Dependencies

- Prisma
- PostgreSQL
- NestJS common package

## Usage

Import `PrismaService` from `@repo/database` in future infrastructure modules. Do not add models or migrations until a domain module requires them.
