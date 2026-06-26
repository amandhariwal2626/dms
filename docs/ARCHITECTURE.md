# Architecture Overview

## Purpose

This repository is a Document Management System (DMS) built as a monorepo. It provides a Next.js frontend, a NestJS API backend, and shared packages for database access, types, and UI primitives.

## High-Level Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  apps/web   │────▶│  apps/api   │────▶│  PostgreSQL  │
│  (Next.js)  │◀────│  (NestJS)   │     │  (via Prisma)│
└─────────────┘     └─────────────┘     └──────────────┘
       │                    │
       │ workspace:*        │ workspace:*
       ▼                    ▼
┌──────────────┐    ┌──────────────┐
│ shared-types │    │  database    │
└──────────────┘    └──────────────┘
       │
       ▼
┌──────────────┐
│     ui       │
└──────────────┘
```

## Key Decisions

### Base UI over `asChild`

All shadcn components use Base UI's `render` prop instead of React's `asChild` pattern. This ensures composability without polluting the child's props. See `apps/web/src/components/ui/`.

### sidebar-16 Layout

The app uses the shadcn sidebar-16 variant: a sticky header with a full-height sidebar below it. The sidebar uses `collapsible="offcanvas"` and is toggled via `SidebarTrigger` in the header.

### No Business Logic in Infrastructure

`packages/database`, `packages/shared-types`, `packages/ui`, and the shared config packages contain zero business logic. Business functionality lives in `apps/web/src/features/` and `apps/api/src/modules/`.

## Technology Stack

| Layer            | Technology                          | Version |
| ---------------- | ----------------------------------- | ------- |
| Frontend         | Next.js (App Router)                | 15      |
| Backend          | NestJS                              | 11      |
| ORM              | Prisma                              | Latest  |
| UI Framework     | Tailwind CSS                        | 4       |
| UI Components    | shadcn/ui + @base-ui/react          | Latest  |
| Server State     | TanStack Query                      | 5       |
| Client State     | Zustand                             | 5       |
| Forms            | React Hook Form + Zod               | Latest  |
| Validation (API) | class-validator + class-transformer | Latest  |
| API Docs         | Swagger / OpenAPI                   | Latest  |
| Monorepo         | Turborepo                           | Latest  |
| Package Mgr      | pnpm                                | Latest  |
| Language         | TypeScript (strict)                 | 5.8+    |

## Build Graph

```
                    build
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
    eslint-config  typescript-config
         │            │
         └─────┬──────┘
               ▼
         shared-types
               │
         ┌─────┴─────┐
         ▼           ▼
      database      ui
         │           │
         └─────┬─────┘
               ▼
         ┌─────┴─────┐
         ▼           ▼
      apps/web   apps/api
```

## Folder Layout

```
DMS MonoRepo/
├── apps/
│   ├── web/          # Next.js App Router
│   └── api/          # NestJS REST API
├── packages/
│   ├── database/     # Prisma schema + client
│   ├── shared-types/ # DTOs, enums, contracts
│   ├── ui/           # Base UI primitives (framework-agnostic)
│   ├── eslint-config/
│   └── typescript-config/
├── docs/             # Guides & ADRs
└── AGENTS.md         # Architectural governance
```
